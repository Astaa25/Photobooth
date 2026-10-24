'use client';

import { useState, useEffect } from 'react';
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
  Radio,
  Plus,
  Palette,
  Layers,
  Trash2,
  RefreshCw,
  Printer,
  Clock,
  User,
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
  status: QueueStatusType | 'PRINT_ORDER';
  registeredAt: string;
  printCopies?: number;
}

interface CustomTemplate {
  slug: string;
  name: string;
  desc: string;
  photoCount: number;
  previewType: 'strip' | 'grid' | 'trio' | 'duo' | 'single';
  isCustom?: boolean;
}

const DEFAULT_TEMPLATES: CustomTemplate[] = [
  { slug: 'night-city-strip', name: 'NIGHT CITY STRIP', desc: 'Dua strip 4 foto (gaya photobooth)', photoCount: 4, previewType: 'strip' },
  { slug: 'night-city-grid', name: 'NIGHT CITY GRID', desc: '4 foto dalam kisi 2x2', photoCount: 4, previewType: 'grid' },
  { slug: 'moonlight-trio', name: 'MOONLIGHT TRIO', desc: '3 foto strip dengan bulan sabit', photoCount: 3, previewType: 'trio' },
  { slug: 'duo-skyline', name: 'DUO SKYLINE', desc: '2 foto bertingkat untuk berdua', photoCount: 2, previewType: 'duo' },
  { slug: 'poster-tunggal', name: 'POSTER TUNGGAL', desc: '1 foto besar bergaya poster expo', photoCount: 1, previewType: 'single' },
];

const INITIAL_QUEUE: QueueItem[] = [
  { id: '1', number: '#001', nickname: 'Diana', status: QueueStatus.IN_SESSION, registeredAt: '10:14', printCopies: 2 },
  { id: '2', number: '#002', nickname: 'Budi & Sari', status: QueueStatus.QUEUED, registeredAt: '10:18', printCopies: 1 },
  { id: '3', number: '#003', nickname: 'Kelompok 4 Wisuda', status: QueueStatus.QUEUED, registeredAt: '10:22', printCopies: 3 },
  { id: '4', number: '#004', nickname: 'Aris', status: QueueStatus.WAITING, registeredAt: '10:05', printCopies: 1 },
  { id: '5', number: '#005', nickname: 'Rani', status: QueueStatus.DONE, registeredAt: '09:55', printCopies: 2 },
  { id: '6', number: '#006', nickname: 'Keluarga Dosen TIK', status: 'PRINT_ORDER', registeredAt: '10:30', printCopies: 2 },
];

export default function AdminDashboardPage() {
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printingItem, setPrintingItem] = useState<QueueItem | null>(null);
  const [printCopies, setPrintCopies] = useState<number>(2);

  // Status Auto-Refresh & Heartbeat Denyut Radar
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Baru saja');
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Modal Kelola & Tambah Design Frame
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [templates, setTemplates] = useState<CustomTemplate[]>(DEFAULT_TEMPLATES);
  const [newFrameName, setNewFrameName] = useState('');
  const [newFrameCount, setNewFrameCount] = useState<number>(4);
  const [newFrameLayout, setNewFrameLayout] = useState<'strip' | 'grid' | 'trio' | 'duo' | 'single'>('strip');
  const [newFrameDesc, setNewFrameDesc] = useState('');

  // 1. Muat Template Kustom saat Pertama Kali
  useEffect(() => {
    try {
      const saved = localStorage.getItem('photobooth_custom_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates([...DEFAULT_TEMPLATES, ...parsed]);
        }
      }
    } catch {}
  }, []);

  // 2. Dengarkan sinyal dari bilik booth tablet & pendaftaran baru
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('photobooth_session_sync');
      channel.onmessage = (event) => {
        // A. Pengunjung di booth tekan selesai -> Otomatis masuk ke kolom SELESAI
        if (event.data?.type === 'SESSION_COMPLETED') {
          const tNum = event.data.ticketNumber;
          setQueue((prev) =>
            prev.map((item) =>
              item.number === tNum || item.status === QueueStatus.IN_SESSION
                ? { ...item, status: QueueStatus.DONE }
                : item
            )
          );
          if (soundEnabled) retroAudio.playCoinSound();
          showToast(`Sesi foto untuk ${event.data.visitorName || tNum} SELESAI & masuk kolom Selesai!`);
        }

        // B. Ada pengunjung baru mendaftar dari web /register
        if (event.data?.type === 'NEW_REGISTRATION' && event.data.item) {
          const newItem = event.data.item;
          setQueue((prev) => {
            if (prev.some((q) => q.number === newItem.number)) return prev;
            return [newItem, ...prev];
          });
          if (soundEnabled) retroAudio.playSuccessChime();
          showToast(`Pengunjung baru terdaftar: ${newItem.nickname} (${newItem.number})`);
        }
      };
    } catch {}

    return () => {
      if (channel) channel.close();
    };
  }, [soundEnabled]);

  // 3. Heartbeat Auto-Refresh Berkelanjutan (Selalu Loading & Sinkron Setiap 2.5 Detik)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick((t) => t + 1);
      setLastRefreshedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Periksa tiket baru dari localStorage
      try {
        const raw = localStorage.getItem('photobooth_registered_tickets');
        if (raw) {
          const newTickets: QueueItem[] = JSON.parse(raw);
          if (Array.isArray(newTickets) && newTickets.length > 0) {
            setQueue((prev) => {
              const existingIds = new Set(prev.map((q) => q.number));
              const additions = newTickets.filter((t) => !existingIds.has(t.number));
              if (additions.length > 0) {
                if (soundEnabled) retroAudio.playSuccessChime();
                showToast(`${additions.length} antrean baru terdeteksi otomatis!`);
                return [...additions, ...prev];
              }
              return prev;
            });
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateStatus = (id: string, newStatus: QueueStatusType | 'PRINT_ORDER', label: string) => {
    if (soundEnabled) {
      if (newStatus === QueueStatus.DONE) {
        retroAudio.playCoinSound();
      } else {
        retroAudio.playButtonClick();
      }
    }

    const targetItem = queue.find((q) => q.id === id);

    // Sinkronkan ke bilik booth tablet secara real-time
    try {
      const channel = new BroadcastChannel('photobooth_session_sync');
      if (newStatus === QueueStatus.IN_SESSION && targetItem) {
        channel.postMessage({
          type: 'START_SESSION',
          visitorName: targetItem.nickname,
          ticketNumber: targetItem.number,
        });
        localStorage.setItem(
          'photobooth_active_session',
          JSON.stringify({
            visitorName: targetItem.nickname,
            ticketNumber: targetItem.number,
            timestamp: Date.now(),
          })
        );
      } else if (newStatus === QueueStatus.DONE || newStatus === QueueStatus.WAITING) {
        channel.postMessage({ type: 'RESET_TO_STANDBY' });
        localStorage.removeItem('photobooth_active_session');
      }
      channel.close();
    } catch {}

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
      // Pindahkan ke kolom SELESAI jika sebelumnya di cetak
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: QueueStatus.DONE } : q))
      );
    }, 2800);
  };

  // Tambah Desain Frame Baru
  const handleAddCustomFrame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFrameName.trim()) return;

    const slug = `frame-${Date.now()}`;
    const newTemplate: CustomTemplate = {
      slug,
      name: newFrameName.trim().toUpperCase(),
      desc: newFrameDesc.trim() || `${newFrameCount} foto bergaya kustom 4R`,
      photoCount: Number(newFrameCount),
      previewType: newFrameLayout,
      isCustom: true,
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);

    // Simpan template kustom ke localStorage
    try {
      const customOnly = updated.filter((t) => t.isCustom);
      localStorage.setItem('photobooth_custom_templates', JSON.stringify(customOnly));

      // Beritahu booth tablet secara instan
      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({ type: 'TEMPLATES_UPDATED' });
      channel.close();
    } catch {}

    if (soundEnabled) retroAudio.playSuccessChime();
    showToast(`Desain frame "${newTemplate.name}" berhasil ditambahkan & aktif di booth!`);

    // Reset input form
    setNewFrameName('');
    setNewFrameDesc('');
    setIsFrameModalOpen(false);
  };

  // Hapus Frame Kustom
  const handleDeleteCustomFrame = (slug: string) => {
    const updated = templates.filter((t) => t.slug !== slug);
    setTemplates(updated);
    try {
      const customOnly = updated.filter((t) => t.isCustom);
      localStorage.setItem('photobooth_custom_templates', JSON.stringify(customOnly));

      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({ type: 'TEMPLATES_UPDATED' });
      channel.close();
    } catch {}
    showToast('Desain frame kustom dihapus.');
  };

  // Filter Antrean untuk 5 Kolom
  const queuedItems = queue.filter((q) => q.status === QueueStatus.QUEUED);
  const waitingItems = queue.filter((q) => q.status === QueueStatus.WAITING);
  const inSessionItems = queue.filter((q) => q.status === QueueStatus.IN_SESSION);
  const printOrderItems = queue.filter((q) => q.status === 'PRINT_ORDER');
  const doneItems = queue.filter((q) => q.status === QueueStatus.DONE);

  return (
    <div className="min-h-screen bg-[#050C38] text-white font-pixel relative select-none overflow-x-hidden">
      {/* Background Layer: Langit Malam Gradien & Bintang Berkelip */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-40 animate-twinkle pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-25 pointer-events-none" />

      {/* Top Header Bar Arcade */}
      <header className="relative z-20 bg-[#0C1230]/90 border-b-4 border-[#4B57B2] px-4 sm:px-6 py-4 backdrop-blur flex flex-wrap items-center justify-between gap-4 sticky top-0">
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
              EXPO WISUDA TIK 2026 &bull; Antrean 5 Kolom, Sesi Tablet &amp; Cetak 4R
            </p>
          </div>
        </div>

        {/* Telemetri Hardware, Radar Auto-Refresh, & Tombol Navigasi */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Radar Auto-Refresh Ticking ("SELALU LOADING / REFRESH") */}
          <div className="flex items-center gap-2 bg-[#050C38] px-3 py-1.5 border-2 border-[#00E599] text-[10px] font-pixel-title text-[#00E599] shadow-[0_0_10px_rgba(0,229,153,0.3)]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            <span>AUTO-REFRESH: AKTIF</span>
            <span className="w-2 h-2 bg-[#00E599] rounded-none animate-ping" />
          </div>

          {/* Tombol Buka Modal Tambah Design Frame */}
          <button
            onClick={() => {
              if (soundEnabled) retroAudio.playButtonClick();
              setIsFrameModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 pixel-btn bg-[#6700A3] hover:bg-[#7226FF] text-white text-[11px] font-bold"
            title="Kelola & Tambah Desain Frame 4R"
          >
            <Palette className="w-3.5 h-3.5 text-[#FFD84D]" />
            <span>KELOLA FRAME ({templates.length})</span>
          </button>

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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-[11px] font-bold shadow-violet-glow"
            title="Buka Layar Kios Booth untuk Tablet"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>LAYAR BOOTH</span>
          </a>

          {/* Tombol Logout */}
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

      {/* Main Content: KANBAN BOARD 5 KOLOM KATEGORI */}
      <main className="relative z-10 w-full max-w-[1500px] mx-auto px-3 sm:px-6 py-6">
        {/* Banner Status Sinkronisasi Real-Time */}
        <div className="mb-6 p-2.5 bg-[#0C1230]/80 pixel-box flex flex-wrap items-center justify-between text-[11px] font-pixel-title text-[#A9B8FF] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#00E599] animate-pulse" />
            <span>SINKRONISASI AKTIF: FASTIFY WS &bull; BROADCAST CHANNEL &bull; STORAGE</span>
          </div>
          <div className="text-white/60 text-[10px]">
            Pembaruan terakhir: <span className="text-[#FFD84D]">{lastRefreshedAt}</span> &bull; Total antrean: {queue.length}
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
          <div className="mb-6 p-3 pixel-box bg-[#0C1230] border-2 border-[#5CE1E6] text-[#5CE1E6] text-xs font-pixel-title flex items-center justify-between shadow-[0_0_12px_rgba(92,225,230,0.4)] animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD84D]" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================================================================
            PAPAN KANBAN 5 KOLOM (ANTREAN, PENDING, SEDANG FOTO, CETAK 4R, SELESAI)
            =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 mb-10 items-start">
          {/* KOLOM 1: ANTREAN (QUEUED) */}
          <div className="bg-[#0C1230]/90 pixel-box p-3.5 flex flex-col h-full min-h-[500px]">
            <div className="pb-2.5 mb-3 border-b-2 border-[#4B57B2] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#5CE1E6]" />
                <h2 className="font-pixel-title text-xs text-[#5CE1E6] tracking-wider">
                  ANTREAN
                </h2>
              </div>
              <span className="bg-[#131947] px-2 py-0.5 text-[10px] font-pixel-title text-[#5CE1E6] border border-[#5CE1E6]/40">
                {queuedItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {queuedItems.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-[11px] font-pixel-title border-2 border-dashed border-white/10 mt-6">
                  Tidak ada antrean baru
                </div>
              ) : (
                queuedItems.map((item) => (
                  <div key={item.id} className="bg-[#131947]/80 pixel-box p-3 hover:bg-[#161F54] transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-pixel-title text-sm text-[#FFD84D]">{item.number}</span>
                      <span className="text-[10px] text-white/50">{item.registeredAt}</span>
                    </div>
                    <p className="font-medium text-white text-xs mb-3 truncate">{item.nickname}</p>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateStatus(item.id, QueueStatus.IN_SESSION, `Sesi foto dimulai untuk ${item.nickname} (${item.number})`)}
                        className="flex-1 py-1.5 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>MULAI</span>
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, QueueStatus.WAITING, `${item.nickname} dipindahkan ke Pending`)}
                        className="py-1.5 px-2.5 pixel-box bg-[#0C1230] hover:bg-[#A86400]/40 text-[#FFD84D] text-[10px]"
                        title="Lewati / Jadikan Pending"
                      >
                        LEWATI
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KOLOM 2: PENDING / MENUNGGU (WAITING) */}
          <div className="bg-[#0C1230]/90 pixel-box p-3.5 flex flex-col h-full min-h-[500px]">
            <div className="pb-2.5 mb-3 border-b-2 border-[#A86400] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#FFD84D]" />
                <h2 className="font-pixel-title text-xs text-[#FFD84D] tracking-wider">
                  PENDING
                </h2>
              </div>
              <span className="bg-[#131947] px-2 py-0.5 text-[10px] font-pixel-title text-[#FFD84D] border border-[#A86400]">
                {waitingItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {waitingItems.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-[11px] font-pixel-title border-2 border-dashed border-white/10 mt-6">
                  Tidak ada antrean pending
                </div>
              ) : (
                waitingItems.map((item) => (
                  <div key={item.id} className="bg-[#131947]/80 pixel-box border-l-4 border-l-[#FFD84D] p-3 hover:bg-[#161F54] transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-pixel-title text-sm text-[#FFD84D]">{item.number}</span>
                      <span className="text-[10px] text-white/50">{item.registeredAt}</span>
                    </div>
                    <p className="font-medium text-white text-xs mb-3 truncate">{item.nickname}</p>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateStatus(item.id, QueueStatus.IN_SESSION, `Sesi foto dimulai untuk ${item.nickname} (${item.number})`)}
                        className="flex-1 py-1.5 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>MULAI</span>
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, QueueStatus.QUEUED, `${item.nickname} dipanggil kembali ke antrean`)}
                        className="py-1.5 px-2.5 pixel-box bg-[#0C1230] hover:bg-[#160078] text-[#5CE1E6] text-[10px]"
                        title="Kembalikan ke antrean utama"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KOLOM 3: SEDANG FOTO (IN_SESSION - LIVE AKTIF DI BILIK BOOTH) */}
          <div className="bg-[#0C1230]/95 pixel-box-cyber p-3.5 flex flex-col h-full min-h-[500px]">
            <div className="pb-2.5 mb-3 border-b-2 border-[#E02F75] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#FE0168] animate-ping" />
                <h2 className="font-pixel-title text-xs text-[#FE0168] tracking-wider">
                  SEDANG FOTO
                </h2>
              </div>
              <span className="bg-[#6700A3] px-2 py-0.5 text-[10px] font-pixel-title text-[#FFD84D] border border-[#E02F75]">
                {inSessionItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {inSessionItems.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-[11px] font-pixel-title border-2 border-dashed border-white/10 mt-6">
                  Bilik booth sedang standby
                </div>
              ) : (
                inSessionItems.map((item) => (
                  <div key={item.id} className="bg-[#1C184A] pixel-box border-2 border-[#E02F75] p-3 shadow-[0_0_12px_rgba(224,47,117,0.4)] animate-pulse">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-pixel-title text-base text-[#FFD84D]">{item.number}</span>
                      <span className="text-[9px] font-pixel-title bg-[#FE0168] px-1.5 py-0.5 text-white">
                        ● LIVE BOOTH
                      </span>
                    </div>

                    <p className="font-bold text-white text-sm mb-1 truncate">{item.nickname}</p>
                    <p className="text-[10px] text-[#A9B8FF] mb-3">
                      Canon 1200D aktif &bull; Otomatis pindah ke Selesai saat sesi tuntas
                    </p>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => updateStatus(item.id, QueueStatus.DONE, `Sesi ${item.nickname} selesai dan masuk ke Selesai!`)}
                        className="w-full py-2 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-bold flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>SELESAIKAN SESI</span>
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, 'PRINT_ORDER', `${item.nickname} dikirim ke antrean Cetak 4R`)}
                        className="w-full py-1.5 pixel-box bg-[#0C1230] hover:bg-[#160078] text-[#5CE1E6] text-[10px] flex items-center justify-center gap-1"
                      >
                        <PixelPrinterIcon size={14} />
                        <span>KIRIM KE CETAK 4R</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KOLOM 4: ANTREAN CETAK 4R (PRINT_ORDER) */}
          <div className="bg-[#0C1230]/90 pixel-box p-3.5 flex flex-col h-full min-h-[500px]">
            <div className="pb-2.5 mb-3 border-b-2 border-[#5CE1E6] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#00E599]" />
                <h2 className="font-pixel-title text-xs text-[#5CE1E6] tracking-wider">
                  CETAK 4R
                </h2>
              </div>
              <span className="bg-[#131947] px-2 py-0.5 text-[10px] font-pixel-title text-[#00E599] border border-[#00E599]/40">
                {printOrderItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {printOrderItems.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-[11px] font-pixel-title border-2 border-dashed border-white/10 mt-6">
                  Tidak ada antrean cetak
                </div>
              ) : (
                printOrderItems.map((item) => (
                  <div key={item.id} className="bg-[#131947]/80 pixel-box border-l-4 border-l-[#00E599] p-3 hover:bg-[#161F54] transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-pixel-title text-sm text-[#FFD84D]">{item.number}</span>
                      <span className="text-[10px] text-[#00E599] font-pixel-title">{item.printCopies || 1} LEMBAR</span>
                    </div>
                    <p className="font-medium text-white text-xs mb-3 truncate">{item.nickname}</p>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handlePrint(item)}
                        className="w-full py-1.5 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-[10px] font-bold flex items-center justify-center gap-1.5"
                      >
                        <PixelPrinterIcon size={14} />
                        <span>CETAK KE EPSON</span>
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, QueueStatus.DONE, `Cetak selesai untuk ${item.nickname}`)}
                        className="w-full py-1 px-2 pixel-box bg-[#0C1230] text-white/60 hover:text-white text-[10px]"
                      >
                        TANDAI SELESAI
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KOLOM 5: SELESAI (DONE) */}
          <div className="bg-[#0C1230]/90 pixel-box p-3.5 flex flex-col h-full min-h-[500px]">
            <div className="pb-2.5 mb-3 border-b-2 border-[#00E599] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#00E599]" />
                <h2 className="font-pixel-title text-xs text-[#00E599] tracking-wider">
                  SELESAI
                </h2>
              </div>
              <span className="bg-[#0D5235] px-2 py-0.5 text-[10px] font-pixel-title text-[#00E599] border border-[#00E599]/40">
                {doneItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {doneItems.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-[11px] font-pixel-title border-2 border-dashed border-white/10 mt-6">
                  Belum ada sesi selesai
                </div>
              ) : (
                doneItems.map((item) => (
                  <div key={item.id} className="bg-[#131947]/60 pixel-box p-3 hover:bg-[#161F54] transition-all opacity-95">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-pixel-title text-sm text-[#00E599]">{item.number}</span>
                      <span className="text-[10px] text-white/50">{item.registeredAt}</span>
                    </div>
                    <p className="font-medium text-white text-xs mb-3 truncate">{item.nickname}</p>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePrint(item)}
                        className="flex-1 py-1 pixel-btn bg-[#6700A3] hover:bg-[#7226FF] text-white text-[10px] font-bold flex items-center justify-center gap-1"
                        title="Cetak foto 4R ke printer"
                      >
                        <PixelPrinterIcon size={12} />
                        <span>CETAK 4R</span>
                      </button>
                      <Link
                        href="/gallery"
                        onClick={() => soundEnabled && retroAudio.playButtonClick()}
                        className="py-1 px-2.5 pixel-box bg-[#0C1230] hover:bg-[#160078] text-[#5CE1E6] text-[10px] flex items-center gap-1"
                        title="Buka galeri digital"
                      >
                        <Eye className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================
            MODAL KELOLA & TAMBAH DESIGN FRAME 4R
            =================================================================== */}
        {isFrameModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-3xl bg-[#0C1230] pixel-box border-4 border-[#6700A3] p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto">
              {/* Tombol Tutup [X] */}
              <button
                onClick={() => setIsFrameModalOpen(false)}
                className="absolute top-4 right-4 p-2 pixel-box bg-[#131947] hover:bg-[#FE0168] text-white"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Modal */}
              <div className="pr-12 mb-6 pb-3 border-b-2 border-[#4B57B2]">
                <div className="flex items-center gap-2 text-[#FFD84D] mb-1">
                  <Palette className="w-4 h-4 text-[#E02F75]" />
                  <h2 className="font-pixel-title text-base sm:text-lg">
                    KELOLA &amp; TAMBAH DESIGN FRAME 4R
                  </h2>
                </div>
                <p className="text-xs text-[#A9B8FF]">
                  Tambah bingkai baru atau sesuaikan layout foto untuk langsung tampil di bilik booth tablet.
                </p>
              </div>

              {/* FORM TAMBAH FRAME BARU */}
              <form onSubmit={handleAddCustomFrame} className="bg-[#131947]/90 pixel-box-cyber p-4 sm:p-5 mb-6">
                <h3 className="font-pixel-title text-xs text-[#FFD84D] mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#00E599]" />
                  <span>BUAT DESIGN FRAME BARU</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-pixel-title text-[#FFD84D] mb-1">
                      NAMA FRAME <span className="text-[#FE0168]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFrameName}
                      onChange={(e) => setNewFrameName(e.target.value)}
                      placeholder="Contoh: WISUDA CYBERPUNK 4R"
                      className="w-full h-10 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-pixel-title text-[#5CE1E6] mb-1">
                      JUMLAH FOTO (POSE)
                    </label>
                    <select
                      value={newFrameCount}
                      onChange={(e) => setNewFrameCount(Number(e.target.value))}
                      className="w-full h-10 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75]"
                    >
                      <option value={1}>1 Foto (Poster Penuh)</option>
                      <option value={2}>2 Foto (Duo Skyline)</option>
                      <option value={3}>3 Foto (Trio Strip)</option>
                      <option value={4}>4 Foto (Strip / Grid 2x2)</option>
                      <option value={6}>6 Foto (Mini Collage)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1">
                      TATA LETAK LAYOUT
                    </label>
                    <select
                      value={newFrameLayout}
                      onChange={(e) => setNewFrameLayout(e.target.value as any)}
                      className="w-full h-10 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75]"
                    >
                      <option value="strip">Strip 2-Kolom (Gaya Photobooth)</option>
                      <option value="grid">Grid 2x2 (Kotak Simetris)</option>
                      <option value="trio">Trio Strip Vertikal</option>
                      <option value="duo">Duo Bertingkat</option>
                      <option value="single">Poster Tunggal 4R</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1">
                      DESKRIPSI FRAME
                    </label>
                    <input
                      type="text"
                      value={newFrameDesc}
                      onChange={(e) => setNewFrameDesc(e.target.value)}
                      placeholder="Contoh: Tema malam wisuda informatika"
                      className="w-full h-10 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-white/50">
                    Resolusi standar: 1200 x 1800 px (300 DPI Epson 4R)
                  </span>
                  <button
                    type="submit"
                    className="h-10 px-5 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-[11px] flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>SIMPAN &amp; AKTIFKAN DI BOOTH</span>
                  </button>
                </div>
              </form>

              {/* DAFTAR FRAME YANG SEDANG AKTIF */}
              <h3 className="font-pixel-title text-xs text-[#5CE1E6] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#5CE1E6]" />
                <span>DAFTAR DESAIN FRAME AKTIF ({templates.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.slug}
                    className="p-3 bg-[#131947]/70 border-2 border-[#4B57B2] flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-pixel-title text-xs text-[#FFD84D]">{tpl.name}</span>
                        {tpl.isCustom && (
                          <span className="text-[8px] font-pixel-title bg-[#E02F75] px-1 py-0.5 text-white">
                            KUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70 leading-snug">{tpl.desc}</p>
                      <span className="text-[9px] text-[#00E599] font-pixel-title mt-1.5 inline-block">
                        {tpl.photoCount}X FOTO &bull; LAYOUT: {tpl.previewType.toUpperCase()}
                      </span>
                    </div>

                    {tpl.isCustom && (
                      <button
                        onClick={() => handleDeleteCustomFrame(tpl.slug)}
                        className="p-1.5 pixel-box bg-[#0C1230] hover:bg-[#FE0168] text-white/60 hover:text-white"
                        title="Hapus Frame Kustom"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Operator Dashboard */}
      <footer className="relative z-10 px-6 py-4 border-t-4 border-[#4B57B2] bg-[#0C1230]/90 flex flex-wrap items-center justify-between text-[11px] text-[#A9B8FF]">
        <span>EXPO WISUDA JURUSAN TIK 2026 &bull; SISTEM PHOTOBOOTH OPERATOR DECK</span>
        <span className="text-[#FFD84D]">POLITEKNIK NEGERI LHOKSEUMAWE</span>
      </footer>
    </div>
  );
}
