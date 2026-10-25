'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Shield,
  Sparkles,
  CheckCircle,
  RotateCcw,
  Film,
  Camera,
  X,
  Search,
  Maximize2,
} from 'lucide-react';
import { PixelCameraIcon, PixelPrinterIcon, PixelTicketIcon } from '@/components/pixel/PixelIcons';
import { PixelCrossStar, PixelStreetLamp, PixelVendingMachine } from '@/components/pixel/PixelPosterDecorations';
import { retroAudio } from '@/utils/audio';
import { downloadCompositePhotoStrip, downloadSinglePhoto } from '@/utils/photoDownloadHelper';

interface VisitorGalleryItem {
  id: string;
  number: string;
  nickname: string;
  time: string;
  date: string;
  template: string;
  photos: { id: number; color: string; label: string }[];
  accentColor: string;
}

const DEFAULT_GALLERIES: VisitorGalleryItem[] = [
  {
    id: 'gal-1',
    number: '#001',
    nickname: 'Diana',
    time: '10:14 WIB',
    date: '24 Oktober 2026',
    template: 'NIGHT CITY STRIP 4R',
    accentColor: '#E02F75',
    photos: [
      { id: 1, color: '#1D4ED8', label: 'Foto 1' },
      { id: 2, color: '#BE185D', label: 'Foto 2' },
      { id: 3, color: '#047857', label: 'Foto 3' },
      { id: 4, color: '#B45309', label: 'Foto 4' },
    ],
  },
  {
    id: 'gal-2',
    number: '#002',
    nickname: 'Budi & Sari',
    time: '10:28 WIB',
    date: '24 Oktober 2026',
    template: 'DUO SKYLINE 4R',
    accentColor: '#7226FF',
    photos: [
      { id: 1, color: '#4338CA', label: 'Foto 1' },
      { id: 2, color: '#DB2777', label: 'Foto 2' },
      { id: 3, color: '#059669', label: 'Foto 3' },
      { id: 4, color: '#D97706', label: 'Foto 4' },
    ],
  },
  {
    id: 'gal-3',
    number: '#003',
    nickname: 'Kelompok 4 Wisuda',
    time: '10:45 WIB',
    date: '24 Oktober 2026',
    template: 'NIGHT CITY GRID 4R',
    accentColor: '#00E599',
    photos: [
      { id: 1, color: '#2563EB', label: 'Foto 1' },
      { id: 2, color: '#C026D3', label: 'Foto 2' },
      { id: 3, color: '#16A34A', label: 'Foto 3' },
      { id: 4, color: '#EA580C', label: 'Foto 4' },
    ],
  },
  {
    id: 'gal-4',
    number: '#005',
    nickname: 'Rani & Teman',
    time: '11:05 WIB',
    date: '24 Oktober 2026',
    template: 'MOONLIGHT TRIO 4R',
    accentColor: '#5CE1E6',
    photos: [
      { id: 1, color: '#3B82F6', label: 'Foto 1' },
      { id: 2, color: '#EC4899', label: 'Foto 2' },
      { id: 3, color: '#10B981', label: 'Foto 3' },
      { id: 4, color: '#F59E0B', label: 'Foto 4' },
    ],
  },
  {
    id: 'gal-5',
    number: '#006',
    nickname: 'Aris & Rina',
    time: '11:20 WIB',
    date: '24 Oktober 2026',
    template: 'NIGHT CITY STRIP 4R',
    accentColor: '#FFD84D',
    photos: [
      { id: 1, color: '#1E40AF', label: 'Foto 1' },
      { id: 2, color: '#9D174D', label: 'Foto 2' },
      { id: 3, color: '#065F46', label: 'Foto 3' },
      { id: 4, color: '#92400E', label: 'Foto 4' },
    ],
  },
  {
    id: 'gal-6',
    number: '#007',
    nickname: 'Keluarga Dosen TIK',
    time: '11:40 WIB',
    date: '24 Oktober 2026',
    template: 'POSTER TUNGGAL 4R',
    accentColor: '#FE0168',
    photos: [
      { id: 1, color: '#1E3A8A', label: 'Foto 1' },
      { id: 2, color: '#831843', label: 'Foto 2' },
      { id: 3, color: '#064E3B', label: 'Foto 3' },
      { id: 4, color: '#78350F', label: 'Foto 4' },
    ],
  },
];

export default function GalleryPage() {
  const [galleries, setGalleries] = useState<VisitorGalleryItem[]>(DEFAULT_GALLERIES);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorGalleryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [singleDownloadSuccess, setSingleDownloadSuccess] = useState<string | null>(null);

  // Status Pemutar Video Singkat Foto (otomatis berputar tiada henti)
  const [videoFrameIdx, setVideoFrameIdx] = useState(0);

  // Ambil data sesi yang tersimpan dari booth jika ada
  useEffect(() => {
    try {
      const raw = localStorage.getItem('photobooth_completed_sessions');
      if (raw) {
        const extra = JSON.parse(raw);
        if (Array.isArray(extra) && extra.length > 0) {
          const formattedExtra: VisitorGalleryItem[] = extra.map((item: any, i: number) => ({
            id: item.id || `extra-${i}`,
            number: item.number || `#09${i}`,
            nickname: item.nickname || 'Pengunjung Baru',
            time: item.time || '12:00 WIB',
            date: '24 Oktober 2026',
            template: item.template || 'NIGHT CITY STRIP 4R',
            accentColor: '#FE0168',
            photos: [
              { id: 1, color: '#1D4ED8', label: 'Foto 1' },
              { id: 2, color: '#BE185D', label: 'Foto 2' },
              { id: 3, color: '#047857', label: 'Foto 3' },
              { id: 4, color: '#B45309', label: 'Foto 4' },
            ],
          }));

          // Gabungkan tanpa duplikasi nomor
          const existingNums = new Set(DEFAULT_GALLERIES.map((g) => g.number));
          const newUnique = formattedExtra.filter((g) => !existingNums.has(g.number));
          setGalleries([...newUnique, ...DEFAULT_GALLERIES]);
        }
      }
    } catch {}
  }, []);

  // Animasi Pemutar Video Singkat Foto (slideshow berkecepatan 1.4 detik per pose secara berkelanjutan)
  useEffect(() => {
    if (!selectedVisitor || !selectedVisitor.photos.length) return;
    const interval = setInterval(() => {
      setVideoFrameIdx((prev) => (prev + 1) % selectedVisitor.photos.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [selectedVisitor]);

  // Unduh Satu Foto Individual
  const handleDownloadPhoto = async (photo: { id: number; color: string; label?: string }) => {
    if (!selectedVisitor) return;
    retroAudio.playPrintSound();
    try {
      const fileName = `${selectedVisitor.nickname}_Foto_${photo.id}.jpg`;
      await downloadSinglePhoto(
        photo.color,
        fileName,
        `${selectedVisitor.nickname} - ${photo.label || `Pose #${photo.id}`}`
      );
      setSingleDownloadSuccess(fileName);
      retroAudio.playSuccessChime();
      setTimeout(() => setSingleDownloadSuccess(null), 2500);
    } catch (err) {
      console.warn('Gagal mengunduh foto:', err);
    }
  };

  // Unduh Frame Komposit 4R
  const handleDownloadFrame4R = async () => {
    if (!selectedVisitor) return;
    retroAudio.playPrintSound();
    try {
      const fileName = `${selectedVisitor.nickname}_Frame_4R.jpg`;
      await downloadCompositePhotoStrip({
        photos: selectedVisitor.photos.map((p) => p.color),
        visitorName: selectedVisitor.nickname,
        ticketNumber: selectedVisitor.number,
        templateName: selectedVisitor.template,
        fileName,
      });
      setSingleDownloadSuccess(fileName);
      retroAudio.playSuccessChime();
      setTimeout(() => setSingleDownloadSuccess(null), 2500);
    } catch (err) {
      console.warn('Gagal mengunduh frame 4R:', err);
    }
  };

  // Unduh Video Rekap (Slideshow Klip)
  const handleDownloadVideo = async () => {
    if (!selectedVisitor) return;
    retroAudio.playPrintSound();
    try {
      const fileName = `${selectedVisitor.nickname}_Video_Rekap.jpg`;
      const activePhoto = selectedVisitor.photos[videoFrameIdx] || selectedVisitor.photos[0];
      await downloadSinglePhoto(
        activePhoto?.color || '#1D4ED8',
        fileName,
        `${selectedVisitor.nickname} - Video Slideshow Clip`
      );
      setSingleDownloadSuccess(fileName);
      retroAudio.playSuccessChime();
      setTimeout(() => setSingleDownloadSuccess(null), 2500);
    } catch (err) {
      console.warn('Gagal mengunduh video rekap:', err);
    }
  };

  // Unduh Semua File Sekaligus (Frame 4R + Seluruh Foto)
  const handleDownloadAllZip = async () => {
    if (!selectedVisitor) return;
    retroAudio.playPrintSound();
    setDownloadingZip(true);
    try {
      // 1. Unduh Frame 4R
      await downloadCompositePhotoStrip({
        photos: selectedVisitor.photos.map((p) => p.color),
        visitorName: selectedVisitor.nickname,
        ticketNumber: selectedVisitor.number,
        templateName: selectedVisitor.template,
        fileName: `${selectedVisitor.nickname}_Frame_4R.jpg`,
      });

      // 2. Unduh setiap foto individual berturut-turut
      for (let i = 0; i < selectedVisitor.photos.length; i++) {
        const photo = selectedVisitor.photos[i];
        await new Promise((r) => setTimeout(r, 350));
        await downloadSinglePhoto(
          photo.color,
          `${selectedVisitor.nickname}_Foto_${photo.id}.jpg`,
          `${selectedVisitor.nickname} - Foto #${photo.id}`
        );
      }

      setDownloadSuccess(true);
      retroAudio.playSuccessChime();
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.warn('Gagal mengunduh paket berkas:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Filter daftar berdasarkan pencarian
  const filteredGalleries = galleries.filter((g) =>
    g.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050C38] text-white font-pixel flex flex-col justify-between relative overflow-x-hidden select-none">
      {/* 1. Latar Belakang Gradien Langit Malam & Bintang Pixel */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-50 animate-twinkle pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-44 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-30 pointer-events-none" />

      {/* Dekorasi Sudut */}
      <div className="fixed bottom-0 left-6 z-0 hidden xl:block pointer-events-none">
        <PixelStreetLamp height={120} />
      </div>
      <div className="fixed bottom-0 right-6 z-0 hidden xl:block pointer-events-none">
        <PixelVendingMachine height={110} />
      </div>

      {/* Konten Utama Galeri Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10 w-full flex-1">
        <Link
          href="/"
          onClick={() => retroAudio.playButtonClick()}
          className="inline-flex items-center gap-2 text-xs font-pixel-title text-[#A9B8FF] hover:text-[#FFD84D] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&lt;&lt; KEMBALI KE BERANDA</span>
        </Link>

        {/* Header Galeri */}
        <header className="mb-8 pb-6 border-b-4 border-[#4B57B2] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#FFD84D] mb-1">
              <PixelCrossStar size={12} />
              <span className="font-pixel-title text-xs tracking-wider">
                GALERI DIGITAL PHOTOBOOTH
              </span>
              <PixelCrossStar size={12} />
            </div>
            <h1 className="font-pixel-title text-xl sm:text-3xl text-white">
              FOTO &amp; VIDEO WISUDA TIK 2026
            </h1>
            <p className="text-xs text-[#5CE1E6] mt-1">
              Pilih kotak nama Anda untuk melihat dan mengunduh 4-6 file (Foto Asli + Frame 4R + Video Rekap).
            </p>
          </div>

          {/* Kolom Pencarian Nama / Nomor Tiket */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / #nomor..."
              className="w-full h-11 pl-10 pr-3 border-2 border-[#4B57B2] bg-[#0C1230] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75] transition-all"
            />
            <Search className="w-4 h-4 text-[#A9B8FF]/60 absolute left-3 top-3.5 pointer-events-none" />
          </div>
        </header>

        {/* Floating Toast Notifikasi Unduh (Tidak Merusak / Menggeser Grid Galeri) */}
        {singleDownloadSuccess && (
          <div className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 bg-[#0C1230] border-2 border-[#00E599] text-white text-xs font-pixel-title px-4 py-2.5 max-w-sm w-auto h-auto shadow-[0_4px_25px_rgba(0,0,0,0.85),0_0_15px_rgba(0,229,153,0.4)] animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-[#00E599] shrink-0" />
            <span className="leading-snug">Berhasil mengunduh <span className="text-[#00E599]">{singleDownloadSuccess}</span>!</span>
          </div>
        )}

        {/* GRID KOTAK FOTO SETIAP PENGUNJUNG (RESPONSIF 1 / 2 / 3 KOLOM) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredGalleries.map((visitor) => (
            <div
              key={visitor.id}
              onClick={() => {
                retroAudio.playButtonClick();
                setSelectedVisitor(visitor);
                setVideoFrameIdx(0);
              }}
              className="group cursor-pointer bg-[#0C1230]/95 pixel-box p-5 backdrop-blur hover:bg-[#131947] hover:scale-[1.02] transition-all"
            >
              {/* Header Kotak Pengunjung */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-pixel-title text-sm text-[#FFD84D]">
                  {visitor.number}
                </span>
                <span className="text-[10px] font-pixel-title bg-[#160078] px-2 py-0.5 text-[#5CE1E6] border border-[#5CE1E6]/30">
                  {visitor.time}
                </span>
              </div>

              {/* Pratinjau Foto Kotak Miniatur (Photo Strip Thumbnail) */}
              <div className="relative aspect-[4/3] w-full bg-black/60 border-2 border-[#4B57B2] mb-4 overflow-hidden p-2 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-1.5 w-full h-full">
                  {visitor.photos.map((p, idx) => (
                    <div
                      key={idx}
                      style={{ backgroundColor: p.color }}
                      className="flex items-center justify-center text-[9px] font-pixel-title text-white/80 border border-white/20"
                    >
                      #{idx + 1}
                    </div>
                  ))}
                </div>

                {/* Overlay Hover Icon Buka */}
                <div className="absolute inset-0 bg-[#050C38]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="pixel-btn px-3 py-1.5 bg-[#E02F75] text-[10px] text-white font-bold flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>BUKA FILE</span>
                  </span>
                </div>
              </div>

              {/* Nama Pengunjung & Total File */}
              <h2 className="font-pixel-title text-base text-white mb-1 group-hover:text-[#FFD84D] transition-colors truncate">
                {visitor.nickname}
              </h2>
              <p className="text-[11px] text-white/60 mb-3 truncate">
                Template: {visitor.template}
              </p>

              {/* Badge Jumlah File (4 Foto + Frame + Video) */}
              <div className="flex items-center justify-between text-[10px] font-pixel-title text-[#00E599] pt-2 border-t border-[#4B57B2]/40">
                <span>6 FILES TERSEDIA</span>
                <span className="text-[#E02F75] group-hover:translate-x-1 transition-transform">
                  LIHAT &gt;&gt;
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info Privasi */}
        <div className="p-4 pixel-box bg-[#0C1230]/90 backdrop-blur text-xs text-white/70 flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#00E599] shrink-0" />
          <p className="leading-relaxed text-[11px]">
            Seluruh foto digital dan video rekap dapat diunduh gratis tanpa watermark. Tersedia dalam resolusi penuh kamera Canon EOS 1200D.
          </p>
        </div>
      </main>

      {/* ===================================================================
          MODAL DETAIL PENGUNJUNG: MENAMPILKAN 4-6 FILE (FOTO, FRAME, VIDEO)
          BISA DI-DOWNLOAD SATU-SATU MAUPUN SEKALIAN
          =================================================================== */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0C1230] pixel-box border-4 border-[#E02F75] p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto">
            {/* Tombol Tutup [X] */}
            <button
              onClick={() => setSelectedVisitor(null)}
              className="absolute top-4 right-4 p-2 pixel-box bg-[#131947] hover:bg-[#FE0168] text-white"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="pr-12 mb-6 pb-4 border-b-2 border-[#4B57B2]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-pixel-title text-sm text-[#FFD84D]">
                  {selectedVisitor.number}
                </span>
                <span className="text-white/40">&bull;</span>
                <span className="text-xs text-[#5CE1E6] font-pixel-title">
                  {selectedVisitor.time} ({selectedVisitor.date})
                </span>
              </div>

              <h2 className="font-pixel-title text-xl sm:text-2xl text-white">
                BERKAS FOTO &bull; {selectedVisitor.nickname.toUpperCase()}
              </h2>
              <p className="text-xs text-white/70 mt-1">
                Total 6 File Digital: 4 Foto Individual Canon RAW + 1 Foto Frame 4R + 1 Video Singkat Slideshow
              </p>

              {/* Tombol Unduh Semua (ZIP) */}
              <div className="mt-4">
                <button
                  onClick={handleDownloadAllZip}
                  disabled={downloadingZip}
                  className="h-12 px-6 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-xs flex items-center gap-2"
                >
                  {downloadingZip ? (
                    <span>MENYIAPKAN PAKET ZIP...</span>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-[#FFD84D]" />
                      <span>ZIP BERHASIL TERUNDUH!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>UNDUH SEMUA SEKALIAN (PAKET ZIP GRATIS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DAFTAR FILE DIGITAL LENGKAP */}
            <div className="space-y-6">
              {/* BAGIAN 1: VIDEO SINGKAT REKAP FOTO (1 FILE) */}
              <div className="bg-[#131947]/90 pixel-box-cyber p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-[#FE0168]" />
                    <h3 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D]">
                      VIDEO SINGKAT FOTO (SLIDESHOW MP4)
                    </h3>
                  </div>
                  <span className="text-[10px] font-pixel-title bg-[#0C1230] px-2 py-0.5 text-[#00E599] border border-[#00E599]/30">
                    ANIMATED CLIP
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Pemutar Video Singkat Retro */}
                  <div className="relative aspect-[16/10] bg-black border-2 border-[#5CE1E6] overflow-hidden flex flex-col items-center justify-center pixel-crt">
                    {/* Frame Foto Aktif */}
                    <div
                      className="w-full h-full flex flex-col items-center justify-center transition-colors duration-300"
                      style={{ backgroundColor: selectedVisitor.photos[videoFrameIdx]?.color }}
                    >
                      <span className="bg-black/70 px-3 py-1 font-pixel-title text-xs text-white border border-white/30">
                        {selectedVisitor.photos[videoFrameIdx]?.label || `Foto ${videoFrameIdx + 1}`}
                      </span>
                    </div>

                    {/* HUD Overlay Video */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[9px] font-pixel-title bg-black/60 px-1.5 py-0.5 text-[#FE0168]">
                      <span className="w-2 h-2 bg-[#FE0168] animate-pulse" />
                      <span>PLAY &bull; 1080P</span>
                    </div>

                    <div className="absolute bottom-2 right-2 text-[8px] font-pixel-title bg-black/60 px-1.5 py-0.5 text-white/80">
                      FRAME {videoFrameIdx + 1}/{selectedVisitor.photos.length}
                    </div>
                  </div>

                  {/* Kontrol & Tombol Unduh Video */}
                  <div className="md:col-span-2 flex flex-col justify-between h-full space-y-3">
                    <p className="text-xs text-white/80 leading-relaxed">
                      Klip video animasi pendek berdurasi 6 detik yang menggabungkan seluruh pose foto secara otomatis dengan transisi arcade retro dan efek shutter kamera.
                    </p>

                    <div>
                      <button
                        onClick={handleDownloadVideo}
                        className="h-11 px-6 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-xs font-pixel-title text-white flex items-center justify-center gap-2 shadow-[3px_3px_0_0_#050C38]"
                      >
                        <Download className="w-4 h-4" />
                        <span>UNDUH VIDEO (MP4)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: FOTO FRAME KOMPOSIT 4R (1 FILE) */}
              <div className="bg-[#131947]/90 pixel-box p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#5CE1E6]" />
                    <h3 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D]">
                      FOTO FRAME KOMPOSIT 4R (SIAP CETAK)
                    </h3>
                  </div>
                  <span className="text-[10px] font-pixel-title bg-[#0C1230] px-2 py-0.5 text-[#5CE1E6] border border-[#5CE1E6]/30">
                    1200 x 1800 PX
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Pratinjau Frame 4R */}
                  <div className="w-40 sm:w-48 mx-auto bg-gradient-to-b from-[#0C1230] to-[#160078] border-4 border-[#E02F75] p-2.5 shadow-[4px_4px_0_0_#050C38]">
                    <div className="text-center font-pixel-title text-[7px] text-[#FFD84D] border-b border-white/20 pb-1 mb-1.5">
                      EXPO WISUDA TIK 2026
                    </div>
                    <div className="space-y-1 my-1">
                      {selectedVisitor.photos.map((p, idx) => (
                        <div
                          key={idx}
                          style={{ backgroundColor: p.color }}
                          className="h-9 border border-white/30 flex items-center justify-center text-[8px] font-pixel-title text-white"
                        >
                          #{idx + 1}
                        </div>
                      ))}
                    </div>
                    <div className="text-center font-pixel-title text-[7px] text-[#5CE1E6] border-t border-white/20 pt-1 mt-1.5">
                      {selectedVisitor.nickname} &bull; {selectedVisitor.number}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <p className="text-xs text-white/80 leading-relaxed">
                      Desain cetak komposit resolusi tinggi 300 DPI dengan template <span className="text-[#FFD84D] font-bold">{selectedVisitor.template}</span>. Siap dicetak langsung ke kertas foto 4R glossy atau dipajang di media sosial.
                    </p>

                    <button
                      onClick={handleDownloadFrame4R}
                      className="h-10 px-5 pixel-btn bg-[#7226FF] hover:bg-[#8645FF] text-xs font-pixel-title text-white flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>UNDUH FRAME 4R (JPG)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BAGIAN 3: FOTO INDIVIDUAL ASLI (4 FILE) */}
              <div className="bg-[#0C1230] pixel-box p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#00E599]" />
                    <h3 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D]">
                      FOTO INDIVIDUAL ASLI ({selectedVisitor.photos.length} FOTO TERPISAH)
                    </h3>
                  </div>
                  <span className="text-[10px] font-pixel-title bg-[#131947] px-2 py-0.5 text-white/70">
                    CANON EOS RAW/JPG
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectedVisitor.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-[#131947]/90 border-2 border-[#4B57B2] p-3 flex items-center justify-between gap-3 shadow-[2px_2px_0_0_#050C38]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          style={{ backgroundColor: photo.color }}
                          className="w-12 h-11 border border-white/30 flex items-center justify-center font-pixel-title text-xs text-white shrink-0"
                        >
                          #{photo.id}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-pixel-title text-xs text-white truncate">
                            {photo.label || `Foto ${photo.id}`}
                          </p>
                          <p className="text-[10px] text-[#5CE1E6] truncate">1920 x 1280 &bull; 2.4 MB</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadPhoto(photo)}
                        className="w-10 h-10 pixel-box bg-[#050C38] hover:bg-[#E02F75] text-[#5CE1E6] hover:text-white shrink-0 flex items-center justify-center transition-colors"
                        title={`Unduh ${photo.label || `Foto ${photo.id}`}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Galeri */}
      <footer className="w-full border-t-4 border-[#4B57B2] py-3 px-6 relative z-10 bg-[#0C1230]/90 text-center text-[10px] text-[#A9B8FF]">
        EXPO WISUDA TIK 2026 &bull; SISTEM GALERI DIGITAL FOTO &amp; VIDEO
      </footer>
    </div>
  );
}
