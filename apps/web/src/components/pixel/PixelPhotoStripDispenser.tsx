'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Download, Check, QrCode, ArrowDown } from 'lucide-react';
import { PixelCrossStar } from './PixelPosterDecorations';
import { PixelPrinterIcon } from './PixelIcons';

interface PixelPhotoStripDispenserProps {
  visitorName: string;
  ticketNumber: string;
  photos: string[];
  templateName: string;
  frameImage?: string;
  onReset: () => void;
}

export function PixelPhotoStripDispenser({
  visitorName,
  ticketNumber,
  photos,
  templateName,
  frameImage,
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
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto font-pixel select-none animate-fadeIn py-2">
      {/* Petunjuk Gulir jika di layar vertikal kecil */}
      <div className="lg:hidden flex items-center gap-1.5 text-[10px] font-pixel-title text-[#FFD84D] mb-3 animate-bounce">
        <ArrowDown className="w-3.5 h-3.5" />
        <span>GULIR KE BAWAH UNTUK QR &amp; TOMBOL SELESAI</span>
        <ArrowDown className="w-3.5 h-3.5" />
      </div>

      {/* Kontainer Fleksibel: Bersebelahan di Landscape / Layar Lebar, Menumpuk di Portrait */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-full">
        {/* Kolom Kiri: Mesin Dispenser & Kertas Strip 4R */}
        <div className="flex flex-col items-center w-full max-w-xs">
          {/* Rumah Slot Dispenser Arcade */}
          <div className="w-full bg-[#1C2140] border-4 border-[#050C38] shadow-[0_6px_0_0_#050C38] p-2.5 text-center relative z-20">
            {/* Garis Hazard Kuning-Hitam */}
            <div
              className="w-full h-2.5 mb-1.5 border border-black/40"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #FFD84D, #FFD84D 8px, #050C38 8px, #050C38 16px)',
              }}
            />

            <div className="flex items-center justify-between text-[9px] font-pixel-title text-[#FFD84D] px-1">
              <span>DISPENSER 4R</span>
              <span className="flex items-center gap-1 text-[#00E599]">
                <span className="w-2 h-2 bg-[#00E599] animate-pulse" />
                PRINT READY
              </span>
            </div>

            {/* Celah Pengeluaran Kertas Foto */}
            <div className="w-full h-2.5 bg-black mt-1.5 border-t-2 border-b-2 border-[#4B57B2] relative overflow-hidden" />
          </div>

          {/* Kertas Foto Strip 4R yang Meluncur Keluar */}
          <div
            className={`w-64 bg-gradient-to-b from-[#0C1230] to-[#160078] border-4 border-[#E02F75] p-3 shadow-[6px_6px_0_0_rgba(5,12,56,0.8)] transition-all duration-1000 ease-out -mt-1 relative z-10 overflow-hidden ${
              dispensed ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-30'
            }`}
          >
            {/* Frame PNG Overlay Kustom jika ada */}
            {frameImage && (
              <img
                src={frameImage}
                alt="Frame Overlay"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20 opacity-90 pixel-art"
              />
            )}

            {/* Header Strip Foto */}
            <div className="text-center pb-2 mb-2 border-b-2 border-dashed border-[#5CE1E6]/40 relative z-10">
              <div className="flex items-center justify-center gap-1 text-[#FFD84D] mb-0.5">
                <PixelCrossStar size={8} />
                <span className="font-pixel-title text-[8px] tracking-wider">
                  EXPO WISUDA TIK 2026
                </span>
                <PixelCrossStar size={8} />
              </div>
              <p className="text-[9px] text-white/80 font-pixel-title">
                POLITEKNIK NEGERI LHOKSEUMAWE
              </p>
            </div>

            {/* Bingkai Foto Pengunjung (Tersusun Vertikal) */}
            <div className="space-y-1.5 relative z-10">
              {photos.map((photoColor, idx) => (
                <div
                  key={idx}
                  className="relative w-full aspect-[16/10] border-2 border-white/20 bg-black/60 overflow-hidden flex items-center justify-center"
                >
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-1"
                    style={{ backgroundColor: photoColor }}
                  >
                    <div className="bg-black/60 px-2 py-0.5 font-pixel-title text-[9px] text-white border border-white/30">
                      POSE #{idx + 1}
                    </div>
                  </div>

                  <div className="absolute bottom-0.5 right-1 text-[7px] font-pixel-title text-white/90 bg-black/70 px-1">
                    TIK2026
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Strip Foto: Info Pengunjung, Tanggal */}
            <div className="mt-2 pt-2 border-t-2 border-dashed border-[#5CE1E6]/40 flex items-center justify-between text-[8px] font-pixel-title relative z-10">
              <div className="text-left">
                <span className="text-[#FFD84D] block">{visitorName}</span>
                <span className="text-[#5CE1E6] block">{ticketNumber}</span>
                <span className="text-white/50 text-[7px] block">24 OKT 2026</span>
              </div>
              <span className="text-[7px] text-white/60 bg-black/40 px-1 py-0.5 border border-white/20">
                {templateName}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kartu QR Code Unduh Digital & Tombol Selesai */}
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-full bg-[#0C1230]/95 pixel-box-cyber p-6 text-center backdrop-blur">
            <div className="w-12 h-12 mx-auto pixel-box bg-[#049A5C] text-white flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-[#FFD84D]" />
            </div>

            <h2 className="font-pixel-title text-sm text-[#FFD84D] mb-1.5 leading-relaxed">
              FOTO BERHASIL DISIMPAN!
            </h2>
            <p className="text-xs text-[#A9B8FF] mb-4">
              Pindai QR Code di bawah dengan ponsel Anda untuk membuka galeri dan mengunduh seluruh file foto digital gratis.
            </p>

            {/* Kotak QR Code Pixel */}
            <div className="w-44 h-44 mx-auto bg-white p-3 pixel-box flex items-center justify-center mb-4">
              <QrCode className="w-36 h-36 text-black" />
            </div>

            <p className="font-pixel-title text-[10px] text-[#5CE1E6] mb-5">
              TIKET: <span className="text-[#FFD84D]">{ticketNumber}</span> &bull; {visitorName}
            </p>

            {/* Tombol Selesai yang Jelas dan Mudah Ditekan */}
            <button
              onClick={onReset}
              className="w-full h-14 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-xs tracking-wider flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5 text-white" />
              <span>SELESAI &bull; KEMBALI KE STANDBY</span>
            </button>
          </div>

          <div className="mt-4 p-3 bg-[#131947]/90 pixel-box text-center text-[10px] font-pixel-title text-[#FFD84D] flex items-center justify-center gap-2 w-full">
            <PixelPrinterIcon size={16} />
            <span>AMBIL CETAKAN 4R DI MEJA OPERATOR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
