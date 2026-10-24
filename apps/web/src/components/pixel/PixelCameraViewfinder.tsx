import React, { useState, useEffect, useRef } from 'react';
import { Camera, Laptop } from 'lucide-react';

interface PixelCameraViewfinderProps {
  countdownNum: number;
  currentPhotoIdx: number;
  totalPhotos: number;
  isRetake?: boolean;
  cameraName?: string;
  cameraSource?: 'canon' | 'webcam';
  onSwitchCamera?: (source: 'canon' | 'webcam') => void;
  onSnapshotCapture?: (dataUrl: string) => void;
}

export function PixelCameraViewfinder({
  countdownNum,
  currentPhotoIdx,
  totalPhotos,
  isRetake = false,
  cameraName = 'CANON EOS 1200D',
  cameraSource = 'canon',
  onSwitchCamera,
  onSnapshotCapture,
}: PixelCameraViewfinderProps) {
  const [vuLevel, setVuLevel] = useState(3);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasWebcamStream, setHasWebcamStream] = useState(false);

  // Efek simulasi level audio VU meter 8-bit
  useEffect(() => {
    const interval = setInterval(() => {
      setVuLevel(Math.floor(Math.random() * 5) + 1);
    }, 240);
    return () => clearInterval(interval);
  }, []);

  // Aktifkan feed video jika sumber kamera adalah kamera laptop (webcam)
  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    if (cameraSource === 'webcam') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } })
          .then((stream) => {
            mediaStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setHasWebcamStream(true);
            }
          })
          .catch(() => {
            setHasWebcamStream(false);
          });
      }
    } else {
      setHasWebcamStream(false);
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraSource]);

  // Ambil snapshot foto dari video webcam saat countdown mencapai 0
  useEffect(() => {
    if (countdownNum === 0 && cameraSource === 'webcam' && onSnapshotCapture && videoRef.current) {
      try {
        const video = videoRef.current;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onSnapshotCapture(dataUrl);
          }
        }
      } catch (err) {
        console.error('Error capturing webcam photo:', err);
      }
    }
  }, [countdownNum, cameraSource, onSnapshotCapture]);

  const activeDeviceLabel = cameraSource === 'webcam' ? 'KAMERA LAPTOP (WEBCAM)' : cameraName;

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto bg-black/85 pixel-box border-4 border-[#4B57B2] flex flex-col items-center justify-center overflow-hidden select-none font-pixel">
      {/* 0. Live Video Feed dari Kamera Laptop (Jika Mode Webcam Aktif) */}
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
        {/* Garis Vertikal 1/3 dan 2/3 */}
        <div className="absolute left-1/3 top-0 bottom-0 w-[1px] border-r-2 border-dashed border-[#5CE1E6]" />
        <div className="absolute left-2/3 top-0 bottom-0 w-[1px] border-r-2 border-dashed border-[#5CE1E6]" />
        {/* Garis Horizontal 1/3 dan 2/3 */}
        <div className="absolute top-1/3 left-0 right-0 h-[1px] border-b-2 border-dashed border-[#5CE1E6]" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] border-b-2 border-dashed border-[#5CE1E6]" />
      </div>

      {/* 3. Sudut Bidik Kamera (Bracket Pixel Emas #FFD84D) */}
      {/* Kiri Atas */}
      <div className="absolute top-4 left-4 w-9 h-9 pointer-events-none z-10">
        <div className="w-9 h-2 bg-[#FFD84D]" />
        <div className="w-2 h-7 bg-[#FFD84D]" />
      </div>
      {/* Kanan Atas */}
      <div className="absolute top-4 right-4 w-9 h-9 pointer-events-none z-10">
        <div className="w-9 h-2 bg-[#FFD84D] ml-auto" />
        <div className="w-2 h-7 bg-[#FFD84D] ml-auto" />
      </div>
      {/* Kiri Bawah */}
      <div className="absolute bottom-4 left-4 w-9 h-9 pointer-events-none z-10">
        <div className="w-2 h-7 bg-[#FFD84D]" />
        <div className="w-9 h-2 bg-[#FFD84D]" />
      </div>
      {/* Kanan Bawah */}
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
              <Laptop className="w-3 h-3 text-[#5CE1E6]" />
            ) : (
              <Camera className="w-3 h-3 text-[#00E599]" />
            )}
            <span className={cameraSource === 'webcam' ? 'text-[#5CE1E6]' : 'text-[#00E599]'}>
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
          {cameraSource === 'webcam' ? 'WEBCAM HD • 30 FPS • AUTO EXPOSURE' : 'ISO 400 • F/2.8 • 1/125s'}
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
