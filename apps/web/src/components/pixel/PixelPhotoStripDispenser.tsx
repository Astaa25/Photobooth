'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, Download, Check, QrCode } from 'lucide-react';
import { PixelCrossStar } from './PixelPosterDecorations';

interface PixelPhotoStripDispenserProps {
  visitorName: string;
  ticketNumber: string;
  photos: string[];
  templateName: string;
  onReset: () => void;
}

export function PixelPhotoStripDispenser({
  visitorName,
  ticketNumber,
  photos,
  templateName,
  onReset,
}: PixelPhotoStripDispenserProps) {
  const [dispensed, setDispensed] = useState(false);

  useEffect(() => {
    // Animasi bertahap meluncur keluar setelah komponen di-mount
    const t = setTimeout(() => {
      setDispensed(true);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto font-pixel select-none animate-fadeIn">
      {/* 1. Rumah Slot Dispenser Arcade (Metal Bevel & Garis Hazard) */}
      <div className="w-full max-w-sm bg-[#1C2140] border-4 border-[#050C38] shadow-[0_8px_0_0_#050C38] p-3 text-center relative z-20">
        {/* Garis Hazard Kuning-Hitam */}
        <div
          className="w-full h-3 mb-2 border border-black/40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #FFD84D, #FFD84D 8px, #050C38 8px, #050C38 16px)',
          }}
        />

        <div className="flex items-center justify-between text-[10px] font-pixel-title text-[#FFD84D] px-1">
          <span>DISPENSER STRIP 4R</span>
          <span className="flex items-center gap-1 text-[#00E599]">
            <span className="w-2 h-2 bg-[#00E599] animate-pulse" />
            READY
          </span>
        </div>

        {/* Celah Pengeluaran Kertas Foto (Hitam Pekat) */}
        <div className="w-full h-3 bg-black mt-2 border-t-2 border-b-2 border-[#4B57B2] relative overflow-hidden" />
      </div>

      {/* 2. Kertas Foto Strip 4R yang Meluncur Keluar (Stepped Pixel Animation) */}
      <div
        className={`w-72 bg-gradient-to-b from-[#0C1230] to-[#160078] border-4 border-[#E02F75] p-3.5 shadow-[8px_8px_0_0_rgba(5,12,56,0.8)] transition-all duration-1000 ease-out -mt-1 relative z-10 ${
          dispensed ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-30'
        }`}
      >
        {/* Header Strip Foto */}
        <div className="text-center pb-2.5 mb-2.5 border-b-2 border-dashed border-[#5CE1E6]/40">
          <div className="flex items-center justify-center gap-1.5 text-[#FFD84D] mb-1">
            <PixelCrossStar size={10} />
            <span className="font-pixel-title text-[9px] tracking-wider">
              EXPO WISUDA TIK 2026
            </span>
            <PixelCrossStar size={10} />
          </div>
          <p className="text-[10px] text-white/80 font-pixel-title">
            POLITEKNIK NEGERI LHOKSEUMAWE
          </p>
        </div>

        {/* Bingkai Foto Pengunjung (Tersusun Vertikal) */}
        <div className="space-y-2">
          {photos.map((photoColor, idx) => (
            <div
              key={idx}
              className="relative w-full aspect-[4/3] border-2 border-white/20 bg-black/60 overflow-hidden flex items-center justify-center group"
            >
              {/* Latar Foto atau Warna Foto */}
              <div
                className="w-full h-full flex flex-col items-center justify-center p-2"
                style={{ backgroundColor: photoColor }}
              >
                <div className="bg-black/50 px-2 py-1 font-pixel-title text-[10px] text-white border border-white/30">
                  POSE #{idx + 1}
                </div>
              </div>

              {/* Timestamp & Watermark di Sudut Foto */}
              <div className="absolute bottom-1 right-1.5 text-[8px] font-pixel-title text-white/90 bg-black/60 px-1">
                TIK2026
              </div>
            </div>
          ))}
        </div>

        {/* Footer Strip Foto: Info Pengunjung, Tanggal, & Mini QR Code */}
        <div className="mt-3 pt-2.5 border-t-2 border-dashed border-[#5CE1E6]/40 flex items-center justify-between text-[9px] font-pixel-title">
          <div className="text-left">
            <span className="text-[#FFD84D] block">{visitorName}</span>
            <span className="text-[#5CE1E6] block">{ticketNumber}</span>
            <span className="text-white/50 text-[8px] block">24 OKTOBER 2026</span>
          </div>

          <div className="w-10 h-10 bg-white p-0.5 border border-[#4B57B2] flex items-center justify-center">
            <QrCode className="w-8 h-8 text-black" />
          </div>
        </div>
      </div>

      {/* 3. Panel Aksi Pengunjung di Bawah */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        <button
          onClick={onReset}
          className="w-full h-12 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-xs font-bold flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>SELESAI &bull; KEMBALI</span>
        </button>
      </div>

      <p className="font-pixel-title text-[10px] text-[#FFD84D] mt-3 animate-pulse text-center">
        ★ SILAKAN AMBIL HASIL CETAK 4R DI MEJA OPERATOR ★
      </p>
    </div>
  );
}
