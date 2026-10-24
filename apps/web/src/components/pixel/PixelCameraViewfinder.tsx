'use client';

import React, { useState, useEffect } from 'react';

interface PixelCameraViewfinderProps {
  countdownNum: number;
  currentPhotoIdx: number;
  totalPhotos: number;
  isRetake?: boolean;
  cameraName?: string;
}

export function PixelCameraViewfinder({
  countdownNum,
  currentPhotoIdx,
  totalPhotos,
  isRetake = false,
  cameraName = 'CANON EOS 1200D',
}: PixelCameraViewfinderProps) {
  const [vuLevel, setVuLevel] = useState(3);

  // Efek simulasi level audio VU meter 8-bit
  useEffect(() => {
    const interval = setInterval(() => {
      setVuLevel(Math.floor(Math.random() * 5) + 1);
    }, 240);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto bg-black/85 pixel-box border-4 border-[#4B57B2] flex flex-col items-center justify-center overflow-hidden select-none font-pixel">
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
      <div className="absolute top-5 left-16 right-16 flex items-center justify-between text-[11px] font-pixel-title z-10 pointer-events-none">
        {/* Status Rekam Merah */}
        <div className="flex items-center gap-2 bg-[#0C1230]/80 px-2.5 py-1 border border-[#4B57B2]">
          <span className="w-2.5 h-2.5 bg-[#FE0168] rounded-none animate-pulse" />
          <span className="text-[#FE0168]">REC</span>
          <span className="text-white/60">●</span>
          <span className="text-[#FFD84D]">1080P</span>
        </div>

        {/* Info Index Jepret */}
        <div className="bg-[#131947] px-3 py-1 border-2 border-[#E02F75] text-[#FFD84D]">
          {isRetake ? `ULANGI FOTO #${currentPhotoIdx + 1} (1X)` : `FOTO ${currentPhotoIdx + 1}/${totalPhotos}`}
        </div>

        {/* Baterai & Perangkat */}
        <div className="flex items-center gap-2 bg-[#0C1230]/80 px-2.5 py-1 border border-[#4B57B2] text-[#00E599]">
          <span>{cameraName}</span>
          <span className="text-white/80">[■■■■]</span>
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
      <div className="absolute bottom-5 left-16 right-16 flex items-center justify-between text-[10px] font-pixel-title text-[#A9B8FF] z-10 pointer-events-none">
        <div className="bg-[#0C1230]/80 px-2.5 py-1 border border-[#4B57B2]">
          ISO 400 &bull; F/2.8 &bull; 1/125s
        </div>

        {/* Bar VU Meter 8-Bit */}
        <div className="flex items-center gap-1 bg-[#0C1230]/80 px-2.5 py-1 border border-[#4B57B2]">
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

        <div className="bg-[#0C1230]/80 px-2.5 py-1 border border-[#4B57B2] text-[#FFD84D]">
          RAW+JPEG 4R
        </div>
      </div>
    </div>
  );
}
