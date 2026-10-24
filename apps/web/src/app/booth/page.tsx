'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Camera,
  RotateCcw,
  Check,
  Sparkles,
  Lock,
  KeyRound,
  Maximize,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { retroAudio } from '@/utils/audio';
import {
  PixelStreetLamp,
  PixelBench,
  PixelCar,
  PixelVendingMachine,
  PixelBushes,
  PixelFlyingBirds,
  PixelCrossStar,
} from '@/components/pixel/PixelPosterDecorations';
import { PixelCameraViewfinder } from '@/components/pixel/PixelCameraViewfinder';
import { PixelPhotoStripDispenser } from '@/components/pixel/PixelPhotoStripDispenser';

type BoothStep = 'welcome' | 'choosing_design' | 'countdown' | 'flash' | 'review' | 'result';

interface TemplateOption {
  slug: string;
  name: string;
  desc: string;
  photoCount: number;
  previewType: 'strip' | 'grid' | 'trio' | 'duo' | 'single';
}

const TEMPLATES: TemplateOption[] = [
  {
    slug: 'night-city-strip',
    name: 'NIGHT CITY STRIP',
    desc: 'Dua strip 4 foto (gaya photobooth)',
    photoCount: 4,
    previewType: 'strip',
  },
  {
    slug: 'night-city-grid',
    name: 'NIGHT CITY GRID',
    desc: '4 foto dalam kisi 2x2',
    photoCount: 4,
    previewType: 'grid',
  },
  {
    slug: 'moonlight-trio',
    name: 'MOONLIGHT TRIO',
    desc: '3 foto strip dengan bulan sabit',
    photoCount: 3,
    previewType: 'trio',
  },
  {
    slug: 'duo-skyline',
    name: 'DUO SKYLINE',
    desc: '2 foto bertingkat untuk berdua',
    photoCount: 2,
    previewType: 'duo',
  },
  {
    slug: 'poster-tunggal',
    name: 'POSTER TUNGGAL',
    desc: '1 foto besar bergaya poster expo',
    photoCount: 1,
    previewType: 'single',
  },
];

export default function BoothKioskPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [step, setStep] = useState<BoothStep>('welcome');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>(TEMPLATES[0]);
  const [visitorName, setVisitorName] = useState('DIANA');
  const [ticketNumber, setTicketNumber] = useState('#020');
  const [countdownNum, setCountdownNum] = useState(3);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isFlashActive, setIsFlashActive] = useState(false);

  // Periksa apakah tablet sudah diaktifkan di sesi browser ini
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('booth_kiosk_unlocked');
      if (saved === 'true') {
        setIsUnlocked(true);
      }
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setIsUnlocked(true);
      sessionStorage.setItem('booth_kiosk_unlocked', 'true');
      setPinError(false);
      if (soundEnabled) retroAudio.playSuccessChime();
    } else {
      setPinError(true);
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('booth_kiosk_unlocked');
    setPinInput('');
  };

  const toggleFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Countdown timer logic dengan efek suara 8-bit
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'countdown') {
      if (countdownNum > 0) {
        if (soundEnabled) retroAudio.playCountdownBeep(countdownNum === 1);
        timer = setTimeout(() => setCountdownNum(countdownNum - 1), 1000);
      } else {
        // Jepret shutter flash!
        if (soundEnabled) retroAudio.playShutterSound();
        setStep('flash');
        setIsFlashActive(true);
        setTimeout(() => {
          setIsFlashActive(false);
          const colors = ['#1D4ED8', '#BE185D', '#047857', '#B45309'];
          const newPhotos = [...capturedPhotos, colors[currentPhotoIdx % colors.length]];
          setCapturedPhotos(newPhotos);

          if (currentPhotoIdx + 1 < selectedTemplate.photoCount) {
            setCurrentPhotoIdx(currentPhotoIdx + 1);
            setCountdownNum(3);
            setStep('countdown');
          } else {
            setStep('review');
            if (soundEnabled) retroAudio.playSuccessChime();
          }
        }, 360);
      }
    }
    return () => clearTimeout(timer);
  }, [step, countdownNum, currentPhotoIdx, capturedPhotos, selectedTemplate.photoCount, soundEnabled]);

  const startCapture = () => {
    if (soundEnabled) retroAudio.playButtonClick();
    setCapturedPhotos([]);
    setCurrentPhotoIdx(0);
    setCountdownNum(3);
    setStep('countdown');
  };

  const retakeSingle = (idx: number) => {
    if (soundEnabled) retroAudio.playButtonClick();
    setCurrentPhotoIdx(idx);
    setCountdownNum(3);
    setStep('countdown');
  };

  // Mini preview layout pixel untuk kartu template
  const renderTemplateMiniPreview = (type: TemplateOption['previewType']) => {
    switch (type) {
      case 'strip':
        return (
          <div className="w-10 h-14 bg-black/60 border border-[#5CE1E6] p-0.5 flex gap-0.5">
            <div className="flex-1 flex flex-col gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-[#E02F75]/80" />
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-[#160078]" />
              ))}
            </div>
          </div>
        );
      case 'grid':
        return (
          <div className="w-10 h-14 bg-black/60 border border-[#5CE1E6] p-1 grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-[#00E599]/80" />
            ))}
          </div>
        );
      case 'trio':
        return (
          <div className="w-10 h-14 bg-black/60 border border-[#5CE1E6] p-1 flex flex-col gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 bg-[#FFD84D]/80" />
            ))}
          </div>
        );
      case 'duo':
        return (
          <div className="w-10 h-14 bg-black/60 border border-[#5CE1E6] p-1 flex flex-col gap-1.5">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 bg-[#7226FF]/80" />
            ))}
          </div>
        );
      case 'single':
        return (
          <div className="w-10 h-14 bg-black/60 border border-[#5CE1E6] p-1 flex items-center justify-center">
            <div className="w-full h-full bg-[#FE0168]/80 border border-white/40" />
          </div>
        );
    }
  };

  // =========================================================================
  // 1. TAMPILAN TERKUNCI (Jika Dibuka Tanpa PIN Operator)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="w-screen h-screen bg-[#050C38] text-white flex flex-col items-center justify-center p-6 relative select-none overflow-hidden font-pixel">
        {/* Latar Belakang Bintang & Skyline Kota */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-50 animate-twinkle pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-30 pointer-events-none" />

        {/* Dekorasi Pixel Poster di Bawah */}
        <div className="absolute bottom-0 left-8 z-0 hidden sm:block">
          <PixelStreetLamp height={110} />
        </div>
        <div className="absolute bottom-0 right-8 z-0 hidden sm:block">
          <PixelVendingMachine height={100} />
        </div>

        <div className="w-full max-w-sm bg-[#0C1230]/90 pixel-box p-8 text-center relative z-10 backdrop-blur">
          <div className="w-14 h-14 pixel-box-cyber bg-[#E02F75] text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <h1 className="font-pixel-title text-sm font-bold text-[#FFD84D] mb-2 leading-relaxed">
            KIOS BOOTH TERKUNCI
          </h1>
          <p className="text-xs text-white/70 mb-6 leading-relaxed">
            Layar ini khusus untuk tablet di bilik foto. Masukkan PIN operator untuk mengaktifkan mode aplikasi booth.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="PIN OPERATOR"
                className="w-full h-12 text-center text-base tracking-widest font-pixel-title border-4 border-[#4B57B2] bg-[#010030] text-[#FFD84D] focus:outline-none focus:border-[#E02F75] transition-all"
              />
              <KeyRound className="w-4 h-4 text-white/40 absolute left-3 top-4 pointer-events-none" />
            </div>

            {pinError && (
              <p className="text-xs text-[#FF5A57] font-bold">
                [!] PIN SALAH
              </p>
            )}

            <button
              type="submit"
              className="w-full h-12 pixel-btn bg-[#E02F75] text-white text-xs font-bold hover:bg-[#FF5A57]"
            >
              BUKA APLIKASI BOOTH
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-white/40">
            PIN Default Operator: <span className="text-[#FFD84D] font-mono font-bold">1234</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. TAMPILAN APLIKASI BOOTH PIXEL METROPOLITAN (SIAP FOTO)
  // =========================================================================
  return (
    <div className="relative w-screen h-screen bg-[#050C38] text-white flex flex-col justify-between overflow-hidden select-none font-pixel">
      {/* 1. Latar Belakang Gradien Langit Malam Metropolitan */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />

      {/* 2. Bintang Berkelip Pixel */}
      <div className="absolute inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-60 animate-twinkle pointer-events-none" />

      {/* 3. Bintang Silang 4 Sudut Shimmering dari Poster */}
      <div className="absolute top-12 left-16 pointer-events-none z-0">
        <PixelCrossStar size={18} />
      </div>
      <div className="absolute top-28 right-36 pointer-events-none z-0">
        <PixelCrossStar size={14} color="#5CE1E6" />
      </div>
      <div className="absolute top-44 left-1/4 pointer-events-none z-0">
        <PixelCrossStar size={10} color="#FFFFFF" />
      </div>

      {/* 4. Bulan Sabit Pixel di Sudut Kanan Atas */}
      <div className="absolute top-6 right-10 w-16 h-16 pointer-events-none pixel-art z-0 opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
        <Image src="/assets/pixel/moon.png" alt="Moon" width={64} height={64} className="pixel-art" />
      </div>

      {/* 5. Awan Pixel Mengambang Perlahan (Multi-Layer) */}
      <div className="absolute top-14 left-0 w-32 h-16 pointer-events-none pixel-art z-0 opacity-70 animate-cloud-slow">
        <Image src="/assets/pixel/cloud-1.png" alt="Cloud" width={128} height={64} className="pixel-art" />
      </div>
      <div className="absolute top-28 left-0 w-40 h-20 pointer-events-none pixel-art z-0 opacity-55 animate-cloud-fast">
        <Image src="/assets/pixel/cloud-2.png" alt="Cloud" width={160} height={80} className="pixel-art" />
      </div>

      {/* 6. Siluet Burung Terbang di Langit Malam */}
      <div className="absolute top-36 left-1/3 pointer-events-none z-0">
        <PixelFlyingBirds />
      </div>

      {/* 7. Skyline Gedung Kota Malam (Metropolitan) di Bagian Bawah */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-45 pointer-events-none z-0" />

      {/* 8. Elemen Foreground Jalan & Taman dari Poster */}
      {/* Lampu Jalan Kiri & Semak */}
      <div className="absolute bottom-6 left-4 z-0 hidden lg:flex flex-col items-center pointer-events-none">
        <PixelStreetLamp height={130} />
        <PixelBushes width={90} className="-mt-3" />
      </div>

      {/* Mobil Magenta Retro di Sisi Kiri Bawah */}
      <div className="absolute bottom-4 left-32 z-0 hidden xl:block pointer-events-none opacity-85">
        <PixelCar width={130} />
      </div>

      {/* Bangku Taman Tengah Bawah */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-0 hidden 2xl:block pointer-events-none opacity-75">
        <PixelBench width={120} />
      </div>

      {/* Vending Machine Biru Neon & Lampu Jalan Kanan */}
      <div className="absolute bottom-4 right-4 z-0 hidden lg:flex items-end gap-3 pointer-events-none">
        <PixelVendingMachine height={110} />
        <div className="flex flex-col items-center">
          <PixelStreetLamp height={130} />
          <PixelBushes width={80} className="-mt-3" />
        </div>
      </div>

      {/* Flash Effect Layer (StyleGuide.md: kuning #FFD84D) */}
      {isFlashActive && (
        <div className="absolute inset-0 bg-[#FFD84D] opacity-95 z-50 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Header Aplikasi Booth Kios */}
      <header className="px-6 py-4 flex items-center justify-between border-b-4 border-[#4B57B2] z-20 bg-[#0C1230]/85 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-[#00E599] animate-pulse shadow-[0_0_8px_#00E599]" />
          <span className="font-pixel-title text-xs text-[#A9B8FF] tracking-wider">
            EXPO WISUDA TIK 2026 &bull; PHOTOBOOTH APP
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="bg-[#131947] px-3 py-1 border-2 border-[#4B57B2] text-[#FFD84D] font-pixel-title text-xs">
            TIKET: {ticketNumber}
          </span>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) retroAudio.playButtonClick();
            }}
            className="p-2 border-2 border-[#4B57B2] hover:bg-white/10 text-[#FFD84D]"
            title="Toggle Suara 8-Bit"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 border-2 border-[#4B57B2] hover:bg-white/10 text-white"
            title="Layar Penuh (App Mode)"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={handleLockAgain}
            className="text-[10px] text-white/50 hover:text-white underline ml-2"
          >
            Kunci Kios
          </button>
        </div>
      </header>

      {/* Konten Utama Interaktif Booth */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-20 max-w-4xl mx-auto w-full relative">
        {/* Step 1: Layar Sapaan Pengunjung */}
        {step === 'welcome' && (
          <div className="animate-fadeIn max-w-2xl bg-[#0C1230]/90 pixel-box p-8 backdrop-blur">
            <div className="flex items-center justify-center gap-2 mb-3">
              <PixelCrossStar size={12} />
              <span className="font-pixel-title text-xs text-[#FFD84D] tracking-wider">
                ★ GILIRAN KAMU SEKARANG ★
              </span>
              <PixelCrossStar size={12} />
            </div>

            <h1 className="font-pixel-title text-2xl sm:text-3xl text-white mb-4 leading-relaxed">
              HALO, {visitorName}!
            </h1>
            <p className="text-sm text-[#A9B8FF] mb-8 leading-relaxed">
              Nomor antrean <span className="text-[#FFD84D] font-bold">{ticketNumber}</span> siap berfoto di bilik booth.
              Sentuh tombol di bawah untuk memilih desain bingkai foto 4R.
            </p>
            <button
              onClick={() => {
                if (soundEnabled) retroAudio.playButtonClick();
                setStep('choosing_design');
              }}
              className="h-16 px-10 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-sm font-bold flex items-center justify-center gap-3 mx-auto"
            >
              <span>PILIH DESAIN BINGKAI</span>
              <Sparkles className="w-5 h-5 text-[#FFD84D]" />
            </button>
          </div>
        )}

        {/* Step 2: Pilih Desain Bingkai dengan Pratinjau Miniatur Pixel */}
        {step === 'choosing_design' && (
          <div className="w-full animate-fadeIn bg-[#0C1230]/90 pixel-box p-6 sm:p-8 backdrop-blur">
            <h2 className="font-pixel-title text-base sm:text-lg text-[#FFD84D] mb-1">
              PILIH DESAIN BINGKAI FOTO 4R
            </h2>
            <p className="text-xs text-[#A9B8FF] mb-6">
              Pilih tata letak bingkai cetak favoritmu (kompatibel kertas foto 4R 1200x1800).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.slug}
                  onClick={() => {
                    if (soundEnabled) retroAudio.playButtonClick();
                    setSelectedTemplate(tpl);
                  }}
                  className={`p-3.5 text-left border-4 transition-all flex items-start gap-3 pixel-art ${
                    selectedTemplate.slug === tpl.slug
                      ? 'border-[#E02F75] bg-[#6700A3]/60 shadow-[0_0_12px_#E02F75]'
                      : 'border-[#4B57B2] bg-[#131947]/70 hover:border-white/50'
                  }`}
                >
                  {/* Pratinjau Miniatur Garis Pixel */}
                  <div className="flex-shrink-0">
                    {renderTemplateMiniPreview(tpl.previewType)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-pixel-title text-[11px] text-[#FFD84D] leading-tight">
                        {tpl.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-pixel-title bg-black/60 px-1.5 py-0.5 text-[#5CE1E6] border border-white/20 inline-block mb-1">
                      {tpl.photoCount}X JEPRET
                    </span>
                    <p className="text-[11px] text-white/70 leading-snug">{tpl.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={startCapture}
              className="h-14 px-8 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-xs font-bold flex items-center justify-center gap-2 mx-auto"
            >
              <Camera className="w-4 h-4" />
              <span>MULAI SESI FOTO ({selectedTemplate.photoCount}X JEPRET)</span>
            </button>
          </div>
        )}

        {/* Step 3: Hitung Mundur & Viewfinder Kamera Pixel Realistis */}
        {(step === 'countdown' || step === 'flash') && (
          <PixelCameraViewfinder
            countdownNum={countdownNum}
            currentPhotoIdx={currentPhotoIdx}
            totalPhotos={selectedTemplate.photoCount}
            cameraName="CANON 1200D"
          />
        )}

        {/* Step 4: Tinjau & Retake Per Foto */}
        {step === 'review' && (
          <div className="w-full animate-fadeIn bg-[#0C1230]/90 pixel-box p-6 sm:p-8 backdrop-blur">
            <h2 className="font-pixel-title text-base text-[#FFD84D] mb-1">
              TINJAU HASIL FOTO ANDA
            </h2>
            <p className="text-xs text-[#A9B8FF] mb-6">
              Puas dengan hasilnya? Anda dapat mengulang pose tertentu bila ingin bergaya lagi.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              {capturedPhotos.map((color, idx) => (
                <div key={idx} className="relative group">
                  <div
                    style={{ backgroundColor: color }}
                    className="w-36 h-28 border-4 border-[#4B57B2] flex flex-col items-center justify-center font-pixel-title text-xs text-white shadow-[4px_4px_0_0_#050C38]"
                  >
                    FOTO #{idx + 1}
                  </div>
                  <button
                    onClick={() => retakeSingle(idx)}
                    className="mt-2 w-full py-1.5 pixel-btn bg-[#6700A3] hover:bg-[#E02F75] text-[10px] text-white font-bold flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ULANGI</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (soundEnabled) {
                  retroAudio.playPrintSound();
                  retroAudio.playSuccessChime();
                }
                setStep('result');
              }}
              className="h-14 px-8 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-xs font-bold flex items-center justify-center gap-2 mx-auto"
            >
              <Check className="w-4 h-4" />
              <span>PAKAI FOTO INI &amp; SIMPAN STRIP</span>
            </button>
          </div>
        )}

        {/* Step 5: Hasil Siap & Animasi Dispenser Kertas Strip Foto */}
        {step === 'result' && (
          <PixelPhotoStripDispenser
            visitorName={visitorName}
            ticketNumber={ticketNumber}
            photos={capturedPhotos}
            templateName={selectedTemplate.name}
            onReset={() => {
              if (soundEnabled) retroAudio.playButtonClick();
              setStep('welcome');
              setCapturedPhotos([]);
            }}
          />
        )}
      </main>

      {/* Footer Kios */}
      <footer className="px-6 py-3 border-t-4 border-[#4B57B2] flex items-center justify-between text-[11px] text-[#A9B8FF] z-20 bg-[#0C1230]/90">
        <span>EXPO WISUDA JURUSAN TIK 2026 &bull; PHOTOBOOTH SYSTEM</span>
        <span className="text-[#FFD84D]">CANON 1200D &bull; EPSON L300 4R READY</span>
      </footer>
    </div>
  );
}
