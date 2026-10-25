/**
 * Utilitas Pengelola Kamera Laptop (WebRTC MediaDevices Helper)
 * Mengelola koneksi webcam dengan multi-tier fallback, deteksi perangkat,
 * penanganan izin browser, dan binding stream video yang stabil.
 */

export interface WebcamDeviceInfo {
  deviceId: string;
  label: string;
  groupId?: string;
}

/**
 * Terjemahkan error WebRTC ke instruksi ramah pengguna dalam Bahasa Indonesia
 */
export function isSecureContextSafe(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
}

/**
 * Terjemahkan error WebRTC ke instruksi ramah pengguna dalam Bahasa Indonesia
 */
export function getHumanWebcamError(err: any): string {
  if (!err) return 'Gagal menghubungkan ke kamera laptop.';

  const name = err.name || '';
  const message = err.message || '';
  const isNetworkIP = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  if (!isSecureContextSafe() || message.includes('secure context') || name === 'SecurityError') {
    return `Browser memblokir kamera karena dibuka via IP WiFi/LAN (${typeof window !== 'undefined' ? window.location.host : ''}) tanpa HTTPS.
Solusi:
1. Buka di laptop langsung via http://localhost:3000
2. ATAU di browser tablet/HP: buka chrome://flags/#unsafely-treat-insecure-origin-as-secure, tambahkan "${typeof window !== 'undefined' ? window.location.origin : 'http://...'}", aktifkan (Enabled), lalu relaunch browser.`;
  }

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Izin akses kamera diblokir browser. Klik ikon gembok / kamera di bilah URL browser Anda, lalu pilih "Izinkan" (Allow) untuk kamera.';
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Kamera laptop tidak terdeteksi oleh sistem operasi. Periksa tombol privasi fisik atau tombol kombinasi Fn (misalnya Fn+F6 atau Fn+F10) pada keyboard laptop.';
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Kamera laptop sedang digunakan aplikasi lain (seperti Zoom, Google Meet, Teams, WhatsApp, atau Windows Camera). Silakan tutup aplikasi tersebut dan coba lagi.';
  }

  if (name === 'OverconstrainedError') {
    return 'Resolusi kamera yang diminta tidak didukung oleh sensor webcam laptop.';
  }

  if (isNetworkIP && !navigator.mediaDevices) {
    return `Browser membatasi WebRTC di jaringan lokal non-HTTPS. Silakan akses via http://localhost:3000 di laptop.`;
  }

  return message || 'Terjadi kendala saat mengaktifkan feed video kamera laptop.';
}

/**
 * Periksa apakah browser saat ini mendukung API WebRTC MediaDevices
 */
export function isWebcamSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Daftar semua perangkat kamera video yang terhubung ke sistem
 */
export async function enumerateVideoDevices(): Promise<WebcamDeviceInfo[]> {
  if (!isWebcamSupported()) return [];

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');

    return videoInputs.map((d, idx) => ({
      deviceId: d.deviceId,
      label: d.label || `Kamera Video #${idx + 1}`,
      groupId: d.groupId,
    }));
  } catch (err) {
    console.warn('Gagal membaca daftar perangkat kamera:', err);
    return [];
  }
}

/**
 * Minta stream video dari webcam dengan strategi fallback bertingkat
 */
export async function requestWebcamStream(deviceId?: string): Promise<{
  stream: MediaStream;
  activeDeviceId?: string;
  label?: string;
}> {
  if (!isWebcamSupported()) {
    throw new Error('Browser ini tidak mendukung akses kamera WebRTC atau berjalan di luar secure context (localhost/https).');
  }

  // 1. Baca daftar semua videoinput yang terdeteksi di sistem
  let availableDevices: MediaDeviceInfo[] = [];
  try {
    const devs = await navigator.mediaDevices.enumerateDevices();
    availableDevices = devs.filter((d) => d.kind === 'videoinput');
  } catch (err) {
    console.warn('Gagal membaca enumerateDevices:', err);
  }

  // 2. Susun daftar kandidat deviceId secara cerdas
  const candidateDeviceIds: (string | undefined)[] = [];
  if (deviceId && deviceId !== 'simulator-virtual-webcam') {
    candidateDeviceIds.push(deviceId);
  }

  // Pengenal kamera virtual vs fisik
  const isVirtualCam = (label: string) => {
    const l = (label || '').toLowerCase();
    return l.includes('iriun') || l.includes('obs') || l.includes('droidcam') || l.includes('virtual');
  };

  const isPhysicalCam = (label: string) => {
    const l = (label || '').toLowerCase();
    return (
      l.includes('uvc') ||
      l.includes('usb') ||
      l.includes('integrated') ||
      l.includes('built-in') ||
      l.includes('hd web') ||
      l.includes('chicony') ||
      l.includes('sunplus') ||
      l.includes('realtek') ||
      l.includes('bison')
    ) && !isVirtualCam(label);
  };

  // Prioritas 1: Kamera fisik yang dikenali (misal: USB2.0 HD UVC WebCam)
  for (const cam of availableDevices) {
    if (cam.deviceId && isPhysicalCam(cam.label) && !candidateDeviceIds.includes(cam.deviceId)) {
      candidateDeviceIds.push(cam.deviceId);
    }
  }

  // Prioritas 2: Kamera lain yang bukan virtual (atau tanpa label)
  for (const cam of availableDevices) {
    if (cam.deviceId && !isVirtualCam(cam.label) && !candidateDeviceIds.includes(cam.deviceId)) {
      candidateDeviceIds.push(cam.deviceId);
    }
  }

  // Prioritas 3: Default browser device (undefined)
  if (!candidateDeviceIds.includes(undefined)) {
    candidateDeviceIds.push(undefined);
  }

  // Prioritas 4: Sisa kamera lainnya jika semua prioritas di atas gagal
  for (const cam of availableDevices) {
    if (cam.deviceId && !candidateDeviceIds.includes(cam.deviceId)) {
      candidateDeviceIds.push(cam.deviceId);
    }
  }

  let lastError: any = null;

  for (const devId of candidateDeviceIds) {
    const tiers: MediaStreamConstraints[] = devId
      ? [
          {
            audio: false,
            video: {
              deviceId: { exact: devId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          {
            audio: false,
            video: {
              deviceId: { exact: devId },
            },
          },
        ]
      : [
          {
            audio: false,
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          {
            audio: false,
            video: true,
          },
        ];

    for (const constraints of tiers) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings?.();
        const activeDeviceId = settings?.deviceId || devId;
        const label = videoTrack?.label || 'Kamera Laptop HD';

        return {
          stream,
          activeDeviceId,
          label,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Peringatan: Gagal membuka feed webcam (deviceId: ${devId || 'default'}):`, err?.name || err?.message || err);
        // Teruskan ke kandidat atau tier berikutnya
      }
    }
  }

  throw lastError || new Error('Tidak dapat memperoleh feed video dari kamera mana pun.');
}

// Pengelola Singleton MediaStream untuk Mencegah Collision Perangkat di Windows
let activeSharedStream: MediaStream | null = null;
let activeSharedDeviceId: string | undefined = undefined;
let activeSharedLabel: string = 'Kamera Laptop HD';
let activeSimulatorCleanup: (() => void) | null = null;

/**
 * Buat MediaStream sintetis / simulator dari HTML5 Canvas 30 FPS
 * Berguna saat izin kamera ditolak oleh browser/OS sehingga pengguna tetap
 * dapat mencoba dan menguji alur photobooth tanpa macet atau layar hitam.
 */
export function createSimulatorWebcamStream(): {
  stream: MediaStream;
  activeDeviceId: string;
  label: string;
  cleanup: () => void;
} {
  if (typeof document === 'undefined') {
    throw new Error('Canvas hanya didukung di lingkungan browser.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  let animationFrameId: number;
  let frameCount = 0;

  const drawFrame = () => {
    frameCount++;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
    const ms = String(now.getMilliseconds()).padStart(3, '0');

    // Latar belakang gradien simulator cyberpunk
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#050C38');
    grad.addColorStop(0.5, '#160078');
    grad.addColorStop(1, '#0C1230');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid garis retro
    ctx.strokeStyle = 'rgba(92, 225, 230, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Karakter Pengunjung Beranimasi (Simulasi Pose Wajah Dinamis)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + Math.sin(frameCount * 0.05) * 12;

    // Rambut / Topi Wisuda Pixel
    ctx.fillStyle = '#050C38';
    ctx.fillRect(centerX - 90, centerY - 150, 180, 40);
    ctx.fillStyle = '#FFD84D';
    ctx.fillRect(centerX + 60, centerY - 130, 12, 50);

    // Wajah / Kepala
    ctx.fillStyle = '#FFD84D';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 50, 85, 0, Math.PI * 2);
    ctx.fill();

    // Kacamata / Mata Pixel
    ctx.fillStyle = '#050C38';
    ctx.fillRect(centerX - 45, centerY - 70, 25, 20);
    ctx.fillRect(centerX + 20, centerY - 70, 25, 20);
    ctx.fillRect(centerX - 20, centerY - 65, 40, 6);

    // Senyum Ramah
    ctx.strokeStyle = '#050C38';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 35, 35, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Pipi Merona
    ctx.fillStyle = 'rgba(254, 1, 104, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX - 55, centerY - 35, 15, 0, Math.PI * 2);
    ctx.arc(centerX + 55, centerY - 35, 15, 0, Math.PI * 2);
    ctx.fill();

    // Jubah Wisuda Biru TIK
    ctx.fillStyle = '#160078';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 160, 180, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kalung Gordon Wisuda Emas
    ctx.strokeStyle = '#FFD84D';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 110, 70, 0, Math.PI);
    ctx.stroke();

    // Bracket Kotak Bidik Wajah
    ctx.strokeStyle = '#00E599';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - 120, centerY - 160, 240, 250);

    // Telemetri HUD Atas
    ctx.fillStyle = '#00E599';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`● SIMULATOR KAMERA WEBCAM 720P (LIVE FEED)`, 40, 50);

    ctx.fillStyle = '#FFD84D';
    ctx.font = '18px monospace';
    ctx.fillText(`TIME: ${timeStr}.${ms} | FPS: 30 | STATUS: AKTIF`, 40, 82);

    // Pesan Panduan Bawah
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '15px sans-serif';
    ctx.fillText('Simulator siap untuk pengujian countdown, jepret pose, cetak 4R, dan review tanpa perlu webcam fisik.', 40, canvas.height - 35);

    animationFrameId = requestAnimationFrame(drawFrame);
  };

  drawFrame();

  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;

  if (!stream) {
    throw new Error('Browser tidak mendukung canvas captureStream.');
  }

  const cleanup = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    stopWebcamStream(stream);
  };

  return {
    stream,
    activeDeviceId: 'simulator-virtual-webcam',
    label: 'Simulator Kamera Laptop (Live Test Feed)',
    cleanup,
  };
}

/**
 * Aktifkan simulator stream secara global
 */
export function useSimulatorStream(): {
  stream: MediaStream;
  activeDeviceId: string;
  label: string;
} {
  if (activeSharedStream) {
    stopWebcamStream(activeSharedStream);
    activeSharedStream = null;
  }
  if (activeSimulatorCleanup) {
    activeSimulatorCleanup();
    activeSimulatorCleanup = null;
  }

  const sim = createSimulatorWebcamStream();
  activeSharedStream = sim.stream;
  activeSharedDeviceId = sim.activeDeviceId;
  activeSharedLabel = sim.label;
  activeSimulatorCleanup = sim.cleanup;

  return sim;
}

/**
 * Dapatkan stream webcam bersama (singleton) yang aman dari benturan hardware
 */
export async function getSharedWebcamStream(
  deviceId?: string,
  forceRefresh = false
): Promise<{
  stream: MediaStream;
  activeDeviceId?: string;
  label?: string;
}> {
  // Jika sedang memakai simulator virtual
  if (deviceId === 'simulator-virtual-webcam' || activeSharedDeviceId === 'simulator-virtual-webcam') {
    if (activeSharedStream && activeSharedStream.active) {
      return {
        stream: activeSharedStream,
        activeDeviceId: activeSharedDeviceId,
        label: activeSharedLabel,
      };
    }
    return useSimulatorStream();
  }

  // Jika stream sudah aktif, track masih live, dan deviceId sesuai, gunakan kembali
  if (
    !forceRefresh &&
    activeSharedStream &&
    activeSharedStream.active &&
    activeSharedStream.getVideoTracks().some((t) => t.readyState === 'live')
  ) {
    if (!deviceId || activeSharedDeviceId === deviceId) {
      return {
        stream: activeSharedStream,
        activeDeviceId: activeSharedDeviceId,
        label: activeSharedLabel,
      };
    }
  }

  // Hentikan stream lama sebelum meminta baru agar driver kamera Windows tidak terkunci
  if (activeSharedStream) {
    stopWebcamStream(activeSharedStream);
    activeSharedStream = null;
  }
  if (activeSimulatorCleanup) {
    activeSimulatorCleanup();
    activeSimulatorCleanup = null;
  }

  const result = await requestWebcamStream(deviceId);
  activeSharedStream = result.stream;
  activeSharedDeviceId = result.activeDeviceId;
  activeSharedLabel = result.label || 'Kamera Laptop HD';

  return result;
}

/**
 * Hentikan dan bersihkan stream singleton webcam
 */
export function releaseSharedWebcamStream(): void {
  if (activeSimulatorCleanup) {
    activeSimulatorCleanup();
    activeSimulatorCleanup = null;
  }
  if (activeSharedStream) {
    stopWebcamStream(activeSharedStream);
    activeSharedStream = null;
    activeSharedDeviceId = undefined;
  }
}

/**
 * Pasangkan MediaStream ke elemen video HTML dan mulai pemutaran secara aman
 */
export async function bindStreamToVideo(
  videoElement: HTMLVideoElement | null,
  stream: MediaStream
): Promise<void> {
  if (!videoElement) return;

  videoElement.srcObject = stream;
  videoElement.muted = true;
  videoElement.playsInline = true;
  videoElement.setAttribute('playsinline', 'true');
  videoElement.setAttribute('autoplay', 'true');

  try {
    await videoElement.play();
  } catch {
    // Tunggu event onloadedmetadata jika browser menunda pemutaran
    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play().catch(() => {}).finally(() => resolve());
      };
      // Timeout pengaman 1 detik
      setTimeout(resolve, 1000);
    });
  }
}

/**
 * Hentikan semua track dari MediaStream
 */
export function stopWebcamStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
  } catch {}
}
