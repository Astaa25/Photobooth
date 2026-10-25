'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Download, Check, QrCode, ArrowDown, CheckCircle2 } from 'lucide-react';
import { PixelCrossStar } from './PixelPosterDecorations';
import { PixelPrinterIcon } from './PixelIcons';
import {
  downloadCompositePhotoStrip,
  getDefaultSlots,
  type PhotoSlotConfig,
} from '@/utils/photoDownloadHelper';
import { retroAudio } from '@/utils/audio';

interface PixelPhotoStripDispenserProps {
  visitorName: string;
  ticketNumber: string;
  photos: string[];
  templateName: string;
  frameImage?: string;
  slots?: PhotoSlotConfig[];
  canvasWidth?: number;
  canvasHeight?: number;
  onReset: () => void;
}

export function PixelPhotoStripDispenser({
  visitorName,
  ticketNumber,
  photos,
  templateName,
  frameImage,
  slots,
  canvasWidth = 1200,
  canvasHeight = 1800,
  onReset,
}: PixelPhotoStripDispenserProps) {
  const [dispensed, setDispensed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    // Animasi bertahap meluncur keluar setelah komponen di-mount
    const t = setTimeout(() => {
      setDispensed(true);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  // Tangani unduh hasil foto strip komposit
  const handleDownloadStrip = async () => {
    setIsDownloading(true);
    try {
      retroAudio.playPrintSound();
      await downloadCompositePhotoStrip({
        photos,
        frameImage,
        slots,
        canvasWidth,
        canvasHeight,
        visitorName,
        ticketNumber,
        templateName,
        fileName: `Photobooth_${ticketNumber.replace('#', '')}_${Date.now()}.jpg`,
      });
      setDownloadSuccess(true);
      retroAudio.playSuccessChime();
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Gagal mengunduh foto strip:', err);
      alert('Terjadi kendala saat memproses unduhan gambar.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Hitung posisi slot foto yang efektif (menggunakan slot kustom atau kalkulasi bawaan)
  const effectiveSlots: PhotoSlotConfig[] =
    slots && slots.length > 0
      ? slots
      : getDefaultSlots(photos.length || 4, canvasWidth, canvasHeight);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto font-pixel select-none animate-fadeIn py-2">
      {/* Petunjuk Gulir jika di layar vertikal kecil */}
      <div className="lg:hidden flex items-center gap-1.5 text-[10px] font-pixel-title text-[#FFD84D] mb-3 animate-bounce">
        <ArrowDown className="w-3.5 h-3.5" />
        <span>GULIR KE BAWAH UNTUK UNDUH &amp; SELESAI</span>
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
            className={`w-64 bg-gradient-to-b from-[#0C1230] to-[#160078] border-4 border-[#E02F75] p-2.5 shadow-[6px_6px_0_0_rgba(5,12,56,0.8)] transition-all duration-1000 ease-out -mt-1 relative z-10 overflow-hidden ${
              dispensed ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-30'
            }`}
          >
            {/* Lembar 4R Berbingkai Asli (Foto ditempatkan presisi di koordinat slot template) */}
            <div className="relative w-full aspect-[2/3] overflow-hidden bg-black/80 border border-white/20">
              {/* Layer Foto Belakang: Ditempatkan tepat pada slot frame */}
              <div className="absolute inset-0 pointer-events-none">
                {effectiveSlots.map((slot, idx) => {
                  const photoIdx =
                    slot.photo !== undefined
                      ? slot.photo
                      : slot.source_index !== undefined
                      ? slot.source_index
                      : idx % photos.length;
                  const photoData = photos[photoIdx] || photos[0] || '#1D4ED8';
                  const isImg =
                    photoData.startsWith('data:image') ||
                    photoData.startsWith('/') ||
                    photoData.startsWith('http');

                  const leftPct = (slot.x / canvasWidth) * 100;
                  const topPct = (slot.y / canvasHeight) * 100;
                  const widthPct = (slot.width / canvasWidth) * 100;
                  const heightPct = (slot.height / canvasHeight) * 100;

                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        backgroundColor: isImg ? '#000' : photoData,
                      }}
                      className="overflow-hidden flex items-center justify-center border border-black/30"
                    >
                      {isImg ? (
                        <img
                          src={photoData}
                          alt={`Pose ${photoIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-pixel-title text-[7px] text-white bg-black/60 px-1 border border-white/20">
                          POSE #{photoIdx + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Layer Bingkai Frame Asli PNG Transparan */}
              {frameImage && (
                <img
                  src={frameImage}
                  alt={templateName}
                  className="absolute inset-0 w-full h-full object-fill pixel-art pointer-events-none z-10"
                />
              )}

              <span className="absolute bottom-1 right-1.5 z-20 text-[7px] font-pixel-title text-[#FFD84D] bg-black/70 px-1 border border-[#FFD84D]/30">
                {visitorName} ({ticketNumber})
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Tombol Unduh Langsung, QR Code & Tombol Selesai */}
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-full bg-[#0C1230]/95 pixel-box-cyber p-6 text-center backdrop-blur">
            <div className="w-12 h-12 mx-auto pixel-box bg-[#049A5C] text-white flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-[#FFD84D]" />
            </div>

            <h2 className="font-pixel-title text-sm text-[#FFD84D] mb-1.5 leading-relaxed">
              FOTO BERHASIL DISIMPAN!
            </h2>
            <p className="text-xs text-[#A9B8FF] mb-4">
              Foto Anda telah siap dicetak dan disimpan. Anda dapat mengunduh berkasnya langsung ke perangkat ini atau memindai QR Code di bawah.
            </p>

            {/* TOMBOL UNDUH LANGSUNG STRIP 4R */}
            <button
              type="button"
              onClick={handleDownloadStrip}
              disabled={isDownloading}
              className={`w-full h-13 py-3 pixel-btn text-xs font-pixel-title font-bold tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#050C38] active:scale-95 mb-4 transition-all ${
                downloadSuccess
                  ? 'bg-[#00E599] text-[#050C38]'
                  : 'bg-[#FFD84D] hover:bg-[#FFE57F] text-[#050C38]'
              }`}
            >
              {isDownloading ? (
                <span>MENYIAPKAN FILE JPG...</span>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#050C38]" />
                  <span>BERHASIL DIUNDUH!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#050C38]" />
                  <span>UNDUH FOTO STRIP (JPG)</span>
                </>
              )}
            </button>

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
              className="w-full h-12 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-xs tracking-wider flex items-center justify-center gap-2"
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
