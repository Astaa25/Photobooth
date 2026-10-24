import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import {
  PixelStreetLamp,
  PixelBench,
  PixelCar,
  PixelVendingMachine,
  PixelBushes,
  PixelFlyingBirds,
  PixelCrossStar,
} from '@/components/pixel/PixelPosterDecorations';
import {
  PixelTicketIcon,
  PixelCameraIcon,
  PixelPrinterIcon,
} from '@/components/pixel/PixelIcons';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050C38] text-white relative overflow-hidden flex flex-col justify-between font-pixel select-none">
      {/* 1. Latar Belakang Gradien Langit Malam Metropolitan */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />

      {/* 2. Bintang Berkelip Pixel */}
      <div className="fixed inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-60 animate-twinkle pointer-events-none" />

      {/* 3. Bintang Silang 4 Sudut Shimmering dari Poster */}
      <div className="absolute top-10 left-12 pointer-events-none z-0">
        <PixelCrossStar size={16} />
      </div>
      <div className="absolute top-24 right-28 pointer-events-none z-0">
        <PixelCrossStar size={14} color="#5CE1E6" />
      </div>
      <div className="absolute top-48 left-1/4 pointer-events-none z-0">
        <PixelCrossStar size={10} color="#FFFFFF" />
      </div>

      {/* 4. Bulan Sabit Pixel di Kanan Atas */}
      <div className="absolute top-6 right-10 w-16 h-16 pointer-events-none pixel-art z-0 opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
        <Image src="/assets/pixel/moon.png" alt="Moon" width={64} height={64} className="pixel-art" />
      </div>

      {/* 5. Awan Pixel Mengambang */}
      <div className="absolute top-14 left-0 w-32 h-16 pointer-events-none pixel-art z-0 opacity-70 animate-cloud-slow">
        <Image src="/assets/pixel/cloud-1.png" alt="Cloud" width={128} height={64} className="pixel-art" />
      </div>
      <div className="absolute top-28 left-0 w-40 h-20 pointer-events-none pixel-art z-0 opacity-55 animate-cloud-fast">
        <Image src="/assets/pixel/cloud-2.png" alt="Cloud" width={160} height={80} className="pixel-art" />
      </div>

      {/* 6. Siluet Burung Terbang */}
      <div className="absolute top-36 left-1/3 pointer-events-none z-0">
        <PixelFlyingBirds />
      </div>

      {/* 7. Skyline Gedung Kota Malam (Metropolitan) */}
      <div className="fixed bottom-0 left-0 right-0 h-48 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-40 pointer-events-none z-0" />

      {/* 8. Elemen Foreground Jalan & Taman dari Poster */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:flex flex-col items-center pointer-events-none">
        <PixelStreetLamp height={120} />
        <PixelBushes width={80} className="-mt-3" />
      </div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:flex items-end gap-3 pointer-events-none">
        <PixelVendingMachine height={105} />
        <div className="flex flex-col items-center">
          <PixelStreetLamp height={120} />
          <PixelBushes width={80} className="-mt-3" />
        </div>
      </div>

      {/* Main Container Beranda */}
      <main className="max-w-4xl mx-auto px-6 py-10 sm:py-16 w-full relative z-10 flex-1 flex flex-col justify-center">
        {/* Event Badge Pixel */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 pixel-box-cyber bg-[#E02F75] text-white text-xs font-pixel-title mb-6 self-start">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD84D]" />
          <span>EXPO WISUDA JURUSAN TIK 2026</span>
        </div>

        {/* Hero Title Pixel Metropolitan */}
        <div className="mb-4">
          <h1 className="font-pixel-title text-3xl sm:text-5xl text-white leading-tight tracking-wider">
            WELCOME TO <br />
            <span className="text-[#FFD84D] drop-shadow-[3px_3px_0_#E02F75]">
              PHOTOBOOTH TIK
            </span>
          </h1>
          <p className="font-pixel-title text-xs sm:text-sm text-[#5CE1E6] mt-2 tracking-widest">
            ★ POLITEKNIK NEGERI LHOKSEUMAWE ★
          </p>
        </div>

        <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed mb-10">
          Abadikan momen wisuda spesial Anda bersama teman dan keluarga.
          Daftar antrean langsung dari ponsel Anda, berfoto di bilik booth dengan kamera Canon DSLR,
          unduh seluruh foto digital gratis, serta dapatkan cetakan fisik 4R berkualitas tinggi.
        </p>

        {/* Action Cards Pengunjung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Card 1: Ambil Nomor Antrean */}
          <Link
            href="/register"
            className="group relative p-7 bg-[#0C1230]/90 pixel-box-cyber backdrop-blur hover:bg-[#131947]/95 transition-all"
          >
            <div className="w-14 h-14 pixel-box-cyber bg-[#E02F75] text-white flex items-center justify-center mb-5">
              <PixelTicketIcon size={32} />
            </div>
            <h2 className="font-pixel-title text-lg sm:text-xl text-[#FFD84D] mb-2 flex items-center justify-between">
              <span>AMBIL NOMOR ANTREAN</span>
              <ChevronRight className="w-5 h-5 text-[#E02F75] group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-white/70 text-xs leading-relaxed mb-4">
              Isi nama panggilan Anda untuk mendapatkan tiket antrean digital. Giliran Anda akan dipanggil langsung di layar bilik booth.
            </p>
            <span className="inline-flex items-center gap-1.5 font-pixel-title text-xs text-[#E02F75] group-hover:text-[#FF8E72]">
              DAFTAR SEKARANG &gt;&gt;
            </span>
          </Link>

          {/* Card 2: Buka Galeri Foto */}
          <Link
            href="/gallery"
            className="group relative p-7 bg-[#0C1230]/90 pixel-box backdrop-blur hover:bg-[#131947]/95 transition-all"
          >
            <div className="w-14 h-14 pixel-box bg-[#160078] text-white flex items-center justify-center mb-5">
              <PixelCameraIcon size={32} />
            </div>
            <h2 className="font-pixel-title text-lg sm:text-xl text-[#5CE1E6] mb-2 flex items-center justify-between">
              <span>GALERI FOTO SAYA</span>
              <ChevronRight className="w-5 h-5 text-[#5CE1E6] group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-white/70 text-xs leading-relaxed mb-4">
              Sudah selesai berfoto? Buka galeri untuk melihat pratinjau hasil foto pose individual, strip cetak 4R, dan unduh paket ZIP gratis ke ponsel.
            </p>
            <span className="inline-flex items-center gap-1.5 font-pixel-title text-xs text-[#5CE1E6] group-hover:text-[#FFD84D]">
              BUKA GALERI &gt;&gt;
            </span>
          </Link>
        </div>

        {/* Info Fasilitas Gratis & Cetak 4R */}
        <div className="p-5 bg-[#0C1230]/90 pixel-box backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 pixel-box bg-[#0D5235] text-[#00E599] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-pixel-title text-xs text-[#00E599]">HASIL FOTO DIGITAL 100% GRATIS</p>
              <p className="text-xs text-white/60">Tersedia 5 pilihan desain bingkai 4R &bull; Resolusi asli Canon EOS</p>
            </div>
          </div>
          <div className="text-xs text-[#FFD84D] font-pixel-title sm:text-right flex items-center gap-2">
            <PixelPrinterIcon size={18} />
            <span>CETAK FISIK 4R: Rp15.000 / LEMBAR</span>
          </div>
        </div>
      </main>

      {/* Footer Beranda (Akses Tersembunyi Operator) */}
      <footer className="w-full border-t-4 border-[#4B57B2] py-4 px-6 relative z-10 bg-[#0C1230]/90 backdrop-blur">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A9B8FF]">
          <p>&copy; 2026 Jurusan TIK &bull; Photobooth Terintegrasi Expo Wisuda</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-[#FFD84D] transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk Operator</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
