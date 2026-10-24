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

  // Lapisan 1: Coba resolusi ideal 1280x720 dengan facingMode user
  const tier1Constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      facingMode: deviceId ? undefined : 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };

  // Lapisan 2: Coba tanpa facingMode (kompatibel desktop & generic webcam)
  const tier2Constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };

  // Lapisan 3: Coba hanya deviceId murni
  const tier3Constraints: MediaStreamConstraints = {
    audio: false,
    video: deviceId ? { deviceId: { exact: deviceId } } : true,
  };

  // Lapisan 4: Fallback mutlak: video apa saja yang tersedia
  const tier4Constraints: MediaStreamConstraints = {
    audio: false,
    video: true,
  };

  let lastError: any = null;

  for (const constraints of [tier1Constraints, tier2Constraints, tier3Constraints, tier4Constraints]) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings?.();
      const activeDeviceId = settings?.deviceId || deviceId;
      const label = videoTrack?.label || 'Kamera Laptop HD';

      return {
        stream,
        activeDeviceId,
        label,
      };
    } catch (err: any) {
      lastError = err;
      // Jika izin ditolak (NotAllowedError), hentikan loop agar tidak terus meneror user
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw err;
      }
    }
  }

  throw lastError || new Error('Tidak dapat memperoleh feed video dari kamera mana pun.');
}

// Pengelola Singleton MediaStream untuk Mencegah Collision Perangkat di Windows
let activeSharedStream: MediaStream | null = null;
let activeSharedDeviceId: string | undefined = undefined;
let activeSharedLabel: string = 'Kamera Laptop HD';

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
