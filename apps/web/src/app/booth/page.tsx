'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, RotateCcw, Check, Sparkles, ArrowRight, QrCode } from 'lucide-react';

type BoothStep = 'welcome' | 'choosing_design' | 'countdown' | 'flash' | 'review' | 'result';

interface TemplateOption {
  slug: string;
  name: string;
  desc: string;
  photoCount: number;
}

const TEMPLATES: TemplateOption[] = [
  { slug: 'night-city-strip', name: 'Night City Strip', desc: 'Dua strip 4 foto (gaya photobooth)', photoCount: 4 },
  { slug: 'night-city-grid', name: 'Night City Grid', desc: '4 foto dalam kisi 2x2', photoCount: 4 },
  { slug: 'moonlight-trio', name: 'Moonlight Trio', desc: '3 foto bulan sabit strip ganda', photoCount: 3 },
  { slug: 'duo-skyline', name: 'Duo Skyline', desc: '2 foto bertingkat untuk berdua', photoCount: 2 },
  { slug: 'poster-tunggal', name: 'Poster Tunggal', desc: '1 foto besar bergaya poster', photoCount: 1 },
];

export default function BoothKioskPage() {
  const [step, setStep] = useState<BoothStep>('welcome');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>(TEMPLATES[0]);
  const [visitorName, setVisitorName] = useState('Diana');
  const [ticketNumber, setTicketNumber] = useState('#020');
  const [countdownNum, setCountdownNum] = useState(3);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isFlashActive, setIsFlashActive] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'countdown') {
      if (countdownNum > 0) {
        timer = setTimeout(() => setCountdownNum(countdownNum - 1), 1000);
      } else {
        // Shutter snap! Momen flash sesuai StyleGuide.md
        setStep('flash');
        setIsFlashActive(true);
        setTimeout(() => {
          setIsFlashActive(false);
          // Tambahkan foto simulasi
          const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
          const newPhotos = [...capturedPhotos, colors[currentPhotoIdx % colors.length]];
          setCapturedPhotos(newPhotos);

          if (currentPhotoIdx + 1 < selectedTemplate.photoCount) {
            setCurrentPhotoIdx(currentPhotoIdx + 1);
            setCountdownNum(3);
            setStep('countdown');
          } else {
            setStep('review');
          }
        }, 360);
      }
    }
    return () => clearTimeout(timer);
  }, [step, countdownNum, currentPhotoIdx, capturedPhotos, selectedTemplate.photoCount]);

  const startCapture = () => {
    setCapturedPhotos([]);
    setCurrentPhotoIdx(0);
    setCountdownNum(3);
    setStep('countdown');
  };

  const retakeSingle = (idx: number) => {
    // Retake satu foto sesuai PRD F3 (foto lain tidak hilang)
    setCurrentPhotoIdx(idx);
    setCountdownNum(3);
    setStep('countdown');
  };

  return (
    <div className="relative w-screen h-screen bg-[#12151A] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Flash Effect Layer (StyleGuide.md: kuning #FFD84D naik 80ms turun 360ms) */}
      {isFlashActive && (
        <div className="absolute inset-0 bg-[#FFD84D] opacity-85 z-50 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Header Booth Kiosk */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-signal-ok" />
          <span className="text-xs font-semibold tracking-wider text-film uppercase">
            Photobooth Kiosk &bull; Canon EOS 1200D
          </span>
        </div>
        <div className="text-xs text-film">
          Tiket: <span className="text-[#FFD84D] font-bold font-display text-sm">{ticketNumber}</span>
        </div>
      </header>

      {/* Main Screen Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10 max-w-4xl mx-auto w-full">
        {/* Step 1: Layar Sapaan */}
        {step === 'welcome' && (
          <div className="animate-fadeIn max-w-xl">
            <span className="text-xs text-[#FFD84D] font-bold tracking-widest uppercase mb-2 block">
              Giliran Anda Sekarang
            </span>
            <h1 className="font-display text-6xl font-bold tracking-tight mb-2">
              Halo, {visitorName}
            </h1>
            <p className="text-white/60 text-lg mb-8">
              Nomor antrean <span className="text-white font-bold">{ticketNumber}</span> telah siap. Sentuh tombol di bawah untuk memilih desain foto.
            </p>
            <button
              onClick={() => setStep('choosing_design')}
              className="h-16 px-10 rounded-btn bg-ultramarine hover:bg-ultramarine-press text-white font-display text-lg font-bold shadow-raise-3 transition-all btn-press flex items-center justify-center gap-3 mx-auto"
            >
              <span>Pilih Desain Foto</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Pilih Desain Template */}
        {step === 'choosing_design' && (
          <div className="w-full animate-fadeIn">
            <h2 className="font-display text-3xl font-bold mb-2">
              Pilih Desain Bingkai Foto
            </h2>
            <p className="text-sm text-white/60 mb-8">
              Pilih gaya strip atau kolase favoritmu untuk dicetak dalam ukuran 4R.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.slug}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-5 rounded-panel text-left border transition-all btn-press ${
                    selectedTemplate.slug === tpl.slug
                      ? 'border-ultramarine bg-ultramarine/20 shadow-raise-2'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-base text-white">{tpl.name}</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-chip text-white/80">
                      {tpl.photoCount} Foto
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{tpl.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={startCapture}
              className="h-16 px-10 rounded-btn bg-ultramarine hover:bg-ultramarine-press text-white font-display text-lg font-bold shadow-raise-3 transition-all btn-press flex items-center justify-center gap-3 mx-auto"
            >
              <Camera className="w-5 h-5" />
              <span>Mulai Sesi Foto ({selectedTemplate.photoCount}x Jepret)</span>
            </button>
          </div>
        )}

        {/* Step 3: Countdown & Viewfinder */}
        {(step === 'countdown' || step === 'flash') && (
          <div className="relative w-full max-w-2xl aspect-[4/3] bg-black/60 rounded-panel border border-white/20 flex flex-col items-center justify-center overflow-hidden shadow-raise-3">
            {/* Sudut Bidik Kamera */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/60" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/60" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/60" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/60" />

            {/* Indikator Foto ke-N */}
            <div className="absolute top-6 px-4 py-1.5 rounded-chip bg-black/60 backdrop-blur border border-white/20 text-xs font-medium text-white">
              Foto {currentPhotoIdx + 1} dari {selectedTemplate.photoCount}
            </div>

            {/* Angka Hitung Mundur Raksasa (200dp sesuai StyleGuide.md) */}
            <div className="font-display text-[140px] sm:text-[180px] font-bold text-[#FFD84D] leading-none animate-pulse drop-shadow-lg">
              {countdownNum}
            </div>

            <p className="absolute bottom-6 text-xs text-white/60 tracking-wider">
              Tatap lensa kamera di atas &bull; Senyum!
            </p>
          </div>
        )}

        {/* Step 4: Tinjau & Retake */}
        {step === 'review' && (
          <div className="w-full animate-fadeIn">
            <h2 className="font-display text-3xl font-bold mb-2">
              Tinjau Foto Anda
            </h2>
            <p className="text-sm text-white/60 mb-8">
              Puas dengan hasilnya? Anda dapat mengulang foto tertentu bila ingin bergaya lagi.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {capturedPhotos.map((color, idx) => (
                <div key={idx} className="relative group">
                  <div
                    style={{ backgroundColor: color }}
                    className="w-36 h-28 rounded-btn border-2 border-white/20 flex flex-col items-center justify-center text-xs font-bold text-white shadow-raise-1"
                  >
                    Foto #{idx + 1}
                  </div>
                  <button
                    onClick={() => retakeSingle(idx)}
                    className="mt-2 w-full py-1.5 rounded-chip bg-white/10 hover:bg-white/20 text-xs text-white font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ulangi</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('result')}
              className="h-16 px-10 rounded-btn bg-signal-ok hover:opacity-90 text-white font-display text-lg font-bold shadow-raise-3 transition-all btn-press flex items-center justify-center gap-3 mx-auto"
            >
              <Check className="w-5 h-5" />
              <span>Pakai Foto Ini &amp; Cetak Strip</span>
            </button>
          </div>
        )}

        {/* Step 5: Hasil Siap & QR Code */}
        {step === 'result' && (
          <div className="animate-fadeIn max-w-md bg-white/5 border border-white/10 p-8 rounded-panel shadow-raise-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-signal-ok flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="font-display text-2xl font-bold mb-1">
              Foto Berhasil Disimpan!
            </h2>
            <p className="text-xs text-white/60 mb-6">
              Pindai QR Code di bawah untuk mengunduh semua foto digital secara gratis ke ponsel Anda.
            </p>

            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-panel shadow-raise-2 flex items-center justify-center mb-6">
              <QrCode className="w-40 h-40 text-black" />
            </div>

            <p className="text-xs text-[#FFD84D] font-medium mb-6">
              Silakan ambil hasil cetak fisik 4R di meja operator.
            </p>

            <button
              onClick={() => {
                setStep('welcome');
                setCapturedPhotos([]);
              }}
              className="w-full h-12 rounded-btn border border-white/20 hover:bg-white/10 text-xs font-medium text-white transition-colors"
            >
              Selesai &bull; Kembali ke Layar Siaga
            </button>
          </div>
        )}
      </main>

      {/* Footer Kiosk */}
      <footer className="px-8 py-4 border-t border-white/10 flex items-center justify-between text-[11px] text-film z-10">
        <span>Kios Photobooth Terintegrasi</span>
        <Link href="/" className="hover:text-white transition-colors underline">
          Keluar Mode Kios
        </Link>
      </footer>
    </div>
  );
}
