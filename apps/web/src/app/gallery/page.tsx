'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Shield, Sparkles, CheckCircle } from 'lucide-react';
import { PixelCameraIcon, PixelPrinterIcon } from '@/components/pixel/PixelIcons';
import { PixelCrossStar, PixelStreetLamp, PixelVendingMachine } from '@/components/pixel/PixelPosterDecorations';
import { retroAudio } from '@/utils/audio';

export default function GalleryPage() {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadAll = () => {
    retroAudio.playPrintSound();
    setDownloadingZip(true);
    setTimeout(() => {
      setDownloadingZip(false);
      setDownloadSuccess(true);
      retroAudio.playSuccessChime();
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050C38] text-white font-pixel flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Layer: Gradien Langit Malam & Bintang Pixel */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-50 animate-twinkle pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-44 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-30 pointer-events-none" />

      {/* Dekorasi Lampu & Vending Machine */}
      <div className="fixed bottom-0 left-6 z-0 hidden xl:block pointer-events-none">
        <PixelStreetLamp height={120} />
      </div>
      <div className="fixed bottom-0 right-6 z-0 hidden xl:block pointer-events-none">
        <PixelVendingMachine height={110} />
      </div>

      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10 w-full flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-pixel-title text-[#A9B8FF] hover:text-[#FFD84D] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&lt;&lt; KEMBALI KE BERANDA</span>
        </Link>

        {/* Header Galeri Pixel */}
        <header className="mb-8 pb-6 border-b-4 border-[#4B57B2] flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#FFD84D] mb-1">
              <PixelCrossStar size={12} />
              <span className="font-pixel-title text-[11px] tracking-wider">
                GALERI DIGITAL PHOTOBOOTH
              </span>
              <PixelCrossStar size={12} />
            </div>
            <h1 className="font-pixel-title text-2xl sm:text-3xl text-white">
              GALERI DIANA &amp; KAWAN
            </h1>
            <p className="text-xs text-[#5CE1E6] mt-1 font-pixel-title">
              SESI #020 &bull; EXPO WISUDA TIK 2026 &bull; FORMAT CETAK 4R (1200 x 1800)
            </p>
          </div>

          <div>
            <button
              onClick={handleDownloadAll}
              disabled={downloadingZip}
              className="w-full sm:w-auto h-12 px-6 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-xs flex items-center justify-center gap-2"
            >
              {downloadingZip ? (
                <span>MENYIAPKAN ZIP...</span>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-[#FFD84D]" />
                  <span>ZIP TERUNDUH!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>UNDUH SEMUA (ZIP GRATIS)</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Konten Hasil Foto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Kolom 1 & 2: Photo Strip Komposit 4R */}
          <div className="md:col-span-2">
            <div className="bg-[#0C1230]/95 pixel-box-cyber p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FE0168]" />
                  <span>PHOTO STRIP KOMPOSIT 4R</span>
                </h2>
                <span className="text-[10px] font-pixel-title text-[#00E599] bg-[#0D5235] px-2 py-0.5 border border-[#00E599]/40">
                  [ SIAP CETAK ]
                </span>
              </div>

              {/* Mock Visual Strip 4R */}
              <div className="relative aspect-[2/3] max-w-xs mx-auto bg-gradient-to-b from-[#0C1230] to-[#160078] border-4 border-[#E02F75] p-3 flex flex-col justify-between shadow-[6px_6px_0_0_#050C38]">
                <div className="text-center font-pixel-title text-[9px] text-[#FFD84D] tracking-wider border-b border-white/20 pb-1.5">
                  ★ EXPO WISUDA TIK 2026 ★
                </div>

                <div className="grid grid-cols-2 gap-1.5 my-2 flex-1">
                  {[1, 1, 2, 2, 3, 3, 4, 4].map((num, idx) => (
                    <div
                      key={idx}
                      className="bg-[#050C38] border border-white/20 flex flex-col items-center justify-center text-white/50 font-pixel-title text-[9px]"
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#1D4ED8' : '#BE185D',
                      }}
                    >
                      <span className="bg-black/50 px-1 text-white">#{num}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center text-[8px] font-pixel-title text-[#5CE1E6] border-t border-white/20 pt-1.5">
                  NIGHT CITY STRIP &bull; 1200 x 1800 PX
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <button
                  onClick={() => {
                    retroAudio.playPrintSound();
                    alert('Mengunduh Photo Strip resolusi tinggi 1200x1800 tanpa kompresi...');
                  }}
                  className="h-10 px-5 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white font-pixel-title text-[10px] flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>UNDUH STRIP JPG 4R</span>
                </button>
              </div>
            </div>
          </div>

          {/* Kolom 3: Foto Individual Tanpa Bingkai */}
          <div className="space-y-3">
            <h2 className="font-pixel-title text-xs text-[#FFD84D] mb-2">
              FOTO INDIVIDUAL ASLI
            </h2>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 bg-[#0C1230]/90 pixel-box backdrop-blur flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 pixel-box bg-[#131947] flex items-center justify-center font-pixel-title text-xs text-[#FFD84D]">
                    #{i}
                  </div>
                  <div>
                    <p className="font-pixel-title text-[11px] text-white">FOTO ASLI #{i}</p>
                    <p className="text-[9px] text-[#5CE1E6]">Canon 1200D RAW</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    retroAudio.playButtonClick();
                    alert(`Mengunduh foto resolusi asli Canon #${i}...`);
                  }}
                  className="p-2 pixel-box bg-[#050C38] hover:bg-[#160078] text-[#5CE1E6]"
                  title="Unduh"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Catatan Privasi & Keamanan */}
        <div className="p-4 pixel-box bg-[#0C1230]/90 backdrop-blur text-xs text-white/70 flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#00E599] shrink-0" />
          <p className="leading-relaxed text-[11px]">
            Tautan galeri ini dilindungi token acak dan bebas pelacak komersial. Foto digital Anda tersimpan aman dan dapat diunduh gratis kapan saja.
          </p>
        </div>
      </main>

      <footer className="w-full border-t-4 border-[#4B57B2] py-3 px-6 relative z-10 bg-[#0C1230]/90 text-center text-[10px] text-[#A9B8FF]">
        EXPO WISUDA TIK 2026 &bull; GALERI FOTO CANON 1200D &bull; EPSON 4R
      </footer>
    </div>
  );
}
