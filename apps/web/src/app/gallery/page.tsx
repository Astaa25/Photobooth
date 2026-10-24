'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Shield, Sparkles, Printer, CheckCircle } from 'lucide-react';

export default function GalleryPage() {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadAll = () => {
    setDownloadingZip(true);
    setTimeout(() => {
      setDownloadingZip(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 1200);
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft hover:text-ink mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>

      {/* Header Galeri */}
      <header className="mb-10 pb-6 border-b border-sheet flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium text-film uppercase tracking-wider">
            Galeri Digital Photobooth
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-1">
            Galeri Diana &amp; Kawan
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Sesi #020 &bull; Expo Wisuda 2026 &bull; Format Cetak 4R (1200 x 1800 px)
          </p>
        </div>

        <div>
          <button
            onClick={handleDownloadAll}
            disabled={downloadingZip}
            className="w-full sm:w-auto h-12 px-6 rounded-btn bg-ultramarine hover:bg-ultramarine-press text-white font-medium text-sm transition-all btn-press shadow-raise-1 flex items-center justify-center gap-2"
          >
            {downloadingZip ? (
              <span>Menyiapkan ZIP...</span>
            ) : downloadSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>ZIP Terunduh</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh Semua (ZIP)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Konten Hasil Foto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Kolom 1 & 2: Photo Strip Komposit Utama */}
        <div className="md:col-span-2">
          <div className="bg-paper-raised border border-sheet rounded-panel p-6 shadow-raise-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ultramarine" />
                <span>Photo Strip Komposit 4R</span>
              </h2>
              <span className="text-xs text-signal-ok bg-emerald-50 px-2.5 py-0.5 rounded-chip font-medium">
                Siap Cetak
              </span>
            </div>

            {/* Mock Visual Strip 4R */}
            <div className="relative aspect-[2/3] max-w-sm mx-auto bg-[#131947] rounded-none shadow-raise-3 border-4 border-white flex flex-col justify-between p-4 overflow-hidden">
              <div className="text-center font-display text-xs text-[#FFD84D] font-bold tracking-wider">
                EXPO WISUDA 2026 &bull; PHOTOBOOTH
              </div>
              <div className="grid grid-cols-2 gap-2 my-2 flex-1">
                <div className="bg-ink/80 border border-white/20 rounded-none flex items-center justify-center text-white/40 text-xs">
                  Foto 1
                </div>
                <div className="bg-ink/80 border border-white/20 rounded-none flex items-center justify-center text-white/40 text-xs">
                  Foto 1
                </div>
                <div className="bg-ink/80 border border-white/20 rounded-none flex items-center justify-center text-white/40 text-xs">
                  Foto 2
                </div>
                <div className="bg-ink/80 border border-white/20 rounded-none flex items-center justify-center text-white/40 text-xs">
                  Foto 2
                </div>
                <div className="bg-ink/80 border border-white/20 rounded-none flex items-center justify-center text-white/40 text-xs">
                  Foto 3
                </div>
                <div className="bg-ink/80 border border-white/20 rounded-none flex items-center justify-center text-white/40 text-xs">
                  Foto 3
                </div>
                <div className="bg-ink/80 border border-white/20 rounded-none flex items-center justify-center text-white/40 text-xs">
                  Foto 4
                </div>
                <div className="bg-ink/80 border border-white/20 rounded-none flex items-center justify-center text-white/40 text-xs">
                  Foto 4
                </div>
              </div>
              <div className="text-center text-[10px] text-white/70">
                Template: Night City Strip &bull; 1200 x 1800 px
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => alert('Mengunduh Photo Strip resolusi tinggi 1200x1800...')}
                className="h-10 px-4 rounded-btn border border-sheet text-xs font-medium text-ink hover:bg-sheet transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Strip JPG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kolom 3: Foto Individual */}
        <div className="space-y-4">
          <h2 className="font-display text-sm font-bold text-ink">
            Foto Individual (Tanpa Bingkai)
          </h2>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 bg-paper-raised border border-sheet rounded-btn flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sheet rounded-chip flex items-center justify-center text-xs font-bold text-ink-soft">
                  #{i}
                </div>
                <div>
                  <p className="text-xs font-medium text-ink">Foto Asli {i}</p>
                  <p className="text-[10px] text-film">1920 x 1280 &bull; Canon EOS</p>
                </div>
              </div>
              <button
                onClick={() => alert(`Mengunduh foto individual #${i}...`)}
                className="p-2 rounded-btn hover:bg-sheet text-ink-soft transition-colors"
                title="Unduh"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Catatan Keamanan & Privasi */}
      <footer className="p-4 rounded-panel bg-paper-raised border border-sheet text-xs text-film flex items-center gap-3">
        <Shield className="w-5 h-5 text-signal-ok shrink-0" />
        <p className="leading-relaxed">
          Tautan galeri ini dilindungi token acak 256-bit dan bebas dari pelacak pihak ketiga. Siapa pun yang memiliki tautan ini dapat melihat dan mengunduh foto Anda.
        </p>
      </footer>
    </main>
  );
}
