import React, { useState, useEffect, useRef } from 'react';
import { Camera, Laptop, RefreshCw, VideoOff, Check, AlertTriangle, Sparkles } from 'lucide-react';
import {
  getSharedWebcamStream,
  useSimulatorStream,
  bindStreamToVideo,
  stopWebcamStream,
  getHumanWebcamError,
  enumerateVideoDevices,
  type WebcamDeviceInfo,
} from '@/utils/webcamHelper';

interface PixelCameraViewfinderProps {
  countdownNum: number;
  currentPhotoIdx: number;
  totalPhotos: number;
  isRetake?: boolean;
  cameraName?: string;
  canonConnected?: boolean;
  cameraSource?: 'canon' | 'webcam';
  selectedWebcamId?: string;
  onSwitchCamera?: (source: 'canon' | 'webcam') => void;
  onSnapshotCapture?: (dataUrl: string) => void;
}

export function PixelCameraViewfinder({
  countdownNum,
  currentPhotoIdx,
  totalPhotos,
  isRetake = false,
  cameraName = 'CANON EOS 1200D',
  canonConnected = false,
  cameraSource = 'canon',
  selectedWebcamId,
  onSwitchCamera,
  onSnapshotCapture,
}: PixelCameraViewfinderProps) {
  const [vuLevel, setVuLevel] = useState(3);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const [hasWebcamStream, setHasWebcamStream] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [webcamLabel, setWebcamLabel] = useState<string>('KAMERA LAPTOP HD');
  const [devices, setDevices] = useState<WebcamDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(selectedWebcamId || '');
  const [liveViewTimestamp, setLiveViewTimestamp] = useState<number>(Date.now());
  const [hasLiveViewStream, setHasLiveViewStream] = useState<boolean>(false);

  // Polling LiveView dari sensor Canon EOS 1200D jika mode Canon aktif
  useEffect(() => {
    if (cameraSource === 'canon' && canonConnected) {
      const interval = setInterval(() => {
        setLiveViewTimestamp(Date.now());
      }, 180);
      return () => clearInterval(interval);
    }
  }, [cameraSource, canonConnected]);

  // Efek simulasi level audio VU meter 8-bit
  useEffect(() => {
    const interval = setInterval(() => {
      setVuLevel(Math.floor(Math.random() * 5) + 1);
    }, 240);
    return () => clearInterval(interval);
  }, []);

  // Fungsi penghubung kamera laptop yang tangguh dengan fallback bertingkat
  const connectWebcam = async (targetDeviceId?: string) => {
    setIsConnecting(true);
    setWebcamError(null);

    try {
      const devId = targetDeviceId || selectedDeviceId || undefined;
      const result = await getSharedWebcamStream(devId);
      currentStreamRef.current = result.stream;

      if (result.label) {
        setWebcamLabel(result.label);
      }
      if (result.activeDeviceId) {
        setSelectedDeviceId(result.activeDeviceId);
      }

      await bindStreamToVideo(videoRef.current, result.stream);
      setHasWebcamStream(true);
      setWebcamError(null);

      // Muat daftar perangkat yang terpasang setelah izin aktif
      const devList = await enumerateVideoDevices();
      setDevices(devList);
    } catch (err: any) {
      console.warn('Status koneksi webcam/cermin viewfinder:', err?.name || err?.message || err);
      if (cameraSource === 'webcam') {
        setHasWebcamStream(false);
        setWebcamError(getHumanWebcamError(err));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Aktifkan simulator kamera virtual jika izin browser diblokir
  const handleUseSimulator = async () => {
    setIsConnecting(true);
    setWebcamError(null);
    try {
      const sim = useSimulatorStream();
      currentStreamRef.current = sim.stream;
      setWebcamLabel(sim.label);
      setSelectedDeviceId(sim.activeDeviceId);
      await bindStreamToVideo(videoRef.current, sim.stream);
      setHasWebcamStream(true);
      setWebcamError(null);
    } catch (err: any) {
      console.warn('Simulator stream error:', err?.message || err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Hubungkan live preview mirror baik di mode webcam maupun mode Canon (cermin untuk pose)
  useEffect(() => {
    connectWebcam();
  }, [cameraSource]);

  // Ambil snapshot foto dari video webcam saat countdown mencapai 0
  useEffect(() => {
    if (countdownNum === 0 && onSnapshotCapture) {
      try {
        const video = videoRef.current;
        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            onSnapshotCapture(dataUrl);
            return;
          }
        }

        // Fallback: Jika sensor video belum aktif / mode Canon tanpa DSLR fisik, buat kartu foto beranimasi
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 1280, 720);
          grad.addColorStop(0, '#131947');
          grad.addColorStop(0.5, '#160078');
          grad.addColorStop(1, '#050C38');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1280, 720);

          ctx.strokeStyle = 'rgba(92, 225, 230, 0.2)';
          ctx.lineWidth = 1;
          for (let x = 0; x < 1280; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 720);
            ctx.stroke();
          }

          ctx.strokeStyle = '#FFD84D';
          ctx.lineWidth = 5;
          ctx.strokeRect(100, 60, 1080, 600);

          ctx.fillStyle = '#00E599';
          ctx.font = 'bold 36px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`EXPO WISUDA TIK 2026 • POSE #${currentPhotoIdx + 1}`, 640, 330);

          ctx.fillStyle = '#FFD84D';
          ctx.font = 'bold 22px monospace';
          ctx.fillText(`${new Date().toLocaleTimeString('id-ID')} WIB • LIVE PHOTO SNAPSHOT`, 640, 390);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          onSnapshotCapture(dataUrl);
        }
      } catch (err) {
        console.warn('Peringatan saat mengambil snapshot video:', err);
      }
    }
  }, [countdownNum, onSnapshotCapture, currentPhotoIdx]);

  const activeDeviceLabel = cameraSource === 'webcam' ? webcamLabel : cameraName;

  const poses = [
    { title: 'POSE 1: SENYUM TERBAIK', tip: 'Tatap lurus ke kamera DSLR Canon' },
    { title: 'POSE 2: GAYA BEBAS', tip: 'Ekspresikan kegembiraan wisuda' },
    { title: 'POSE 3: FINGER HEART', tip: 'Bentuk hati kecil dengan jempol & telunjuk' },
    { title: 'POSE 4: SELEBRASI', tip: 'Angkat tangan atau lempar toga wisuda' },
  ];
  const currentPose = poses[currentPhotoIdx % poses.length];

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto bg-black/90 pixel-box border-4 border-[#4B57B2] flex flex-col items-center justify-center overflow-hidden select-none font-pixel">
      {/* 0. Live Video Feed Cermin Webcam */}
      {cameraSource === 'webcam' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] z-0 transition-opacity duration-300 ${
            hasWebcamStream ? 'opacity-90' : 'opacity-0'
          }`}
        />
      )}

      {/* 0A. Live View Asli dari Lensa Kamera Canon EOS 1200D */}
      {cameraSource === 'canon' && (
        <img
          src={`/api/canon/liveview?t=${liveViewTimestamp}`}
          alt="Canon EOS 1200D Live View"
          onLoad={() => setHasLiveViewStream(true)}
          onError={() => setHasLiveViewStream(false)}
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${
            hasLiveViewStream ? 'opacity-95' : 'opacity-0'
          }`}
        />
      )}

      {/* 0B. Latar Studio Retro Animasi jika Feed LiveView / Webcam Belum Tersedia */}
      {((cameraSource === 'webcam' && !hasWebcamStream) || (cameraSource === 'canon' && !hasLiveViewStream)) && (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0C1230] via-[#160078] to-[#050C38] flex flex-col items-center justify-center p-6 text-center">
          {/* Animasi Siluet Karakter Posing */}
          <div className="relative mb-3 flex flex-col items-center animate-pulse">
            <div className="w-20 h-20 rounded-full border-4 border-[#FFD84D] bg-[#050C38]/80 flex items-center justify-center shadow-[0_0_20px_rgba(255,216,77,0.3)]">
              <Camera className="w-10 h-10 text-[#00E599]" />
            </div>
            <div className="mt-2 text-[#5CE1E6] font-pixel-title text-xs tracking-wider">
              {currentPose.title}
            </div>
            <div className="text-[10px] text-white/70 font-sans mt-0.5">
              {currentPose.tip}
            </div>
          </div>

          {/* Status Badge Koneksi Canon DSLR */}
          <div className="bg-black/60 border border-[#4B57B2] px-3 py-1.5 flex items-center gap-2 max-w-md">
            <span className={`w-2.5 h-2.5 rounded-full ${canonConnected ? 'bg-[#00E599]' : 'bg-[#FFD84D]'} animate-ping`} />
            <span className="text-[10px] text-white/90 font-mono">
              {canonConnected ? 'DSLR CANON 1200D ONLINE (Rana Fisik Aktif)' : 'CANON STANDBY • Colokkan kabel USB kamera ke Laptop & Nyalakan'}
            </span>
          </div>
        </div>
      )}

      {/* 0B. State Menghubungkan Kamera */}
      {cameraSource === 'webcam' && isConnecting && !hasWebcamStream && (
        <div className="absolute inset-0 z-15 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
          <RefreshCw className="w-10 h-10 text-[#5CE1E6] animate-spin mb-3" />
          <p className="font-pixel-title text-xs text-[#5CE1E6] tracking-wider mb-1">
            MENGHUBUNGKAN KE KAMERA...
          </p>
          <p className="text-[10px] text-white/70 max-w-sm">
            Mohon izinkan akses kamera jika diminta, atau gunakan simulator.
          </p>
        </div>
      )}

      {/* 0C. State Error / Belum Terhubung di Mode Webcam Murni */}
      {cameraSource === 'webcam' && webcamError && !hasWebcamStream && (
        <div className="absolute inset-3 z-25 flex flex-col items-center justify-center bg-[#0C1230]/95 border-2 border-[#FE0168] p-4 text-center my-auto shadow-[0_0_30px_rgba(254,1,104,0.4)]">
          <div className="w-10 h-10 bg-[#FE0168]/20 border border-[#FE0168] text-[#FE0168] flex items-center justify-center mb-2">
            <VideoOff className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D] mb-1.5">
            KAMERA WEBCAM BELUM TERSEDIA
          </h3>
          <p className="text-[11px] text-white/85 mb-3 max-w-md leading-relaxed font-sans bg-black/50 p-2 border border-white/10">
            {webcamError}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleUseSimulator}
              className="px-3 py-1.5 pixel-btn bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] text-[10px] font-pixel-title font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Gunakan simulasi live camera 30 FPS untuk mencoba sesi booth"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#050C38]" />
              <span>GUNAKAN SIMULATOR KAMERA (30 FPS)</span>
            </button>
            {onSwitchCamera && (
              <button
                type="button"
                onClick={() => onSwitchCamera('canon')}
                className="px-3 py-1.5 pixel-btn bg-[#131947] hover:bg-[#160078] text-[#FFD84D] text-[10px] font-pixel-title flex items-center gap-1.5 border border-[#4B57B2] active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-[#00E599]" />
                <span>GANTI KE CANON 1200D (DSLR)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Efek Garis Scanline CRT TV Retro */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 21, 26, 0) 50%, rgba(0, 0, 0, 0.75) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* 2. Grid Komposisi Rule of Thirds (Garis Pixel Putus-Putus) */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-25">
        <div className="absolute left-1/3 top-0 bottom-0 w-[1px] border-r-2 border-dashed border-[#5CE1E6]" />
        <div className="absolute left-2/3 top-0 bottom-0 w-[1px] border-r-2 border-dashed border-[#5CE1E6]" />
        <div className="absolute top-1/3 left-0 right-0 h-[1px] border-b-2 border-dashed border-[#5CE1E6]" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] border-b-2 border-dashed border-[#5CE1E6]" />
      </div>

      {/* 3. Sudut Bidik Kamera (Bracket Pixel Emas #FFD84D) */}
      <div className="absolute top-4 left-4 w-9 h-9 pointer-events-none z-10">
        <div className="w-9 h-2 bg-[#FFD84D]" />
        <div className="w-2 h-7 bg-[#FFD84D]" />
      </div>
      <div className="absolute top-4 right-4 w-9 h-9 pointer-events-none z-10">
        <div className="w-9 h-2 bg-[#FFD84D] ml-auto" />
        <div className="w-2 h-7 bg-[#FFD84D] ml-auto" />
      </div>
      <div className="absolute bottom-4 left-4 w-9 h-9 pointer-events-none z-10">
        <div className="w-2 h-7 bg-[#FFD84D]" />
        <div className="w-9 h-2 bg-[#FFD84D]" />
      </div>
      <div className="absolute bottom-4 right-4 w-9 h-9 pointer-events-none z-10">
        <div className="w-2 h-7 bg-[#FFD84D] ml-auto" />
        <div className="w-9 h-2 bg-[#FFD84D] ml-auto" />
      </div>

      {/* 4. Crosshair Titik Fokus Tengah (+) */}
      <div className="absolute pointer-events-none z-10 flex items-center justify-center opacity-70">
        <div className="w-10 h-0.5 bg-[#00E599]" />
        <div className="absolute h-10 w-0.5 bg-[#00E599]" />
        <div className="absolute w-4 h-4 border border-[#00E599] rounded-none" />
      </div>

      {/* 5. Telemetri HUD Atas */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-[11px] font-pixel-title z-10 pointer-events-none">
        {/* Status Rekam Merah */}
        <div className="flex items-center gap-2 bg-[#0C1230]/85 px-2.5 py-1 border border-[#4B57B2]">
          <span className="w-2.5 h-2.5 bg-[#FE0168] rounded-none animate-pulse" />
          <span className="text-[#FE0168]">REC</span>
          <span className="text-white/60">●</span>
          <span className="text-[#FFD84D]">1080P</span>
        </div>

        {/* Info Index Jepret */}
        <div className="bg-[#131947] px-3 py-1 border-2 border-[#E02F75] text-[#FFD84D]">
          {isRetake ? `ULANGI FOTO #${currentPhotoIdx + 1} (1X)` : `FOTO ${currentPhotoIdx + 1}/${totalPhotos}`}
        </div>

        {/* Baterai & Perangkat + Tombol Switch */}
        <div className="flex items-center gap-2">
          {onSwitchCamera && (
            <button
              type="button"
              onClick={() => onSwitchCamera(cameraSource === 'canon' ? 'webcam' : 'canon')}
              className="pointer-events-auto px-2 py-1 bg-[#160078] hover:bg-[#E02F75] text-[#FFD84D] border border-[#FFD84D]/60 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Ganti Sumber Kamera"
            >
              {cameraSource === 'webcam' ? (
                <>
                  <Camera className="w-3 h-3 text-[#00E599]" />
                  <span className="text-[9px]">GANTI: CANON</span>
                </>
              ) : (
                <>
                  <Laptop className="w-3 h-3 text-[#5CE1E6]" />
                  <span className="text-[9px]">GANTI: LAPTOP</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 bg-[#0C1230]/85 px-2.5 py-1 border border-[#4B57B2]">
            {cameraSource === 'webcam' ? (
              <span className={`w-2 h-2 ${hasWebcamStream ? 'bg-[#00E599]' : 'bg-[#FE0168]'} animate-pulse`} />
            ) : (
              <span className="w-2 h-2 bg-[#00E599]" />
            )}
            <span className={cameraSource === 'webcam' ? 'text-[#5CE1E6] truncate max-w-[120px]' : 'text-[#00E599]'}>
              {activeDeviceLabel}
            </span>
            <span className="text-white/80">[■■■■]</span>
          </div>
        </div>
      </div>

      {/* 6. Angka Hitung Mundur Raksasa 8-Bit di Tengah */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        <div className="font-pixel-title text-[130px] sm:text-[170px] text-[#FFD84D] leading-none drop-shadow-[5px_5px_0_#FE0168] animate-pulse">
          {countdownNum}
        </div>
        <p className="font-pixel-title text-xs sm:text-sm text-[#5CE1E6] mt-2 tracking-widest bg-black/60 px-4 py-1 border border-[#5CE1E6]/40">
          ★ TATAP LENSA KAMERA &bull; SENYUM! ★
        </p>
      </div>

      {/* 7. Baris Status Bawah: ISO, Shutter, & Audio Meter */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[10px] font-pixel-title text-[#A9B8FF] z-10 pointer-events-none">
        <div className="bg-[#0C1230]/85 px-2.5 py-1 border border-[#4B57B2]">
          {cameraSource === 'webcam'
            ? hasWebcamStream
              ? 'WEBCAM HD • 30 FPS • CONNECTED'
              : 'WEBCAM: MENUNGGU KONEKSI'
            : 'ISO 400 • F/2.8 • 1/125s'}
        </div>

        {/* Bar VU Meter 8-Bit */}
        <div className="flex items-center gap-1 bg-[#0C1230]/85 px-2.5 py-1 border border-[#4B57B2]">
          <span className="text-white/60">MIC:</span>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <span
              key={lvl}
              className={`w-2 h-3 ${
                lvl <= vuLevel
                  ? lvl > 4
                    ? 'bg-[#FE0168]'
                    : lvl > 3
                    ? 'bg-[#FFD84D]'
                    : 'bg-[#00E599]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="bg-[#0C1230]/85 px-2.5 py-1 border border-[#4B57B2] text-[#FFD84D]">
          {cameraSource === 'webcam' ? '720P RGB' : 'RAW+JPEG 4R'}
        </div>
      </div>
    </div>
  );
}
