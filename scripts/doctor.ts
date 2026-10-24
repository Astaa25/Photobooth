import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execSync } from 'node:child_process';

interface CheckResult {
  title: string;
  passed: boolean;
  message: string;
  hint?: string;
}

const results: CheckResult[] = [];

function check(title: string, fn: () => { passed: boolean; message: string; hint?: string }) {
  try {
    const res = fn();
    results.push({ title, ...res });
  } catch (err: any) {
    results.push({ title, passed: false, message: `Error: ${err?.message || err}`, hint: 'Periksa log atau konfigurasi terkait' });
  }
}

// 1. Node.js Version
check('Versi Node.js', () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  const passed = major >= 20;
  return {
    passed,
    message: `Node.js ${version}`,
    hint: passed ? undefined : 'Gunakan Node.js LTS (>= v20)',
  };
});

// 2. pnpm
check('Versi pnpm', () => {
  try {
    const out = execSync('pnpm -v', { encoding: 'utf-8' }).trim();
    return { passed: true, message: `pnpm v${out}` };
  } catch {
    return { passed: false, message: 'pnpm tidak ditemukan di PATH', hint: 'Jalankan npm install -g pnpm' };
  }
});

// 3. Git
check('Versi Git', () => {
  try {
    const out = execSync('git --version', { encoding: 'utf-8' }).trim();
    return { passed: true, message: out };
  } catch {
    return { passed: false, message: 'Git tidak ditemukan di PATH', hint: 'Pasang Git untuk Windows' };
  }
});

// 4. FFmpeg
check('FFmpeg', () => {
  try {
    const out = execSync('ffmpeg -version', { encoding: 'utf-8' }).split('\n')[0];
    return { passed: true, message: out };
  } catch {
    return {
      passed: false,
      message: 'FFmpeg belum terpasang atau tidak ada di PATH',
      hint: 'Pasang via winget install Gyan.FFmpeg atau tambahkan ke PATH sistem',
    };
  }
});

// 5. File .env
const envPath = path.resolve(process.cwd(), '.env');
check('File .env', () => {
  if (!fs.existsSync(envPath)) {
    return {
      passed: false,
      message: '.env tidak ditemukan',
      hint: 'Salin .env.example menjadi .env lalu isi variabel yang sesuai',
    };
  }
  return { passed: true, message: '.env ditemukan' };
});

// 6. Zona Waktu
check('Zona Waktu Sistem', () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    passed: true,
    message: `Zona waktu sistem: ${tz} (Target operasional: Asia/Jakarta / UTC)`,
  };
});

// 7. Port Check (API_PORT = 4000)
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

async function runAll() {
  console.log('\n=== PHOTOBOOTH DOCTOR ===\n');

  const port4000Free = await checkPort(4000);
  results.push({
    title: 'Port API 4000',
    passed: port4000Free,
    message: port4000Free ? 'Port 4000 tersedia' : 'Port 4000 sedang dipakai proses lain',
    hint: port4000Free ? undefined : 'Hentikan aplikasi yang menggunakan port 4000 atau ubah API_PORT di .env',
  });

  const port3000Free = await checkPort(3000);
  results.push({
    title: 'Port Web 3000',
    passed: port3000Free,
    message: port3000Free ? 'Port 3000 tersedia' : 'Port 3000 sedang dipakai proses lain',
    hint: port3000Free ? undefined : 'Hentikan aplikasi yang menggunakan port 3000 atau jalankan Next.js di port lain',
  });

  let totalPassed = 0;
  for (const r of results) {
    const symbol = r.passed ? '[LULUS]' : '[GAGAL]';
    console.log(`${symbol} ${r.title}: ${r.message}`);
    if (!r.passed && r.hint) {
      console.log(`        Petunjuk: ${r.hint}`);
    }
    if (r.passed) totalPassed++;
  }

  console.log(`\nHasil: ${totalPassed}/${results.length} pemeriksaan lulus.\n`);
}

runAll();
