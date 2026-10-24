'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Check,
  X,
  Eye,
  LogOut,
  Camera,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { QueueStatus, type QueueStatusType } from '@photobooth/shared';
import {
  PixelCameraIcon,
  PixelPrinterIcon,
  PixelTicketIcon,
  PixelCoinIcon,
} from '@/components/pixel/PixelIcons';
import { PixelCrossStar } from '@/components/pixel/PixelPosterDecorations';
import { retroAudio } from '@/utils/audio';

interface QueueItem {
  id: string;
  number: string;
  nickname: string;
  status: QueueStatusType;
  registeredAt: string;
  printCopies?: number;
}

const INITIAL_QUEUE: QueueItem[] = [
  { id: '1', number: '#001', nickname: 'Diana', status: QueueStatus.IN_SESSION, registeredAt: '10:14', printCopies: 2 },
  { id: '2', number: '#002', nickname: 'Budi & Sari', status: QueueStatus.QUEUED, registeredAt: '10:18', printCopies: 1 },
  { id: '3', number: '#003', nickname: 'Kelompok 4 Wisuda', status: QueueStatus.QUEUED, registeredAt: '10:22', printCopies: 3 },
  { id: '4', number: '#004', nickname: 'Aris', status: QueueStatus.WAITING, registeredAt: '10:05', printCopies: 1 },
  { id: '5', number: '#005', nickname: 'Rani', status: QueueStatus.DONE, registeredAt: '09:55', printCopies: 2 },
];

export default function AdminDashboardPage() {
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printingItem, setPrintingItem] = useState<QueueItem | null>(null);
  const [printCopies, setPrintCopies] = useState<number>(2);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateStatus = (id: string, newStatus: QueueStatusType, label: string) => {
    if (soundEnabled) {
      if (newStatus === QueueStatus.DONE) {
        retroAudio.playCoinSound();
      } else {
        retroAudio.playButtonClick();
      }
    }
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    showToast(label);
  };

  const handlePrint = (item: QueueItem) => {
    if (soundEnabled) retroAudio.playPrintSound();
    setPrintingItem(item);
    showToast(`Mengirim tugas cetak ${printCopies}x lembar 4R ke Epson L300...`);
    setTimeout(() => {
      setPrintingItem(null);
      showToast(`Cetak selesai untuk ${item.nickname}!`);
    }, 2800);
  };

  const getStatusBadge = (status: QueueStatusType) => {
    switch (status) {
      case QueueStatus.IN_SESSION:
        return (
          <span className="pixel-badge inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] bg-[#6700A3] text-[#FFD84D]">
            <span className="w-1.5 h-1.5 bg-[#FE0168] animate-pulse" />
            [ SEDANG FOTO ]
          </span>
        );
      case QueueStatus.QUEUED:
        return (
          <span className="pixel-badge inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] bg-[#0C1230] text-[#5CE1E6]">
            <span className="w-1.5 h-1.5 bg-[#5CE1E6]" />
            [ DALAM ANTREAN ]
          </span>
        );
      case QueueStatus.WAITING:
        return (
          <span className="pixel-badge inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] bg-[#A86400]/40 text-[#FFD84D]">
            <span className="w-1.5 h-1.5 bg-[#FFD84D]" />
            [ MENUNGGU ]
          </span>
        );
      case QueueStatus.DONE:
        return (
          <span className="pixel-badge inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] bg-[#0D5235] text-[#00E599]">
            <span className="w-1.5 h-1.5 bg-[#00E599]" />
            [ SELESAI ]
          </span>
        );
      case QueueStatus.CANCELLED:
        return (
          <span className="pixel-badge inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] bg-black text-white/50 line-through">
            [ BATAL ]
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050C38] text-white font-pixel relative select-none overflow-x-hidden">
      {/* Background Layer: Langit Malam Gradien & Bintang Berkelip */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-40 animate-twinkle pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-25 pointer-events-none" />

      {/* Top Header Bar Arcade */}
      <header className="relative z-10 bg-[#0C1230]/90 border-b-4 border-[#4B57B2] px-6 py-4 backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            onClick={() => soundEnabled && retroAudio.playButtonClick()}
            className="p-2 pixel-box bg-[#131947] hover:bg-[#160078] text-[#5CE1E6] transition-colors"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <PixelCrossStar size={12} />
              <h1 className="font-pixel-title text-base sm:text-lg text-[#FFD84D] tracking-wider">
                OPERATOR COMMAND DECK
              </h1>
              <PixelCrossStar size={12} />
            </div>
            <p className="text-xs text-[#A9B8FF] mt-0.5">
              EXPO WISUDA TIK 2026 &bull; Antrean, Sesi Tablet &amp; Cetak 4R
            </p>
          </div>
        </div>

        {/* Telemetri Hardware & Navigasi Kanan */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Hardware Kios */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-pixel-title bg-[#050C38] px-3 py-1.5 border-2 border-[#4B57B2]">
            <span className="flex items-center gap-1 text-[#00E599]">
              <span className="w-2 h-2 bg-[#00E599] animate-pulse" />
              1200D: OK
            </span>
            <span className="text-white/30">|</span>
            <span className="flex items-center gap-1 text-[#5CE1E6]">
              <span className="w-2 h-2 bg-[#5CE1E6]" />
              L300: READY
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 pixel-box bg-[#131947] hover:bg-[#160078] text-[#FFD84D]"
            title="Toggle Suara 8-Bit"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Tombol Buka Layar Booth */}
          <a
            href="/booth"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundEnabled && retroAudio.playButtonClick()}
            className="inline-flex items-center gap-2 px-3 py-1.5 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-xs font-bold shadow-violet-glow"
            title="Buka Layar Kios Booth untuk Tablet"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>LAYAR BOOTH (TABLET)</span>
          </a>

          {/* Tombol Keluar Logout */}
          <button
            onClick={() => {
              if (soundEnabled) retroAudio.playButtonClick();
              document.cookie = 'booth_admin_session=; path=/; max-age=0; SameSite=Lax';
              window.location.href = '/admin/login';
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 pixel-box bg-[#050C38] hover:bg-[#A81D53] text-[10px] text-white/70 hover:text-white transition-colors"
            title="Keluar dari sesi operator"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>KELUAR</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* KPI Ringkasan Pixel Kartrid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Kartrid 1: Dalam Antrean */}
          <div className="pixel-box bg-[#0C1230]/90 p-5 backdrop-blur flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#A9B8FF] mb-1">
                <PixelTicketIcon size={16} />
                <span>DALAM ANTREAN</span>
              </div>
              <div className="font-pixel-title text-3xl sm:text-4xl text-[#FFD84D]">
                {queue.filter((q) => q.status === QueueStatus.QUEUED || q.status === QueueStatus.WAITING).length}
              </div>
              <span className="text-[10px] text-white/50 mt-1 block">Tercatat di bilik tunggu</span>
            </div>
            <div className="w-12 h-12 pixel-box bg-[#131947] flex items-center justify-center text-[#FFD84D]">
              <PixelTicketIcon size={28} />
            </div>
          </div>

          {/* Kartrid 2: Sesi Selesai */}
          <div className="pixel-box bg-[#0C1230]/90 p-5 backdrop-blur flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#A9B8FF] mb-1">
                <PixelCameraIcon size={16} />
                <span>SESI SELESAI</span>
              </div>
              <div className="font-pixel-title text-3xl sm:text-4xl text-[#00E599]">
                {queue.filter((q) => q.status === QueueStatus.DONE).length}
              </div>
              <span className="text-[10px] text-white/50 mt-1 block">Foto tersimpan di cloud</span>
            </div>
            <div className="w-12 h-12 pixel-box bg-[#0D5235] flex items-center justify-center text-[#00E599]">
              <PixelCameraIcon size={28} />
            </div>
          </div>

          {/* Kartrid 3: Harga Cetak & Pendapatan */}
          <div className="pixel-box-cyber bg-[#0C1230]/90 p-5 backdrop-blur flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#A9B8FF] mb-1">
                <PixelCoinIcon size={16} />
                <span>TARIF CETAK 4R</span>
              </div>
              <div className="font-pixel-title text-2xl sm:text-3xl text-[#5CE1E6]">
                Rp15.000
              </div>
              <span className="text-[10px] text-white/50 mt-1 block">Kertas Glossy 4R per lembar</span>
            </div>
            <div className="w-12 h-12 pixel-box bg-[#6700A3] flex items-center justify-center text-[#FFD84D]">
              <PixelPrinterIcon size={28} />
            </div>
          </div>
        </div>

        {/* Modal / Dialog Cetak Cepat 4R Epson L300 */}
        {printingItem && (
          <div className="mb-6 pixel-box-cyber bg-[#131947] p-5 text-center animate-fadeIn">
            <div className="flex items-center justify-center gap-2 text-[#00E599] font-pixel-title text-xs mb-2">
              <PixelPrinterIcon size={20} />
              <span>SPOOLING KE EPSON L300 4R...</span>
            </div>
            <p className="text-xs text-white/80">
              Mencetak <span className="text-[#FFD84D] font-bold">{printCopies}x lembar</span> untuk pengunjung{' '}
              <span className="text-[#5CE1E6] font-bold">{printingItem.nickname}</span> ({printingItem.number})
            </p>
            <div className="w-48 h-2 bg-black mx-auto mt-3 overflow-hidden border border-[#4B57B2]">
              <div className="h-full bg-[#00E599] animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* Toast Notifikasi */}
        {toastMessage && (
          <div className="mb-6 p-3 pixel-box bg-[#0C1230] border-2 border-[#5CE1E6] text-[#5CE1E6] text-xs font-pixel-title flex items-center justify-between shadow-[0_0_12px_rgba(92,225,230,0.4)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD84D]" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabel Antrean Gaya Arcade High-Score Board */}
        <div className="pixel-box bg-[#0C1230]/95 backdrop-blur overflow-hidden mb-8">
          <div className="px-6 py-4 bg-[#131947] border-b-4 border-[#4B57B2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PixelTicketIcon size={18} />
              <h2 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D] tracking-wider">
                LEADERBOARD ANTREAN PENGUNJUNG
              </h2>
            </div>
            <span className="font-pixel-title text-[10px] text-[#A9B8FF] bg-[#050C38] px-2.5 py-1 border border-[#4B57B2]">
              TOTAL: {queue.length} TIKET
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#4B57B2] bg-[#050C38]/70 text-[10px] font-pixel-title text-[#A9B8FF]">
                  <th className="py-3 px-6">NOMOR</th>
                  <th className="py-3 px-6">PENGUNJUNG</th>
                  <th className="py-3 px-6">WAKTU</th>
                  <th className="py-3 px-6">STATUS</th>
                  <th className="py-3 px-6 text-right">TINDAKAN OPERATOR</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#161F54] text-xs">
                {queue.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.status === QueueStatus.IN_SESSION
                        ? 'bg-[#1C184A]/60'
                        : 'hover:bg-[#131947]/40'
                    }`}
                  >
                    {/* Nomor Tiket */}
                    <td className="py-4 px-6 font-pixel-title text-sm text-[#FFD84D]">
                      {item.number}
                    </td>

                    {/* Nama Pengunjung */}
                    <td className="py-4 px-6 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{item.nickname}</span>
                        {item.status === QueueStatus.IN_SESSION && (
                          <span className="text-[10px] text-[#FE0168] font-pixel-title animate-pulse">
                            &lt;&lt; LIVE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Waktu Daftar */}
                    <td className="py-4 px-6 text-white/60 text-xs">
                      {item.registeredAt} WIB
                    </td>

                    {/* Status Badge Pixel */}
                    <td className="py-4 px-6">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Tindakan Operator */}
                    <td className="py-4 px-6 text-right space-x-2">
                      {item.status === QueueStatus.QUEUED && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(
                                item.id,
                                QueueStatus.IN_SESSION,
                                `Sesi dimulai untuk ${item.nickname} (${item.number})`
                              )
                            }
                            className="pixel-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#049A5C] hover:bg-[#00E599] text-white text-[11px] font-bold"
                          >
                            <Play className="w-3 h-3" />
                            <span>MULAI SESI</span>
                          </button>
                          <button
                            onClick={() =>
                              updateStatus(
                                item.id,
                                QueueStatus.WAITING,
                                `${item.nickname} dilewati sementara`
                              )
                            }
                            className="pixel-box inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#131947] hover:bg-[#160078] text-[10px] text-[#A9B8FF]"
                          >
                            LEWATI
                          </button>
                        </>
                      )}

                      {item.status === QueueStatus.IN_SESSION && (
                        <button
                          onClick={() =>
                            updateStatus(
                              item.id,
                              QueueStatus.DONE,
                              `Sesi ${item.nickname} selesai dan hasil tersimpan!`
                            )
                          }
                          className="pixel-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#049A5C] hover:bg-[#00E599] text-white text-[11px] font-bold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>SELESAIKAN SESI</span>
                        </button>
                      )}

                      {item.status === QueueStatus.WAITING && (
                        <button
                          onClick={() =>
                            updateStatus(
                              item.id,
                              QueueStatus.QUEUED,
                              `${item.nickname} dipanggil kembali ke antrean`
                            )
                          }
                          className="pixel-box inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#6700A3] hover:bg-[#7226FF] text-[10px] text-white"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>PANGGIL LAGI</span>
                        </button>
                      )}

                      {item.status === QueueStatus.DONE && (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handlePrint(item)}
                            className="pixel-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E02F75] hover:bg-[#FE0168] text-white text-[10px] font-bold"
                            title="Kirim ke printer Epson L300"
                          >
                            <PixelPrinterIcon size={14} />
                            <span>CETAK 4R</span>
                          </button>
                          <Link
                            href="/gallery"
                            onClick={() => soundEnabled && retroAudio.playButtonClick()}
                            className="pixel-box inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#131947] hover:bg-[#160078] text-[10px] text-[#5CE1E6]"
                          >
                            <Eye className="w-3 h-3" />
                            <span>GALERI</span>
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Informasi Perangkat & Spooler Cetak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="pixel-box bg-[#0C1230]/90 p-5">
            <div className="flex items-center gap-2 text-xs font-pixel-title text-[#FFD84D] mb-3">
              <PixelCameraIcon size={18} />
              <span>PENGATURAN KAMERA FLEKSIBEL</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed mb-3">
              Perangkat aktif: <span className="text-[#00E599] font-bold">Canon EOS 1200D DSLR (USB)</span>.
              Jika berganti ke kamera web atau kamera mirrorless lain, sistem otomatis mendeteksi tanpa merestart server.
            </p>
            <div className="flex items-center gap-3 text-[10px] font-pixel-title text-[#A9B8FF]">
              <span className="bg-[#050C38] px-2 py-1 border border-[#4B57B2]">Shutter: 1/125s</span>
              <span className="bg-[#050C38] px-2 py-1 border border-[#4B57B2]">Aperture: f/2.8</span>
              <span className="bg-[#050C38] px-2 py-1 border border-[#4B57B2]">ISO: 400</span>
            </div>
          </div>

          <div className="pixel-box bg-[#0C1230]/90 p-5">
            <div className="flex items-center gap-2 text-xs font-pixel-title text-[#5CE1E6] mb-3">
              <PixelPrinterIcon size={18} />
              <span>SPOOLER PRINTER UNIVERSAL</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed mb-3">
              Spooler aktif: <span className="text-[#00E599] font-bold">Epson L300 Series (Kertas Foto 4R)</span>.
              Sistem mendukung format 1200x1800 piksel dengan cetak langsung via Windows Print Spooler.
            </p>
            <div className="flex items-center gap-3 text-[10px] font-pixel-title text-[#A9B8FF]">
              <span className="bg-[#050C38] px-2 py-1 border border-[#4B57B2]">Ukuran: 4R (10x15cm)</span>
              <span className="bg-[#050C38] px-2 py-1 border border-[#4B57B2]">DPI: 300 High</span>
              <span className="bg-[#050C38] px-2 py-1 border border-[#4B57B2]">Auto Cut: Ready</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Operator Dashboard */}
      <footer className="relative z-10 px-6 py-4 border-t-4 border-[#4B57B2] bg-[#0C1230]/90 flex flex-wrap items-center justify-between text-[11px] text-[#A9B8FF]">
        <span>EXPO WISUDA JURUSAN TIK 2026 &bull; SISTEM PHOTOBOOTH</span>
        <span className="text-[#FFD84D]">POLITEKNIK NEGERI LHOKSEUMAWE</span>
      </footer>
    </div>
  );
}
