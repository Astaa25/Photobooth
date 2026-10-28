import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import sensible from '@fastify/sensible';
import websocket from '@fastify/websocket';
import { env } from './config/env.js';
import { MockCameraDriver } from './drivers/camera/mock-camera.driver.js';
import { MockPrinterDriver } from './drivers/printer/mock-printer.driver.js';

export async function createServer() {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      redact: ['req.headers.authorization', 'req.headers.cookie', 'body.phone', 'body.pin'],
    },
    bodyLimit: 15 * 1024 * 1024, // 15 MB limit
  });

  await app.register(sensible);
  await app.register(cookie, {
    secret: env.SESSION_SECRET,
  });

  await app.register(cors, {
    origin: [env.WEB_ORIGIN, env.PUBLIC_BASE_URL],
    credentials: true,
  });

  await app.register(websocket);

  // Instansiasi Driver
  const cameraDriver = new MockCameraDriver();
  const printerDriver = new MockPrinterDriver();

  // Route Health Check
  app.get('/health', async () => {
    const cameraConnected = await cameraDriver.isConnected();
    const printerReady = await printerDriver.isReady();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      timezone: env.TZ,
      drivers: {
        camera: { name: cameraDriver.name, connected: cameraConnected },
        printer: { name: printerDriver.name, ready: printerReady },
      },
    };
  });

  // WebSocket Server Realtime
  app.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
      req.log.info('Klien WebSocket terhubung');

      socket.send(
        JSON.stringify({
          type: 'connection.ack',
          ts: new Date().toISOString(),
          payload: { message: 'Terhubung ke Photobooth WebSocket Server' },
        })
      );

      socket.on('message', (message: Buffer) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong', ts: new Date().toISOString() }));
          }
        } catch (err) {
          req.log.warn('Pesan WebSocket tidak valid');
        }
      });

      socket.on('close', () => {
        req.log.info('Klien WebSocket terputus');
      });
    });
  });

  // Tiga kelompok rute server (TECHSTACK.md & SECURITY.md A2)
  app.register(
    async (publicGroup) => {
      publicGroup.get('/info', async () => ({
        boothName: 'Photobooth Terintegrasi',
        mode: env.PUBLIC_MODE,
      }));
    },
    { prefix: '/public' }
  );

  app.register(
    async (tabletGroup) => {
      tabletGroup.get('/status', async () => ({
        paired: true,
        camera: cameraDriver.name,
      }));
    },
    { prefix: '/tablet' }
  );

  app.register(
    async (adminGroup) => {
      adminGroup.get('/stats', async () => ({
        activeSessions: 0,
        queuedVisitors: 0,
      }));
    },
    { prefix: '/admin' }
  );

  return app;
}

if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  createServer().then((app) => {
    app.listen({ host: env.API_HOST, port: env.API_PORT }, (err, address) => {
      if (err) {
        console.error('Gagal menjalankan server:', err);
        process.exit(1);
      }
      console.log(`Server Photobooth berjalan di ${address}`);
      console.log(`- Health Check: ${address}/health`);
      console.log(`- WebSocket: ${address.replace('http', 'ws')}/ws`);
    });
  });
}

export default createServer;
