'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  Palette,
  Layers,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Save,
  Upload,
  Play,
  Check,
  RotateCcw,
  Eye,
  LogOut,
  Camera,
  Laptop,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  X,
  Search,
  Sliders,
  CheckCircle,
  HelpCircle,
  FolderOpen,
  Scan,
  Maximize2,
  Crosshair,
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
import {
  scanFrameTransparency,
  getFallbackPreset,
  type DetectedSlot,
  type FrameScanResult,
} from '@/utils/frameScanner';
import {
  getSharedWebcamStream,
  bindStreamToVideo,
  stopWebcamStream,
  getHumanWebcamError,
  enumerateVideoDevices,
  type WebcamDeviceInfo,
} from '@/utils/webcamHelper';
import { PixelTemplateEditorModal } from '@/components/pixel/PixelTemplateEditorModal';
import type { FrameTemplateItem } from '@/app/api/frames/route';
import {
  getTotalPrintedSheets,
  incrementPrintedSheets,
  resetPrintedSheets,
} from '@/utils/printCounter';
import {
  getAndAdvanceTicketNumber,
  getCurrentTicketNumber,
} from '@/utils/ticketSequence';

// Tipe Data Kategori Kolom yang Dapat Dikonfigurasi
export interface KanbanCategory {
  id: string;
  key: string;
  title: string;
  color: string;
  badgeBg: string;
  active: boolean;
}

// Tipe Data Desain Frame (Kompatibel dengan Schema 1200x1800 4R)
export type CustomTemplate = FrameTemplateItem;

interface QueueItem {
  id: string;
  number: string;
  nickname: string;
  status: string;
  registeredAt: string;
  printCopies?: number;
}

// 5 Kategori Default
const DEFAULT_CATEGORIES: KanbanCategory[] = [
  { id: 'cat-1', key: 'QUEUED', title: 'ANTREAN', color: '#5CE1E6', badgeBg: '#0C1230', active: true },
  { id: 'cat-2', key: 'WAITING', title: 'PENDING', color: '#FFD84D', badgeBg: '#131947', active: true },
  { id: 'cat-3', key: 'IN_SESSION', title: 'SEDANG FOTO', color: '#FE0168', badgeBg: '#6700A3', active: true },
  { id: 'cat-4', key: 'PRINT_ORDER', title: 'CETAK 4R', color: '#00E599', badgeBg: '#0D5235', active: true },
  { id: 'cat-5', key: 'DONE', title: 'SELESAI', color: '#A9B8FF', badgeBg: '#160078', active: true },
];

// 5 Desain Frame Awal
const DEFAULT_TEMPLATES: CustomTemplate[] = [
  {
    slug: 'night-city-strip',
    name: 'NIGHT CITY STRIP 4R',
    desc: 'Dua strip 4 foto photobooth klasik',
    photoCount: 4,
    previewType: 'strip',
    frameImage: '/assets/frames/night-city-strip.png',
  },
  {
    slug: 'night-city-grid',
    name: 'NIGHT CITY GRID 4R',
    desc: '4 foto dalam kisi simetris 2x2',
    photoCount: 4,
    previewType: 'grid',
    frameImage: '/assets/frames/night-city-grid.png',
  },
  {
    slug: 'moonlight-trio',
    name: 'MOONLIGHT TRIO 4R',
    desc: '3 foto strip dengan ornamen bulan',
    photoCount: 3,
    previewType: 'trio',
    frameImage: '/assets/frames/moonlight-trio.png',
  },
  {
    slug: 'duo-skyline',
    name: 'DUO SKYLINE 4R',
    desc: '2 foto bertingkat untuk berdua',
    photoCount: 2,
    previewType: 'duo',
    frameImage: '/assets/frames/duo-skyline.png',
  },
  {
    slug: 'poster-tunggal',
    name: 'POSTER TUNGGAL 4R',
    desc: '1 foto besar bergaya poster expo',
    photoCount: 1,
    previewType: 'single',
    frameImage: '/assets/frames/poster-tunggal.png',
  },
];

const INITIAL_QUEUE: QueueItem[] = [
  { id: '1', number: '#001', nickname: 'Diana', status: 'IN_SESSION', registeredAt: '10:14', printCopies: 2 },
  { id: '2', number: '#002', nickname: 'Budi & Sari', status: 'QUEUED', registeredAt: '10:18', printCopies: 1 },
  { id: '3', number: '#003', nickname: 'Kelompok 4 Wisuda', status: 'QUEUED', registeredAt: '10:22', printCopies: 3 },
  { id: '4', number: '#004', nickname: 'Aris', status: 'WAITING', registeredAt: '10:05', printCopies: 1 },
  { id: '5', number: '#005', nickname: 'Rani', status: 'DONE', registeredAt: '09:55', printCopies: 2 },
  { id: '6', number: '#006', nickname: 'Keluarga Dosen TIK', status: 'PRINT_ORDER', registeredAt: '10:30', printCopies: 2 },
];

export default function AdminDashboardPage() {
  // Tab Aktif Sidebar
  const [activeTab, setActiveTab] = useState<'board' | 'categories' | 'frames' | 'hardware'>('board');

  // State Antrean & Kategori
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [categories, setCategories] = useState<KanbanCategory[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // State Desain Frame & Pemindai Slot Lubang Landscape
  const [templates, setTemplates] = useState<CustomTemplate[]>(DEFAULT_TEMPLATES);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FrameTemplateItem | null>(null);
  const [showLegacyScanner, setShowLegacyScanner] = useState(false);
  const [frameName, setFrameName] = useState('');
  const [frameCount, setFrameCount] = useState<number>(4);
  const [frameLayout, setFrameLayout] = useState<'strip' | 'grid' | 'trio' | 'duo' | 'single'>('strip');
  const [frameDesc, setFrameDesc] = useState('');
  const [uploadedFramePreview, setUploadedFramePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fitur Deteksi Lubang Foto (Landscape 4:3, 16:9, 3:2)
  const [photoRatio, setPhotoRatio] = useState<'4:3' | '16:9' | '3:2'>('4:3');
  const [detectedSlots, setDetectedSlots] = useState<DetectedSlot[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [showCrosshairs, setShowCrosshairs] = useState(true);
  const [showDemoPhotos, setShowDemoPhotos] = useState(true);

  // State Spooler Cetak
  const [printingItem, setPrintingItem] = useState<QueueItem | null>(null);
  const [printCopies, setPrintCopies] = useState<number>(2);
  const [totalPrintedSheets, setTotalPrintedSheets] = useState<number>(0);
  const [newVisitorNickname, setNewVisitorNickname] = useState('');
  const [isAddingVisitor, setIsAddingVisitor] = useState(false);

  // Auto-Refresh & Heartbeat Sync
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Baru saja');
  const [refreshPulse, setRefreshPulse] = useState(0);

  // Edit Kategori Form State
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatColor, setNewCatColor] = useState('#5CE1E6');

  // State Sumber Kamera (DSLR Canon EOS 1200D vs Kamera Laptop HD Webcam)
  const [activeCamera, setActiveCamera] = useState<'canon' | 'webcam'>('canon');
  const [webcamTestActive, setWebcamTestActive] = useState(false);
  const [adminWebcamError, setAdminWebcamError] = useState<string | null>(null);
  const [isAdminWebcamConnecting, setIsAdminWebcamConnecting] = useState(false);
  const [webcamDevices, setWebcamDevices] = useState<WebcamDeviceInfo[]>([]);
  const adminWebcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const adminWebcamStreamRef = useRef<MediaStream | null>(null);

  // 1. Muat Kategori & Template Kustom dari Server & LocalStorage
  useEffect(() => {
    try {
      setTotalPrintedSheets(getTotalPrintedSheets());
      const savedCats = localStorage.getItem('photobooth_kanban_categories');
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
      }
      const savedCam = localStorage.getItem('photobooth_selected_camera');
      if (savedCam === 'canon' || savedCam === 'webcam') {
        setActiveCamera(savedCam);
      }
    } catch {}

    // Muat template dari API server /api/frames
    fetch('/api/frames')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setTemplates(res.data);
        }
      })
      .catch(() => {
        try {
          const savedTemplates = localStorage.getItem('photobooth_custom_templates');
          if (savedTemplates) {
            const parsed = JSON.parse(savedTemplates);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTemplates([...DEFAULT_TEMPLATES, ...parsed]);
            }
          }
        } catch {}
      });
  }, []);

  // 2. Dengarkan sinyal dari bilik booth tablet & pendaftaran baru
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('photobooth_session_sync');
      channel.onmessage = (event) => {
        // Pengunjung selesai berfoto di booth -> Otomatis pindah ke SELESAI
        if (event.data?.type === 'SESSION_COMPLETED') {
          const tNum = event.data.ticketNumber;
          setQueue((prev) =>
            prev.map((item) =>
              item.number === tNum || item.status === 'IN_SESSION'
                ? { ...item, status: 'DONE' }
                : item
            )
          );
          if (soundEnabled) retroAudio.playCoinSound();
          showToast(`Sesi foto ${event.data.visitorName || tNum} SELESAI & otomatis masuk kolom Selesai!`);
        }

        // Tiket baru masuk dari /register
        if (event.data?.type === 'NEW_REGISTRATION' && event.data.item) {
          const newItem = event.data.item;
          setQueue((prev) => {
            if (prev.some((q) => q.number === newItem.number)) return prev;
            return [newItem, ...prev];
          });
          if (soundEnabled) retroAudio.playSuccessChime();
          showToast(`Antrean baru masuk: ${newItem.nickname} (${newItem.number})`);
        }

        // Sinyal perubahan kamera aktif dari bilik booth
        if (
          event.data?.type === 'CAMERA_CHANGED' &&
          (event.data.cameraSource === 'canon' || event.data.cameraSource === 'webcam')
        ) {
          setActiveCamera(event.data.cameraSource);
        }

        // Sinkronisasi pembaruan jumlah lembar cetak
        if (event.data?.type === 'PRINT_COUNT_UPDATED' && typeof event.data.totalPrintedSheets === 'number') {
          setTotalPrintedSheets(event.data.totalPrintedSheets);
        }
      };
    } catch {}

    return () => {
      if (channel) channel.close();
    };
  }, [soundEnabled]);

  // Mulai uji live feed kamera laptop di tab Hardware admin
  const startAdminWebcamTest = async () => {
    setIsAdminWebcamConnecting(true);
    setAdminWebcamError(null);
    setWebcamTestActive(true);

    stopWebcamStream(adminWebcamStreamRef.current);
    adminWebcamStreamRef.current = null;

    try {
      const result = await getSharedWebcamStream();
      adminWebcamStreamRef.current = result.stream;
      await bindStreamToVideo(adminWebcamVideoRef.current, result.stream);

      const devList = await enumerateVideoDevices();
      setWebcamDevices(devList);
      showToast('Kamera laptop terhubung! Feed live video aktif.');
    } catch (err: any) {
      console.warn('Status koneksi webcam admin:', err?.name || err?.message || err);
      const humanErr = getHumanWebcamError(err);
      setAdminWebcamError(humanErr);
      showToast('Kamera laptop: ' + humanErr);
    } finally {
      setIsAdminWebcamConnecting(false);
    }
  };

  // Hentikan uji feed kamera laptop
  const stopAdminWebcamTest = () => {
    stopWebcamStream(adminWebcamStreamRef.current);
    adminWebcamStreamRef.current = null;
    setWebcamTestActive(false);
    setAdminWebcamError(null);
    setIsAdminWebcamConnecting(false);
  };

  // Bersihkan stream saat tab/komponen ditutup
  useEffect(() => {
    return () => {
      stopWebcamStream(adminWebcamStreamRef.current);
      adminWebcamStreamRef.current = null;
    };
  }, []);

  // Baca daftar perangkat video saat tab Hardware dibuka
  useEffect(() => {
    if (activeTab === 'hardware') {
      enumerateVideoDevices().then((devs) => {
        if (devs.length > 0) setWebcamDevices(devs);
      });
    }
  }, [activeTab]);

  // Handler Ganti Sumber Kamera Aktif
  const handleSelectCamera = (source: 'canon' | 'webcam') => {
    setActiveCamera(source);
    try {
      localStorage.setItem('photobooth_selected_camera', source);
      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({ type: 'CAMERA_CHANGED', cameraSource: source });
      channel.close();
    } catch {}
    if (soundEnabled) retroAudio.playButtonClick();
    showToast(
      `Kamera aktif bilik booth diubah ke: ${
        source === 'canon' ? 'Canon EOS 1200D DSLR (USB)' : 'Kamera Laptop (Integrated HD Webcam)'
      }`
    );
  };

  // Handler Modal Ubah / Tambah Template Persis Gambar 1
  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: FrameTemplateItem) => {
    setEditingTemplate(tpl);
    setIsTemplateModalOpen(true);
  };

  const handleTemplateSaved = (saved: FrameTemplateItem) => {
    fetch('/api/frames')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTemplates(res.data);
        }
      })
      .catch(() => {
        setTemplates((prev) => {
          const idx = prev.findIndex((t) => t.slug === saved.slug);
          if (idx >= 0) {
            return prev.map((t, i) => (i === idx ? saved : t));
          }
          return [...prev, saved];
        });
      });

    try {
      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({ type: 'TEMPLATES_UPDATED', template: saved });
      channel.close();
    } catch {}

    if (soundEnabled) retroAudio.playSuccessChime();
    showToast(`Template "${saved.name}" berhasil disimpan!`);
  };

  // 3. Heartbeat Auto-Refresh Berkelanjutan (Selalu Loading & Sinkron Setiap 2.5 Detik)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshPulse((p) => (p + 1) % 100);
      setLastRefreshedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

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
                showToast(`${additions.length} tiket baru disinkronkan otomatis!`);
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
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2000);
  };

  // Pindai Otomatis Lubang Transparan pada Frame PNG
  const runFrameScan = async (sourceImage?: string, ratio: '4:3' | '16:9' | '3:2' = photoRatio) => {
    const targetSource = sourceImage || uploadedFramePreview;
    if (!targetSource) {
      showToast('Pilih / unggah file gambar frame PNG terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    try {
      const result = await scanFrameTransparency(targetSource, ratio);
      setDetectedSlots(result.slots);
      setScanMessage(result.message);
      if (result.poseCount > 0) {
        setFrameCount(result.poseCount);
      }
      if (result.isDualStrip) {
        setFrameLayout('strip');
      }
      showToast(result.message);
    } catch {
      const fallback = getFallbackPreset(frameCount, ratio, frameLayout, false, 'Menggunakan tata letak preset.');
      setDetectedSlots(fallback.slots);
      setScanMessage(fallback.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-muat template strip bawaan saat tab frames pertama kali dibuka
  useEffect(() => {
    if (activeTab === 'frames' && !uploadedFramePreview && templates.length > 0) {
      const defaultTpl = templates[0];
      setFrameName(defaultTpl.name);
      setFrameDesc(defaultTpl.desc);
      setFrameLayout(defaultTpl.previewType);
      setFrameCount(defaultTpl.photoCount);
      if (defaultTpl.frameImage) {
        setUploadedFramePreview(defaultTpl.frameImage);
        runFrameScan(defaultTpl.frameImage, photoRatio);
      }
    }
  }, [activeTab]);

  // Ganti Rasio Landscape (4:3 / 16:9 / 3:2)
  const handleRatioChange = (newRatio: '4:3' | '16:9' | '3:2') => {
    setPhotoRatio(newRatio);
    if (uploadedFramePreview) {
      runFrameScan(uploadedFramePreview, newRatio);
    } else {
      const preset = getFallbackPreset(frameCount, newRatio, frameLayout, false);
      setDetectedSlots(preset.slots);
      setScanMessage(preset.message);
    }
  };

  // Ganti Jumlah Foto Manual
  const handleFrameCountSelect = (count: number) => {
    setFrameCount(count);
    if (!uploadedFramePreview) {
      const preset = getFallbackPreset(count, photoRatio, frameLayout, false);
      setDetectedSlots(preset.slots);
      setScanMessage(preset.message);
    }
  };

  // Update Status Tiket
  const updateStatus = (id: string, newStatus: string, label: string) => {
    if (soundEnabled) {
      if (newStatus === 'DONE') retroAudio.playCoinSound();
      else retroAudio.playButtonClick();
    }

    const targetItem = queue.find((q) => q.id === id);

    // Sinkronkan ke bilik booth tablet secara real-time
    try {
      const channel = new BroadcastChannel('photobooth_session_sync');
      if (newStatus === 'IN_SESSION' && targetItem) {
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
      } else if (newStatus === 'DONE' || newStatus === 'WAITING') {
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

  // Cetak ke Epson L300
  const handlePrint = (item: QueueItem) => {
    if (soundEnabled) retroAudio.playPrintSound();
    setPrintingItem(item);
    const copies = item.printCopies || printCopies || 1;
    const updated = incrementPrintedSheets(copies);
    setTotalPrintedSheets(updated);
    showToast(`Mengirim tugas cetak ${copies}x lembar 4R ke Epson L300...`);
    setTimeout(() => {
      setPrintingItem(null);
      showToast(`Cetak selesai untuk ${item.nickname}! (${copies} lembar 4R dicatat, total: ${updated})`);
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'DONE' } : q))
      );
    }, 2000);
  };

  // Tambah Antrean Manual dengan nomor tiket urut otomatis
  const handleAddManualQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitorNickname.trim()) return;
    const nextNum = getAndAdvanceTicketNumber();
    const newItem: QueueItem = {
      id: `manual-${Date.now()}`,
      number: nextNum,
      nickname: newVisitorNickname.trim(),
      status: 'QUEUED',
      registeredAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      printCopies: 1,
    };
    setQueue((prev) => [newItem, ...prev]);
    setNewVisitorNickname('');
    setIsAddingVisitor(false);
    if (soundEnabled) retroAudio.playSuccessChime();
    showToast(`Antrean ${nextNum} (${newItem.nickname}) berhasil ditambahkan!`);
  };

  // Reset counter lembar cetak
  const handleResetPrintCount = () => {
    if (confirm('Atur ulang total lembar tercetak menjadi 0? (Gunakan saat isi ulang kertas cetak atau reset harian)')) {
      resetPrintedSheets(0);
      setTotalPrintedSheets(0);
      showToast('Counter lembar cetak diatur ulang ke 0.');
    }
  };

  // Handler Upload File Gambar Frame (PNG)
  const handleFrameFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('image')) {
      showToast('Harap pilih file gambar PNG dengan lubang transparan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUploadedFramePreview(base64);
      showToast('File PNG dimuat, sedang mendeteksi area lubang foto landscape...');
      await runFrameScan(base64, photoRatio);
    };
    reader.readAsDataURL(file);
  };

  // Tambah Desain Frame Baru
  const handleSaveFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frameName.trim()) {
      showToast('Nama frame wajib diisi.');
      return;
    }

    const payload = {
      name: frameName.trim().toUpperCase(),
      desc: frameDesc.trim() || `${frameCount} foto 4R (${photoRatio} landscape)`,
      photoCount: frameCount,
      previewType: frameLayout,
      frameImageBase64: uploadedFramePreview || '/assets/frames/night-city-strip.png',
      slotRatio: photoRatio,
      slots: detectedSlots,
    };

    try {
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.all) {
        setTemplates(data.all);
        try {
          const customOnly = data.all.filter((t: any) => t.isCustom);
          localStorage.setItem('photobooth_custom_templates', JSON.stringify(customOnly));
        } catch {}

        const channel = new BroadcastChannel('photobooth_session_sync');
        channel.postMessage({ type: 'TEMPLATES_UPDATED' });
        channel.close();

        if (soundEnabled) retroAudio.playSuccessChime();
        showToast(`Frame "${payload.name}" berhasil disimpan dan aktif di bilik booth!`);

        // Reset input
        setFrameName('');
        setFrameDesc('');
        setUploadedFramePreview(null);
        return;
      }
    } catch {}

    // Fallback lokal jika fetch gagal
    const slug = `custom-${Date.now()}`;
    const newFrame: CustomTemplate = {
      slug,
      name: payload.name,
      desc: payload.desc,
      photoCount: payload.photoCount,
      previewType: payload.previewType,
      frameImage: uploadedFramePreview || '/assets/frames/night-city-strip.png',
      isCustom: true,
    };
    const updated = [...templates, newFrame];
    setTemplates(updated);

    try {
      const customOnly = updated.filter((t) => t.isCustom);
      localStorage.setItem('photobooth_custom_templates', JSON.stringify(customOnly));
      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({ type: 'TEMPLATES_UPDATED' });
      channel.close();
    } catch {}

    if (soundEnabled) retroAudio.playSuccessChime();
    showToast(`Frame "${newFrame.name}" berhasil disimpan!`);
    setFrameName('');
    setFrameDesc('');
    setUploadedFramePreview(null);
  };

  // Hapus Frame Kustom
  const handleDeleteFrame = async (slug: string) => {
    try {
      const res = await fetch(`/api/frames?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && data.all) {
        setTemplates(data.all);
        try {
          const customOnly = data.all.filter((t: any) => t.isCustom);
          localStorage.setItem('photobooth_custom_templates', JSON.stringify(customOnly));
        } catch {}

        const channel = new BroadcastChannel('photobooth_session_sync');
        channel.postMessage({ type: 'TEMPLATES_UPDATED' });
        channel.close();

        showToast('Desain frame kustom dihapus.');
        return;
      }
    } catch {}

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

  // Tambah Kategori Kolom Baru
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;

    const key = `CAT_${Date.now()}`;
    const newCat: KanbanCategory = {
      id: `cat-${Date.now()}`,
      key,
      title: newCatTitle.trim().toUpperCase(),
      color: newCatColor,
      badgeBg: '#131947',
      active: true,
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem('photobooth_kanban_categories', JSON.stringify(updated));
    setNewCatTitle('');
    showToast(`Kategori kolom "${newCat.title}" berhasil ditambahkan!`);
  };

  // Hapus Kategori Kolom
  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 3) {
      showToast('Minimal harus ada 3 kategori kolom di papan.');
      return;
    }
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    localStorage.setItem('photobooth_kanban_categories', JSON.stringify(updated));
    showToast('Kategori kolom dihapus.');
  };

  // Filter antrean berdasarkan pencarian
  const filteredQueue = queue.filter(
    (q) =>
      q.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-[#050C38] text-white font-pixel select-none">
      {/* Background Layer: Langit Malam & Bintang Pixel */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-40 animate-twinkle pointer-events-none" />

      {/* =====================================================================
          1. SIDEBAR KIRI (NAVIGASI UTAMA OPERATOR & ISOLASI ADMIN DARI BERANDA)
          ===================================================================== */}
      <aside className="w-64 sm:w-72 bg-[#0C1230]/95 border-r-4 border-[#4B57B2] flex flex-col justify-between z-30 backdrop-blur shrink-0">
        <div>
          {/* Header Sidebar Brand */}
          <div className="p-5 border-b-4 border-[#4B57B2]">
            <div className="flex items-center gap-2 text-[#FFD84D] mb-1">
              <PixelCrossStar size={12} />
              <span className="font-pixel-title text-xs tracking-wider">
                OPERATOR DECK
              </span>
              <PixelCrossStar size={12} />
            </div>
            <h1 className="font-pixel-title text-sm text-white">
              EXPO WISUDA TIK 2026
            </h1>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-[#00E599] font-pixel-title bg-[#050C38] px-2 py-1 border border-[#00E599]/30">
              <span className="w-2 h-2 bg-[#00E599] animate-pulse" />
              <span>TERMINAL KENDALI AKTIF</span>
            </div>
          </div>

          {/* Menu Navigasi Sidebar */}
          <nav className="p-3 space-y-1.5">
            <button
              onClick={() => {
                if (soundEnabled) retroAudio.playButtonClick();
                setActiveTab('board');
              }}
              className={`w-full text-left px-3.5 py-3 pixel-box text-xs font-pixel-title flex items-center gap-3 transition-all ${
                activeTab === 'board'
                  ? 'bg-[#160078] text-[#FFD84D] border-2 border-[#E02F75] shadow-[0_0_10px_rgba(224,47,117,0.4)]'
                  : 'bg-[#131947]/70 text-[#A9B8FF] hover:bg-[#131947] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#5CE1E6]" />
              <span>ANTREAN PENGUNJUNG ({queue.length})</span>
            </button>

            <button
              onClick={() => {
                if (soundEnabled) retroAudio.playButtonClick();
                setActiveTab('categories');
              }}
              className={`w-full text-left px-3.5 py-3 pixel-box text-xs font-pixel-title flex items-center gap-3 transition-all ${
                activeTab === 'categories'
                  ? 'bg-[#160078] text-[#FFD84D] border-2 border-[#E02F75] shadow-[0_0_10px_rgba(224,47,117,0.4)]'
                  : 'bg-[#131947]/70 text-[#A9B8FF] hover:bg-[#131947] hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#FFD84D]" />
              <span>ATUR KATEGORI ({categories.length})</span>
            </button>

            <button
              onClick={() => {
                if (soundEnabled) retroAudio.playButtonClick();
                setActiveTab('frames');
              }}
              className={`w-full text-left px-3.5 py-3 pixel-box text-xs font-pixel-title flex items-center gap-3 transition-all ${
                activeTab === 'frames'
                  ? 'bg-[#160078] text-[#FFD84D] border-2 border-[#E02F75] shadow-[0_0_10px_rgba(224,47,117,0.4)]'
                  : 'bg-[#131947]/70 text-[#A9B8FF] hover:bg-[#131947] hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4 text-[#E02F75]" />
              <span>KELOLA TEMPLATE & FRAME ({templates.length})</span>
            </button>

            <button
              onClick={() => {
                if (soundEnabled) retroAudio.playButtonClick();
                setActiveTab('hardware');
              }}
              className={`w-full text-left px-3.5 py-3 pixel-box text-xs font-pixel-title flex items-center gap-3 transition-all ${
                activeTab === 'hardware'
                  ? 'bg-[#160078] text-[#FFD84D] border-2 border-[#E02F75] shadow-[0_0_10px_rgba(224,47,117,0.4)]'
                  : 'bg-[#131947]/70 text-[#A9B8FF] hover:bg-[#131947] hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4 text-[#00E599]" />
              <span>HARDWARE &bull; KAMERA &amp; PRINTER</span>
            </button>
          </nav>

          {/* Quick Launch ke Layar Booth */}
          <div className="px-3 pt-3">
            <a
              href="/booth"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundEnabled && retroAudio.playButtonClick()}
              className="w-full h-11 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-xs font-pixel-title font-bold flex items-center justify-center gap-2 shadow-violet-glow"
              title="Buka bilik booth tablet"
            >
              <Camera className="w-4 h-4" />
              <span>BUKA LAYAR BOOTH</span>
            </a>
          </div>
        </div>

        {/* Footer Sidebar: User Profile & Logout (TANPA LINK KE BERANDA) */}
        <div className="p-4 border-t-4 border-[#4B57B2] bg-[#050C38]/90 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A9B8FF] text-[10px]">OPERATOR #1</span>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) retroAudio.playButtonClick();
              }}
              className="p-1.5 pixel-box bg-[#131947] hover:bg-[#160078] text-[#FFD84D]"
              title="Toggle Audio 8-Bit"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => {
              if (soundEnabled) retroAudio.playButtonClick();
              document.cookie = 'booth_admin_session=; path=/; max-age=0; SameSite=Lax';
              window.location.href = '/admin/login';
            }}
            className="w-full h-10 pixel-box bg-[#131947] hover:bg-[#FE0168] text-white/80 hover:text-white text-xs font-pixel-title flex items-center justify-center gap-2 transition-colors"
            title="Keluar dari sesi operator"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>KUNCI &bull; KELUAR</span>
          </button>
        </div>
      </aside>

      {/* =====================================================================
          2. KONTEN UTAMA (HEADER BALANCED, KANBAN BOARD / SETTINGS / FRAMES)
          ===================================================================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header Seimbang (Tanpa Tombol Back Beranda) */}
        <header className="h-16 bg-[#0C1230]/90 border-b-4 border-[#4B57B2] px-6 flex items-center justify-between shrink-0 backdrop-blur">
          <div className="flex items-center gap-3">
            <h2 className="font-pixel-title text-sm sm:text-base text-[#FFD84D] tracking-wide">
              {activeTab === 'board' && 'ANTREAN PENGUNJUNG'}
              {activeTab === 'categories' && 'PENGATURAN KATEGORI KOLOM'}
              {activeTab === 'frames' && 'KELOLA & UNGGAH DESIGN FRAME 4R'}
              {activeTab === 'hardware' && 'MONITOR DRIVER HARDWARE CANON & EPSON'}
            </h2>
          </div>

          {/* Sisi Kanan Header: Radar Auto-Refresh & Pencarian */}
          <div className="flex items-center gap-3">
            {/* Indikator Denyut Radar Auto-Refresh Berkelanjutan */}
            <div className="flex items-center gap-2 bg-[#050C38] px-3 py-1.5 border-2 border-[#00E599] text-[10px] font-pixel-title text-[#00E599]">
              <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
              <span>AUTO-REFRESH: AKTIF</span>
              <span className="w-2 h-2 bg-[#00E599] rounded-none animate-ping" />
            </div>

            {/* Kotak Pencarian */}
            {activeTab === 'board' && (
              <div className="relative w-48 sm:w-60">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama / #nomor..."
                  className="w-full h-9 pl-8 pr-2.5 border-2 border-[#4B57B2] bg-[#050C38] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75]"
                />
                <Search className="w-3.5 h-3.5 text-white/50 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            )}
          </div>
        </header>



        {/* Dialog Spooling Cetak Epson L300 */}
        {printingItem && (
          <div className="m-4 pixel-box-cyber bg-[#131947] p-4 text-center animate-fadeIn shrink-0">
            <div className="flex items-center justify-center gap-2 text-[#00E599] font-pixel-title text-xs mb-1.5">
              <PixelPrinterIcon size={18} />
              <span>SPOOLING KE EPSON L300 4R...</span>
            </div>
            <p className="text-xs text-white/80">
              Mencetak <span className="text-[#FFD84D] font-bold">{printCopies}x lembar</span> untuk{' '}
              <span className="text-[#5CE1E6] font-bold">{printingItem.nickname}</span> ({printingItem.number})
            </p>
            <div className="w-48 h-2 bg-black mx-auto mt-2 overflow-hidden border border-[#4B57B2]">
              <div className="h-full bg-[#00E599] animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* Body Area Sesuai Tab Aktif */}
        {/* Body Area Sesuai Tab Aktif */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
          {/* =================================================================
              TAB 1: PAPAN ANTREAN PENGUNJUNG (5 KOLOM MUAT PRESISI DI 1 LAYAR)
              ================================================================= */}
          {activeTab === 'board' && (
            <div className="flex flex-col gap-3 w-full">
              {/* DASHBOARD STATISTIK AWAL ADMIN (TOTAL LEMBAR TERCETAK, ANTREAN, SESI AKTIF) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {/* 1. LEMBAR TERCETAK (REQUEST USER: DASHBOARD AWAL ISINYA ADA BERAPA LEMBAR DAH TERCETAK) */}
                <div className="bg-[#0C1230]/95 pixel-box p-3 border-2 border-[#00E599] flex flex-col justify-between shadow-[3px_3px_0_0_#050C38]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-pixel-title text-[#A9B8FF] flex items-center gap-1.5">
                      <PixelPrinterIcon size={14} />
                      LEMBAR TERCETAK
                    </span>
                    <button
                      type="button"
                      onClick={handleResetPrintCount}
                      className="text-[8px] font-pixel-title text-white/50 hover:text-[#FE0168] underline"
                      title="Atur ulang counter lembar cetak"
                    >
                      RESET
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-pixel-title text-[#00E599] font-bold">
                      {totalPrintedSheets}
                    </span>
                    <span className="text-[10px] font-pixel-title text-[#FFD84D]">LEMBAR 4R</span>
                  </div>
                  <span className="text-[8px] text-[#00E599] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-[#00E599] animate-pulse" />
                    Spooler Epson L300 Ready
                  </span>
                </div>

                {/* 2. TOTAL ANTREAN DENGAN NOMOR BERIKUTNYA BERURUT */}
                <div className="bg-[#0C1230]/95 pixel-box p-3 border-2 border-[#5CE1E6] flex flex-col justify-between shadow-[3px_3px_0_0_#050C38]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-pixel-title text-[#A9B8FF]">TOTAL ANTREAN</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingVisitor(!isAddingVisitor)}
                      className="px-1.5 py-0.5 bg-[#1E2768] hover:bg-[#5CE1E6] hover:text-[#050C38] text-[#5CE1E6] text-[8px] font-pixel-title flex items-center gap-1 border border-[#5CE1E6]/40"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>TAMBAH</span>
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-pixel-title text-[#5CE1E6] font-bold">
                      {queue.length}
                    </span>
                    <span className="text-[10px] font-pixel-title text-[#A9B8FF]">PENGUNJUNG</span>
                  </div>
                  <span className="text-[8px] text-[#FFD84D] truncate">
                    No. Berikutnya: {getCurrentTicketNumber()}
                  </span>
                </div>

                {/* 3. SESI AKTIF BILIK */}
                <div className="bg-[#0C1230]/95 pixel-box p-3 border-2 border-[#FE0168] flex flex-col justify-between shadow-[3px_3px_0_0_#050C38]">
                  <span className="text-[10px] font-pixel-title text-[#A9B8FF] mb-1">SESI BILIK AKTIF</span>
                  <div className="truncate">
                    <span className="text-base sm:text-lg font-pixel-title text-[#FE0168] font-bold truncate block">
                      {queue.find((q) => q.status === 'IN_SESSION')?.nickname || 'STANDBY'}
                    </span>
                  </div>
                  <span className="text-[8px] text-[#FFD84D]">
                    {queue.some((q) => q.status === 'IN_SESSION') ? '● Bilik Sedang Mengambil Foto' : '○ Menunggu Dipanggil ke Bilik'}
                  </span>
                </div>

                {/* 4. TOTAL SELESAI */}
                <div className="bg-[#0C1230]/95 pixel-box p-3 border-2 border-[#FFD84D] flex flex-col justify-between shadow-[3px_3px_0_0_#050C38]">
                  <span className="text-[10px] font-pixel-title text-[#A9B8FF] mb-1">SELESAI FOTO</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-pixel-title text-[#FFD84D] font-bold">
                      {queue.filter((q) => q.status === 'DONE').length}
                    </span>
                    <span className="text-[10px] font-pixel-title text-[#00E599]">SIAP AMBIL</span>
                  </div>
                  <span className="text-[8px] text-[#A9B8FF]">
                    Cetak &amp; Galeri Unduh Tersedia
                  </span>
                </div>
              </div>

              {/* Form Tambah Antrean Manual Cepat jika Dibuka */}
              {isAddingVisitor && (
                <form
                  onSubmit={handleAddManualQueue}
                  className="bg-[#131947] border-2 border-[#5CE1E6] p-3 flex flex-wrap items-center gap-3 animate-fadeIn"
                >
                  <span className="font-pixel-title text-[10px] text-[#FFD84D]">
                    TAMBAH ANTREAN CEPAT ({getCurrentTicketNumber()}):
                  </span>
                  <input
                    type="text"
                    value={newVisitorNickname}
                    onChange={(e) => setNewVisitorNickname(e.target.value)}
                    placeholder="Nama panggilan / grup wisudawan..."
                    className="flex-1 min-w-[200px] h-8 px-2.5 bg-[#050C38] border border-[#4B57B2] text-xs text-white outline-none focus:border-[#5CE1E6]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="h-8 px-4 pixel-btn bg-[#00E599] text-[#050C38] text-[10px] font-pixel-title font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>SIMPAN &amp; AMBIL TIKET</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingVisitor(false)}
                    className="h-8 px-3 pixel-btn bg-[#FE0168] text-white text-[10px] font-pixel-title"
                  >
                    BATAL
                  </button>
                </form>
              )}

              {/* Papan Kanban Kolom Antrean */}
              <div
                className="grid gap-2.5 items-start w-full"
                style={{
                  gridTemplateColumns: `repeat(${categories.filter((c) => c.active).length}, minmax(0, 1fr))`,
                }}
              >
              {categories
                .filter((cat) => cat.active)
                .map((category) => {
                  const categoryItems = filteredQueue.filter((q) => q.status === category.key);

                  return (
                    <div
                      key={category.id}
                      className="bg-[#0C1230]/95 pixel-box p-2.5 flex flex-col min-h-[520px] min-w-0"
                    >
                      {/* Header Kolom Kategori */}
                      <div
                        className="pb-2 mb-2.5 border-b-2 flex items-center justify-between gap-1"
                        style={{ borderColor: category.color }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <h3
                            className="font-pixel-title text-[10px] sm:text-[11px] tracking-wider truncate"
                            style={{ color: category.color }}
                            title={category.title}
                          >
                            {category.title}
                          </h3>
                        </div>

                        <span
                          className="px-1.5 py-0.5 text-[9px] font-pixel-title border shrink-0"
                          style={{
                            color: category.color,
                            backgroundColor: category.badgeBg,
                            borderColor: `${category.color}60`,
                          }}
                        >
                          {categoryItems.length}
                        </span>
                      </div>

                      {/* Daftar Kartu Tiket dalam Kolom */}
                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[640px] pr-0.5">
                        {categoryItems.length === 0 ? (
                          <div className="p-4 text-center text-white/30 text-[10px] font-pixel-title border-2 border-dashed border-white/10 mt-6">
                            Kosong
                          </div>
                        ) : (
                          categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className={`bg-[#131947]/90 pixel-box p-2.5 hover:bg-[#161F54] transition-all min-w-0 ${
                                category.key === 'IN_SESSION'
                                  ? 'border-2 border-[#FE0168] bg-[#1C184A] shadow-[0_0_12px_rgba(254,1,104,0.3)] animate-pulse'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1 gap-1">
                                <span className="font-pixel-title text-xs sm:text-sm text-[#FFD84D]">
                                  {item.number}
                                </span>
                                <span className="text-[9px] text-white/50 shrink-0">{item.registeredAt}</span>
                              </div>

                              <p className="font-bold text-white text-[11px] sm:text-xs mb-2.5 truncate" title={item.nickname}>
                                {item.nickname}
                              </p>

                              {/* Tombol Aksi Kontekstual Sesuai Kolom */}
                              {category.key === 'QUEUED' && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() =>
                                      updateStatus(
                                        item.id,
                                        'IN_SESSION',
                                        `Sesi foto dimulai untuk ${item.nickname} (${item.number})`
                                      )
                                    }
                                    className="flex-1 py-1.5 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-bold flex items-center justify-center gap-1"
                                  >
                                    <Play className="w-3 h-3" />
                                    <span>MULAI</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateStatus(
                                        item.id,
                                        'WAITING',
                                        `${item.nickname} dipindahkan ke Pending`
                                      )
                                    }
                                    className="py-1.5 px-2 pixel-box bg-[#0C1230] hover:bg-[#A86400]/40 text-[#FFD84D] text-[10px]"
                                    title="Lewati sementara"
                                  >
                                    LEWATI
                                  </button>
                                </div>
                              )}

                              {category.key === 'WAITING' && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() =>
                                      updateStatus(
                                        item.id,
                                        'IN_SESSION',
                                        `Sesi foto dimulai untuk ${item.nickname} (${item.number})`
                                      )
                                    }
                                    className="flex-1 py-1.5 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-bold flex items-center justify-center gap-1"
                                  >
                                    <Play className="w-3 h-3" />
                                    <span>MULAI</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateStatus(
                                        item.id,
                                        'QUEUED',
                                        `${item.nickname} dikembalikan ke antrean utama`
                                      )
                                    }
                                    className="py-1.5 px-2 pixel-box bg-[#0C1230] hover:bg-[#160078] text-[#5CE1E6] text-[10px]"
                                    title="Antrekan lagi"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {category.key === 'IN_SESSION' && (
                                <div className="space-y-2">
                                  <div className="text-[9px] font-pixel-title text-[#FE0168] bg-black/50 px-2 py-0.5 text-center border border-[#FE0168]/40">
                                    ● SEDANG FOTO DI TABLET
                                  </div>
                                  <button
                                    onClick={() =>
                                      updateStatus(
                                        item.id,
                                        'DONE',
                                        `Sesi ${item.nickname} tuntas & masuk ke Selesai!`
                                      )
                                    }
                                    className="w-full py-1.5 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-bold flex items-center justify-center gap-1.5"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>SELESAIKAN</span>
                                  </button>
                                </div>
                              )}

                              {category.key === 'PRINT_ORDER' && (
                                <div className="space-y-1.5">
                                  <button
                                    onClick={() => handlePrint(item)}
                                    className="w-full py-1.5 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-[10px] font-bold flex items-center justify-center gap-1"
                                  >
                                    <PixelPrinterIcon size={12} />
                                    <span>CETAK EPSON</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateStatus(item.id, 'DONE', `Cetak selesai untuk ${item.nickname}`)
                                    }
                                    className="w-full py-1 pixel-box bg-[#0C1230] text-[9px] text-white/60 hover:text-white"
                                  >
                                    TANDAI SELESAI
                                  </button>
                                </div>
                              )}

                              {category.key === 'DONE' && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handlePrint(item)}
                                    className="flex-1 py-1 pixel-btn bg-[#6700A3] hover:bg-[#7226FF] text-white text-[10px] font-bold flex items-center justify-center gap-1"
                                    title="Cetak foto 4R"
                                  >
                                    <PixelPrinterIcon size={12} />
                                    <span>CETAK</span>
                                  </button>
                                  <Link
                                    href="/gallery"
                                    onClick={() => soundEnabled && retroAudio.playButtonClick()}
                                    className="py-1 px-2 pixel-box bg-[#0C1230] hover:bg-[#160078] text-[#5CE1E6] text-[10px]"
                                    title="Buka galeri digital"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Link>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: ATUR KATEGORI KOLOM (BISA DI-SET, DIEDIT, & DITAMBAH)
              ================================================================= */}
          {activeTab === 'categories' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-[#0C1230]/95 pixel-box p-6">
                <h3 className="font-pixel-title text-sm text-[#FFD84D] mb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FFD84D]" />
                  <span>PENGATURAN KATEGORI KOLOM PAPAN</span>
                </h3>
                <p className="text-xs text-white/70 mb-6">
                  Sesuaikan nama kolom, warna aksen, dan tambah kategori khusus agar papan kanban sesuai dengan alur kerja booth Anda.
                </p>

                {/* Form Tambah Kategori */}
                <form
                  onSubmit={handleAddCategory}
                  className="bg-[#131947]/90 pixel-box-cyber p-4 mb-6 flex flex-wrap items-end gap-3"
                >
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-pixel-title text-[#FFD84D] mb-1">
                      NAMA KATEGORI BARU
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatTitle}
                      onChange={(e) => setNewCatTitle(e.target.value)}
                      placeholder="Misal: VVIP / RETAKE FOTO"
                      className="w-full h-10 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-pixel-title text-[#5CE1E6] mb-1">
                      WARNA AKSEN
                    </label>
                    <div className="flex items-center gap-1.5 h-10">
                      {['#5CE1E6', '#FFD84D', '#FE0168', '#00E599', '#7226FF', '#FF8E72'].map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setNewCatColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-7 h-7 border-2 ${
                            newCatColor === c ? 'border-white scale-110 shadow-lg' : 'border-black/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="h-10 px-5 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>TAMBAH KATEGORI</span>
                  </button>
                </form>

                {/* Daftar Kategori Aktif */}
                <div className="space-y-3">
                  <span className="text-xs font-pixel-title text-[#5CE1E6] block">
                    KOLOM AKTIF DI LAYAR ({categories.length}):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((cat, idx) => (
                      <div
                        key={cat.id}
                        className="p-3.5 bg-[#131947]/80 border-2 border-[#4B57B2] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <span className="font-pixel-title text-xs text-white block">
                              {idx + 1}. {cat.title}
                            </span>
                            <span className="text-[10px] text-white/50">
                              Kode status: {cat.key}
                            </span>
                          </div>
                        </div>

                        {idx >= 3 && (
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 pixel-box bg-[#0C1230] hover:bg-[#FE0168] text-white/50 hover:text-white"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: KELOLA & UNGGAH DESIGN FRAME (DENGAN FILE PNG PREVIEW)
              ================================================================= */}
          {activeTab === 'frames' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* DAFTAR TEMPLATE FRAME AKTIF (HERO UTAMA - PERSIS GAMBAR 1 & 2) */}
              <div className="bg-[#0C1230]/95 pixel-box p-6 border-2 border-[#5CE1E6] shadow-[0_0_20px_rgba(92,225,230,0.2)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-[#4B57B2]">
                  <div>
                    <h3 className="font-pixel-title text-sm sm:text-base text-[#FFD84D] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#5CE1E6]" />
                      <span>DAFTAR TEMPLATE FRAME BOOTH ({templates.length})</span>
                    </h3>
                    <p className="text-xs text-[#A9B8FF] mt-1">
                      Sistem desain template standar cetak 4R (1200×1800 px) sesuai Gambar 1 &amp; 2. Klik Tambah / Ubah untuk membuka modal.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddTemplate}
                    className="px-5 py-2.5 pixel-btn bg-[#FFD84D] hover:bg-[#FFE57F] text-[#050C38] text-xs font-pixel-title font-bold flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0_0_#000] active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>TAMBAH TEMPLATE</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.slug}
                      className="bg-[#131947]/90 pixel-box p-4 flex flex-col justify-between border border-[#4B57B2]/70 hover:border-[#5CE1E6] transition-all"
                    >
                      <div>
                        {/* Pratinjau Kanvas 4R Proporsional */}
                        <div
                          className="aspect-[2/3] w-28 mx-auto border-2 border-[#4B57B2] mb-3 overflow-hidden flex items-center justify-center p-1 relative shadow-inner"
                          style={{ backgroundColor: tpl.bgColor || '#050C38' }}
                        >
                          {tpl.frameImage ? (
                            <img
                              src={tpl.frameImage}
                              alt={tpl.name}
                              className="w-full h-full object-contain pixel-art z-10"
                            />
                          ) : (
                            <div className="text-[9px] text-white/50 font-pixel-title text-center z-10">
                              {(tpl.previewType || '4R').toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-pixel-title text-xs text-[#FFD84D] truncate" title={tpl.name}>
                            {tpl.name}
                          </h4>
                          {tpl.isCustom ? (
                            <span className="text-[8px] font-pixel-title bg-[#E02F75] px-1.5 py-0.5 text-white">
                              KUSTOM
                            </span>
                          ) : (
                            <span className="text-[8px] font-pixel-title bg-[#160078] px-1.5 py-0.5 text-[#5CE1E6] border border-[#5CE1E6]/40">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/70 mb-3 leading-snug line-clamp-2">
                          {tpl.desc}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-[#4B57B2]/50 text-[9px] font-pixel-title gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTemplate(tpl)}
                            className="px-3 py-1.5 pixel-btn bg-[#FFD84D] hover:bg-[#FFE57F] text-[#050C38] flex items-center gap-1.5 font-bold shadow-sm active:scale-95"
                            title="Buka Modal Ubah Template (Gambar 1)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>UBAH TEMPLATE</span>
                          </button>
                        </div>
                        <span className="text-[#00E599] font-bold">{tpl.photoCount} FOTO &bull; 4R</span>
                        {tpl.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFrame(tpl.slug)}
                            className="p-1 text-[#FE0168] hover:text-white"
                            title="Hapus Template Kustom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACCORDION: ALAT PEMINDAI ALPHA TRANSPARANSI PNG (OPSIONAL) */}
              <div className="bg-[#0C1230]/95 pixel-box border border-[#4B57B2]/70 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowLegacyScanner(!showLegacyScanner)}
                  className="w-full p-4 bg-[#131947]/80 hover:bg-[#160078] flex items-center justify-between text-left text-xs font-pixel-title text-[#5CE1E6] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-[#FFD84D]" />
                    <span>ALAT PEMINDAI ALPHA TRANSPARANSI PNG &amp; RASIO LANDSCAPE (OPSIONAL)</span>
                  </div>
                  <span className="text-[10px] text-white/60 font-pixel">
                    {showLegacyScanner ? '▲ SEMBUNYIKAN ALAT' : '▼ BUKA ALAT PEMINDAI'}
                  </span>
                </button>

                {showLegacyScanner && (
                  <div className="p-6 border-t border-[#4B57B2]/60">
                    {/* Form Unggah & Pengaturan Frame Baru */}
              <div className="bg-[#0C1230]/95 pixel-box p-6">
                <div className="mb-6 pb-3 border-b-2 border-[#4B57B2] flex items-center justify-between">
                  <div>
                    <h3 className="font-pixel-title text-sm text-[#FFD84D] flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#E02F75]" />
                      <span>UNGGAH &amp; BUAT DESIGN FRAME 4R BARU</span>
                    </h3>
                    <p className="text-xs text-white/70 mt-1">
                      Pilih file gambar frame PNG (1200x1800 transparan) agar langsung aktif di tablet bilik booth.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveFrame} className="space-y-6">
                  {/* Panduan & Penjelasan Deteksi Area Lubang Foto */}
                  <div className="p-4 bg-[#131947]/90 border-2 border-[#5CE1E6] pixel-box space-y-2">
                    <div className="flex items-center gap-2 text-xs font-pixel-title text-[#5CE1E6]">
                      <Scan className="w-4 h-4 text-[#FFD84D]" />
                      <span>CARA DETEKSI LUBANG FOTO &amp; FORMAT LANDSCAPE:</span>
                    </div>
                    <ul className="text-[11px] text-white/80 space-y-1.5 pl-1 leading-relaxed">
                      <li>
                        &bull; <strong className="text-[#FFD84D]">Deteksi Transparansi Otomatis:</strong> Unggah file bingkai <span className="text-[#5CE1E6]">PNG 4R (1200 x 1800 px)</span> yang memiliki lubang tembus pandang (<em className="text-[#00E599]">Alpha Channel = 0</em>). Sistem pemindai akan otomatis mengukur posisi slot (X, Y, Lebar, Tinggi) secara presisi.
                      </li>
                      <li>
                        &bull; <strong className="text-[#FFD84D]">Foto Berorientasi Landscape:</strong> Kamera Canon DSLR &amp; webcam mengambil foto secara <span className="text-[#FE0168] font-bold">Landscape (Mendatar)</span>. Pilih rasio kamera Anda (<strong className="text-[#00E599]">4:3</strong> atau <strong className="text-[#00E599]">16:9</strong> atau <strong className="text-[#00E599]">3:2</strong>) agar foto otomatis dipotong dan disematkan pas di balik frame tanpa distorsi.
                      </li>
                      <li>
                        &bull; <strong className="text-[#FFD84D]">Preset Fallback:</strong> Jika frame belum transparan (JPG biasa), sistem otomatis menyusun tata letak landscape simetris sesuai jumlah foto yang dipilih.
                      </li>
                    </ul>
                  </div>

                  {/* 1. Pilih Rasio Landscape Kamera */}
                  <div>
                    <label className="block text-xs font-pixel-title text-[#FFD84D] mb-2 flex items-center justify-between">
                      <span>1. PILIH RASIO FOTO LANDSCAPE KAMERA:</span>
                      <span className="text-[10px] text-[#00E599]">AKTIF: {photoRatio} LANDSCAPE</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          ratio: '4:3' as const,
                          title: '4:3 STANDAR LANDSCAPE',
                          desc: '1600 x 1200 px &bull; Paling umum untuk photobooth & webcam',
                          badge: 'UMUM',
                        },
                        {
                          ratio: '16:9' as const,
                          title: '16:9 WIDE LANDSCAPE',
                          desc: '1920 x 1080 px &bull; Format cinematic widescreen modern',
                          badge: 'WIDE',
                        },
                        {
                          ratio: '3:2' as const,
                          title: '3:2 CANON DSLR NATIVE',
                          desc: '1920 x 1280 px &bull; Rasio sensor native Canon EOS 1200D',
                          badge: 'DSLR',
                        },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.ratio}
                          onClick={() => handleRatioChange(item.ratio)}
                          className={`p-3 text-left pixel-box transition-all ${
                            photoRatio === item.ratio
                              ? 'bg-[#160078] text-[#FFD84D] border-2 border-[#5CE1E6] shadow-[0_0_12px_rgba(92,225,230,0.4)]'
                              : 'bg-[#131947] text-white/70 hover:bg-[#161F54]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-pixel-title text-xs">{item.title}</span>
                            <span className="text-[8px] font-pixel-title px-1.5 py-0.5 bg-black/60 border border-white/20 text-[#00E599]">
                              {item.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/50 block font-normal" dangerouslySetInnerHTML={{ __html: item.desc }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Area Unggah File Gambar Frame PNG & Scanner Transparansi */}
                  <div className="bg-[#131947]/90 pixel-box-cyber p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-xs font-pixel-title text-[#FFD84D]">
                        2. UNGGAH FILE BINGKAI FRAME (PNG TRANSPARAN 1200 x 1800)
                      </label>
                      {uploadedFramePreview && (
                        <button
                          type="button"
                          disabled={isScanning}
                          onClick={() => runFrameScan(uploadedFramePreview, photoRatio)}
                          className="px-3 py-1.5 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-pixel-title flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <Scan className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                          <span>{isScanning ? 'MEMINDAI ALPHA...' : 'PINDAI ULANG TRANSPARANSI'}</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                      {/* Kotak Drag & Drop / File Input */}
                      <div className="space-y-3">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer border-2 border-dashed border-[#5CE1E6] bg-[#050C38] p-5 text-center hover:bg-[#0A1647] transition-colors flex flex-col items-center justify-center min-h-[190px]"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleFrameFileUpload}
                            className="hidden"
                          />
                          <Upload className="w-8 h-8 text-[#5CE1E6] mb-2 animate-bounce" />
                          <span className="font-pixel-title text-xs text-white block mb-1">
                            KLIK / DROP FILE FRAME PNG
                          </span>
                          <span className="text-[10px] text-white/50 block">
                            Ukuran 4R: 1200 x 1800 px (300 DPI)
                          </span>
                          <span className="text-[9px] text-[#00E599] mt-2 block bg-black/40 px-2 py-0.5 border border-[#00E599]/30">
                            ✓ Otomatis Deteksi Slot Lubang Landscape
                          </span>
                        </div>

                        {/* Indikator Status Hasil Pemindaian */}
                        {scanMessage && (
                          <div className="p-2.5 bg-[#050C38] border border-[#5CE1E6] text-[10px] font-pixel-title text-[#5CE1E6] flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#00E599] shrink-0" />
                            <span className="leading-snug">{scanMessage}</span>
                          </div>
                        )}
                      </div>

                      {/* SIMULATOR PRATINJAU INTERAKTIF FRAME 4R */}
                      <div className="flex flex-col items-center justify-center bg-[#050C38] p-4 border-2 border-[#4B57B2]">
                        <div className="flex items-center justify-between w-full mb-2 text-[10px] font-pixel-title text-white/70">
                          <span>SIMULATOR LIVE PREVIEW 4R</span>
                          <span className="text-[#FFD84D]">{photoRatio} LANDSCAPE</span>
                        </div>

                        {/* Kotak Kanvas Frame 4R (Aspect 2/3) */}
                        <div
                          className="relative w-56 aspect-[2/3] border-2 border-[#FE0168] shadow-[0_0_20px_rgba(5,12,56,0.9)] overflow-hidden"
                          style={{
                            backgroundImage:
                              'repeating-conic-gradient(#1A2045 0% 25%, #0C1230 0% 50%) 50% / 16px 16px',
                          }}
                        >
                          {/* LAPISAN 1: SLOT FOTO LANDSCAPE BELAKANG */}
                          {showDemoPhotos && (
                            <div className="absolute inset-0 pointer-events-none">
                              {(detectedSlots.length > 0
                                ? detectedSlots
                                : getFallbackPreset(frameCount, photoRatio, frameLayout).slots
                              ).map((slot) => {
                                const poseIdx = (slot.poseId || slot.id) - 1;
                                const palette = ['#1D4ED8', '#BE185D', '#047857', '#B45309', '#7C3AED', '#C2410C'];
                                return (
                                  <div
                                    key={slot.id}
                                    className="absolute border border-black/40 overflow-hidden flex flex-col items-center justify-center transition-all shadow-inner"
                                    style={{
                                      left: `${slot.xPercent}%`,
                                      top: `${slot.yPercent}%`,
                                      width: `${slot.widthPercent}%`,
                                      height: `${slot.heightPercent}%`,
                                      backgroundColor: palette[poseIdx % palette.length],
                                    }}
                                  >
                                    <span className="font-pixel-title text-[7px] text-white bg-black/60 px-1 border border-white/20 whitespace-nowrap">
                                      {slot.label || `POSE #${slot.poseId || slot.id}`}
                                    </span>
                                    <span className="text-[6px] text-white/80 font-pixel">
                                      {photoRatio} LANDSCAPE
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* LAPISAN 2: BINGKAI FRAME PNG TENGAH (DENGAN LUBANG TRANSPARAN) */}
                          {uploadedFramePreview ? (
                            <img
                              src={uploadedFramePreview}
                              alt="Frame PNG Layer"
                              className="absolute inset-0 w-full h-full object-fill pixel-art pointer-events-none z-10"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10 pointer-events-none bg-black/30">
                              <span className="text-[9px] font-pixel-title text-white/60 mb-1">
                                [ BELUM ADA FILE FRAME ]
                              </span>
                              <span className="text-[7px] text-white/40">
                                Menggunakan simulasi tata letak preset {frameCount} foto
                              </span>
                            </div>
                          )}

                          {/* LAPISAN 3: OVERLAY GARIS BIDIK NEON (CROSSHAIRS & KOORDINAT) */}
                          {showCrosshairs && (
                            <div className="absolute inset-0 pointer-events-none z-20">
                              {(detectedSlots.length > 0
                                ? detectedSlots
                                : getFallbackPreset(frameCount, photoRatio, frameLayout).slots
                              ).map((slot) => (
                                <div
                                  key={`cross-${slot.id}`}
                                  className="absolute border-2 border-dashed border-[#5CE1E6] animate-pulse"
                                  style={{
                                    left: `${slot.xPercent}%`,
                                    top: `${slot.yPercent}%`,
                                    width: `${slot.widthPercent}%`,
                                    height: `${slot.heightPercent}%`,
                                  }}
                                >
                                  <span className="absolute -top-3.5 left-0 text-[6px] font-pixel-title bg-[#0C1230] text-[#5CE1E6] px-1 border border-[#5CE1E6]/50 whitespace-nowrap">
                                    {slot.label || `SLOT #${slot.id}`} ({slot.aspectRatio})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Kontrol Toggle Pratinjau Simulator */}
                        <div className="flex items-center gap-2 mt-3 text-[9px] font-pixel-title">
                          <button
                            type="button"
                            onClick={() => setShowCrosshairs(!showCrosshairs)}
                            className={`px-2 py-1 pixel-box ${
                              showCrosshairs ? 'bg-[#5CE1E6] text-black font-bold' : 'bg-[#131947] text-white/60'
                            }`}
                          >
                            <Crosshair className="w-3 h-3 inline mr-1" />
                            <span>GARIS BIDIK</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDemoPhotos(!showDemoPhotos)}
                            className={`px-2 py-1 pixel-box ${
                              showDemoPhotos ? 'bg-[#00E599] text-black font-bold' : 'bg-[#131947] text-white/60'
                            }`}
                          >
                            <Camera className="w-3 h-3 inline mr-1" />
                            <span>FOTO CONTOH</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Ringkasan Koordinat Slot Terdeteksi */}
                    {(detectedSlots.length > 0 || uploadedFramePreview) && (
                      <div className="pt-2 border-t border-[#4B57B2]/40">
                        <span className="text-[10px] font-pixel-title text-[#FFD84D] block mb-1.5">
                          KOORDINAT SLOT LUBANG TERDETEKSI:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(detectedSlots.length > 0
                            ? detectedSlots
                            : getFallbackPreset(frameCount, photoRatio).slots
                          ).map((s) => (
                            <div key={s.id} className="p-1.5 bg-[#050C38] border border-[#5CE1E6]/40 text-[9px]">
                              <span className="font-pixel-title text-[#5CE1E6] block">SLOT #{s.id} ({s.aspectRatio})</span>
                              <span className="text-white/60 block text-[8px]">
                                X: {s.xPercent}% &bull; Y: {s.yPercent}%
                              </span>
                              <span className="text-white/60 block text-[8px]">
                                L: {s.widthPercent}% &bull; T: {s.heightPercent}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Detail Nama & Konfigurasi Frame */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-pixel-title text-[#FFD84D] mb-1.5">
                        NAMA DESIGN FRAME <span className="text-[#FE0168]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={frameName}
                        onChange={(e) => setFrameName(e.target.value)}
                        placeholder="Contoh: WISUDA EMAS TIK 4R"
                        className="w-full h-11 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
                        DESKRIPSI FRAME
                      </label>
                      <input
                        type="text"
                        value={frameDesc}
                        onChange={(e) => setFrameDesc(e.target.value)}
                        placeholder="Contoh: Tema malam expo informatika"
                        className="w-full h-11 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white text-xs font-pixel focus:outline-none focus:border-[#E02F75]"
                      />
                    </div>
                  </div>

                  {/* 4. Pilihan Jumlah Foto / Pose */}
                  <div>
                    <label className="block text-[11px] font-pixel-title text-[#5CE1E6] mb-2 flex items-center justify-between">
                      <span>4. JUMLAH FOTO / POSE DALAM FRAME:</span>
                      <span className="text-[#FFD84D] text-[10px]">{frameCount} FOTO TERPILIH</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { count: 1, label: '1 FOTO (POSTER)' },
                        { count: 2, label: '2 FOTO (DUO)' },
                        { count: 3, label: '3 FOTO (TRIO)' },
                        { count: 4, label: '4 FOTO (STRIP)' },
                        { count: 6, label: '6 FOTO (COLLAGE)' },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.count}
                          onClick={() => handleFrameCountSelect(item.count)}
                          className={`p-2.5 text-center pixel-box text-[10px] font-pixel-title transition-all ${
                            frameCount === item.count
                              ? 'bg-[#E02F75] text-white border-2 border-[#FFD84D]'
                              : 'bg-[#131947] text-white/70 hover:bg-[#160078]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Pilihan Tata Letak Fallback Layout */}
                  <div>
                    <label className="block text-[11px] font-pixel-title text-[#5CE1E6] mb-2">
                      5. TATA LETAK LAYOUT:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { type: 'strip' as const, title: 'Strip 2-Kolom', desc: 'Gaya photobooth strip klasik' },
                        { type: 'grid' as const, title: 'Grid 2x2', desc: '4 foto simetris berdampingan' },
                        { type: 'trio' as const, title: 'Trio Strip', desc: '3 foto bertingkat vertikal' },
                        { type: 'duo' as const, title: 'Duo Skyline', desc: '2 foto bertingkat untuk berdua' },
                        { type: 'single' as const, title: 'Poster Tunggal', desc: '1 foto besar portrait 4R' },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.type}
                          onClick={() => setFrameLayout(item.type)}
                          className={`p-3 text-left pixel-box text-xs font-pixel-title transition-all ${
                            frameLayout === item.type
                              ? 'bg-[#6700A3] text-[#FFD84D] border-2 border-[#E02F75]'
                              : 'bg-[#131947] text-white/70 hover:bg-[#160078]'
                          }`}
                        >
                          <span className="block mb-0.5">{item.title}</span>
                          <span className="text-[9px] text-white/50 block font-normal">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tombol Simpan Frame */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#4B57B2]/40">
                    <span className="text-[10px] text-white/50">
                      Format: Standar 4R (10x15 cm) &bull; DPI: 300 High Res &bull; {photoRatio} Landscape Ready
                    </span>
                    <button
                      type="submit"
                      className="h-12 px-8 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-xs flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>SIMPAN &amp; AKTIFKAN FRAME DI BOOTH</span>
                    </button>
                  </div>
                </form>
              </div>
                  </div>
                )}
              </div>
            </div>
          )}

                    {/* =================================================================
              TAB 4: MONITOR HARDWARE (CANON EOS 1200D & EPSON L300)
              ================================================================= */}
          {activeTab === 'hardware' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* 1. Selector Sumber Kamera Utama Bilik Booth */}
              <div className="bg-[#0C1230]/95 pixel-box p-5 border-2 border-[#5CE1E6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#4B57B2]/50">
                  <div>
                    <h3 className="font-pixel-title text-sm text-[#FFD84D] flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#5CE1E6]" />
                      <span>PILIH SUMBER KAMERA UTAMA BILIK BOOTH</span>
                    </h3>
                    <p className="text-[11px] text-[#A9B8FF] mt-1">
                      Kamera yang dipilih di sini akan langsung digunakan secara real-time di layar bilik booth tablet/laptop.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#131947] border border-[#00E599] text-[#00E599] text-[10px] font-pixel-title shrink-0">
                    <span className="w-2 h-2 bg-[#00E599] animate-pulse" />
                    <span>AKTIF: {activeCamera === 'canon' ? 'CANON EOS 1200D' : 'KAMERA LAPTOP'}</span>
                  </div>
                </div>

                {/* Tombol Pilihan Kamera */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opsi 1: Canon DSLR */}
                  <button
                    type="button"
                    onClick={() => handleSelectCamera('canon')}
                    className={`p-4 pixel-box text-left transition-all flex items-start gap-3.5 ${
                      activeCamera === 'canon'
                        ? 'bg-[#160078] border-2 border-[#00E599] shadow-[0_0_15px_rgba(0,229,153,0.3)]'
                        : 'bg-[#131947]/70 border border-[#4B57B2] hover:bg-[#131947]'
                    }`}
                  >
                    <div className="p-2.5 bg-[#0C1230] border border-[#00E599] text-[#00E599] shrink-0">
                      <PixelCameraIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixel-title text-xs text-[#FFD84D]">CANON EOS 1200D DSLR</span>
                        {activeCamera === 'canon' && (
                          <span className="text-[9px] font-pixel-title bg-[#00E599] text-[#050C38] px-1.5 py-0.5 font-bold">
                            ★ AKTIF DI BOOTH
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70">
                        Kamera eksternal profesional via kabel USB. Sensor 18MP APS-C untuk hasil foto jernih resolusi tinggi.
                      </p>
                    </div>
                  </button>

                  {/* Opsi 2: Kamera Laptop HD */}
                  <button
                    type="button"
                    onClick={() => handleSelectCamera('webcam')}
                    className={`p-4 pixel-box text-left transition-all flex items-start gap-3.5 ${
                      activeCamera === 'webcam'
                        ? 'bg-[#160078] border-2 border-[#5CE1E6] shadow-[0_0_15px_rgba(92,225,230,0.3)]'
                        : 'bg-[#131947]/70 border border-[#4B57B2] hover:bg-[#131947]'
                    }`}
                  >
                    <div className="p-2.5 bg-[#0C1230] border border-[#5CE1E6] text-[#5CE1E6] shrink-0">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixel-title text-xs text-[#FFD84D]">KAMERA LAPTOP (HD WEBCAM)</span>
                        {activeCamera === 'webcam' && (
                          <span className="text-[9px] font-pixel-title bg-[#5CE1E6] text-[#050C38] px-1.5 py-0.5 font-bold">
                            ★ AKTIF DI BOOTH
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70">
                        Webcam terintegrasi laptop (WebRTC). Siap langsung berfoto tanpa kabel tambahan atau driver DSLR.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Kartu Rincian Hardware */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Kartu 1: DSLR Canon EOS 1200D */}
                <div className="bg-[#0C1230]/95 pixel-box p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-pixel-title text-[#FFD84D] mb-3">
                      <PixelCameraIcon size={20} />
                      <span className="truncate">CANON EOS 1200D DSLR</span>
                    </div>
                    <div className="p-2.5 bg-[#050C38] border-2 border-[#00E599] text-[#00E599] font-pixel-title text-[10px] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#00E599] animate-pulse" />
                      <span>STATUS: ONLINE (USB)</span>
                    </div>
                    <ul className="text-[11px] text-white/70 space-y-1.5 mb-4">
                      <li>&bull; Mode: RAW + High Quality JPEG</li>
                      <li>&bull; Eksposur: Shutter 1/125s &bull; ISO 400</li>
                      <li>&bull; Lensa: EF-S 18-55mm IS II</li>
                      <li>&bull; Shutter Cable: Sync Otomatis</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#4B57B2]/40">
                    {activeCamera !== 'canon' ? (
                      <button
                        type="button"
                        onClick={() => handleSelectCamera('canon')}
                        className="w-full py-2 pixel-btn bg-[#160078] hover:bg-[#6700A3] text-[#FFD84D] text-[10px] font-pixel-title font-bold"
                      >
                        AKTIFKAN KAMERA INI
                      </button>
                    ) : (
                      <div className="w-full py-1.5 bg-[#00E599]/20 border border-[#00E599] text-[#00E599] text-[10px] font-pixel-title text-center">
                        ✓ KAMERA BOOTH AKTIF
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        retroAudio.playShutterSound();
                        showToast('Test shutter Canon EOS 1200D berhasil!');
                      }}
                      className="w-full py-2 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-pixel-title font-bold"
                    >
                      TEST SHUTTER CANON
                    </button>
                  </div>
                </div>

                {/* Kartu 2: Kamera Laptop (Webcam HD) */}
                <div className="bg-[#0C1230]/95 pixel-box p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-pixel-title text-[#5CE1E6] mb-3">
                      <Laptop className="w-5 h-5 text-[#5CE1E6]" />
                      <span className="truncate">KAMERA LAPTOP (HD WEBCAM)</span>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`p-2.5 bg-[#050C38] border-2 text-[10px] font-pixel-title mb-3 flex items-center gap-2 ${
                        webcamTestActive
                          ? 'border-[#00E599] text-[#00E599]'
                          : adminWebcamError
                          ? 'border-[#FE0168] text-[#FE0168]'
                          : 'border-[#5CE1E6] text-[#5CE1E6]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 ${
                          webcamTestActive
                            ? 'bg-[#00E599]'
                            : adminWebcamError
                            ? 'bg-[#FE0168]'
                            : 'bg-[#5CE1E6]'
                        } animate-pulse`}
                      />
                      <span>
                        {webcamTestActive
                          ? 'STATUS: LIVE STREAM AKTIF'
                          : adminWebcamError
                          ? 'STATUS: KENDALA KONEKSI'
                          : 'STATUS: SIAGA (KLIK UJI FEED)'}
                      </span>
                    </div>

                    <ul className="text-[11px] text-white/70 space-y-1.5 mb-3">
                      <li>
                        &bull; Perangkat:{' '}
                        <span className="text-white font-mono text-[10px]">
                          {webcamDevices.length > 0 ? webcamDevices[0].label : 'Integrated Webcam HD'}
                        </span>
                      </li>
                      <li>&bull; Format: 720p / 1080p 30 FPS RGB</li>
                      <li>&bull; Kompatibilitas: WebRTC MediaDevices</li>
                    </ul>

                    {/* Notifikasi Kendala / Izin Browser Jika Ada */}
                    {adminWebcamError && !webcamTestActive && (
                      <div className="p-3 bg-[#FE0168]/20 border border-[#FE0168] text-[11px] text-white/90 mb-3 font-sans leading-relaxed">
                        <p className="font-pixel-title text-[10px] text-[#FFD84D] mb-1">
                          ⚠️ PANDUAN MENGHUBUNGKAN:
                        </p>
                        {adminWebcamError}
                      </div>
                    )}

                    {/* Pratinjau Mini Live Feed Webcam Admin */}
                    {webcamTestActive && (
                      <div className="relative aspect-video w-full bg-black border-2 border-[#5CE1E6] mb-3 overflow-hidden">
                        <video
                          ref={adminWebcamVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute top-1 left-1 bg-black/80 text-[#00E599] px-1.5 py-0.5 text-[8px] font-pixel-title border border-[#00E599]/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#00E599] animate-pulse" />
                          <span>LIVE TEST OK</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#4B57B2]/40">
                    {activeCamera !== 'webcam' ? (
                      <button
                        type="button"
                        onClick={() => handleSelectCamera('webcam')}
                        className="w-full py-2 pixel-btn bg-[#160078] hover:bg-[#6700A3] text-[#5CE1E6] text-[10px] font-pixel-title font-bold"
                      >
                        AKTIFKAN KAMERA INI
                      </button>
                    ) : (
                      <div className="w-full py-1.5 bg-[#5CE1E6]/20 border border-[#5CE1E6] text-[#5CE1E6] text-[10px] font-pixel-title text-center">
                        ✓ KAMERA BOOTH AKTIF
                      </div>
                    )}

                    {webcamTestActive ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playShutterSound();
                            showToast('Test shutter kamera laptop berhasil!');
                          }}
                          className="py-2 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[10px] font-pixel-title font-bold"
                        >
                          JEPRET TEST
                        </button>
                        <button
                          type="button"
                          onClick={stopAdminWebcamTest}
                          className="py-2 pixel-btn bg-[#131947] hover:bg-[#FE0168] text-white text-[10px] font-pixel-title"
                        >
                          TUTUP FEED
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isAdminWebcamConnecting}
                        onClick={startAdminWebcamTest}
                        className="w-full py-2 pixel-btn bg-[#160078] hover:bg-[#5CE1E6] hover:text-[#050C38] text-white text-[10px] font-pixel-title font-bold flex items-center justify-center gap-1.5"
                      >
                        {isAdminWebcamConnecting ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>MENGHUBUNGKAN...</span>
                          </>
                        ) : (
                          <span>UJI LIVE FEED WEBCAM</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Kartu 3: Printer Epson L300 Series */}
                <div className="bg-[#0C1230]/95 pixel-box p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-pixel-title text-[#FFD84D] mb-3">
                      <PixelPrinterIcon size={20} />
                      <span className="truncate">EPSON L300 SERIES</span>
                    </div>
                    <div className="p-2.5 bg-[#050C38] border-2 border-[#00E599] text-[#00E599] font-pixel-title text-[10px] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#00E599] animate-pulse" />
                      <span>SPOOLER: READY (4R)</span>
                    </div>
                    <ul className="text-[11px] text-white/70 space-y-1.5 mb-4">
                      <li>&bull; Ukuran Kertas: 4R (10 x 15 cm)</li>
                      <li>&bull; Resolusi: 300 DPI Borderless</li>
                      <li>&bull; Tinta: Epson 664 4-Color Original</li>
                      <li>&bull; Tarif per lembar: Rp15.000</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-[#4B57B2]/40">
                    <button
                      type="button"
                      onClick={() => {
                        retroAudio.playPrintSound();
                        showToast('Test feed printer Epson L300 berhasil!');
                      }}
                      className="w-full py-2 pixel-btn bg-[#6700A3] hover:bg-[#7226FF] text-white text-[10px] font-pixel-title font-bold"
                    >
                      TEST CETAK LEMBAR 4R
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Sub-Bar Seimbang di Bawah */}
        <footer className="h-10 bg-[#0C1230]/90 border-t-2 border-[#4B57B2] px-6 flex items-center justify-between text-[10px] text-[#A9B8FF] shrink-0 font-pixel">
          <div className="flex items-center gap-4">
            <span className={activeCamera === 'canon' ? 'text-[#00E599]' : 'text-[#5CE1E6]'}>
              KAMERA BOOTH: {activeCamera === 'canon' ? 'CANON 1200D DSLR (AKTIF)' : 'KAMERA LAPTOP HD (AKTIF)'}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[#5CE1E6]">EPSON L300: READY (4R)</span>
            <span className="text-white/20">|</span>
            <span className="text-[#FFD84D]">SINKRON: {lastRefreshedAt}</span>
          </div>
          <span>POLITEKNIK NEGERI LHOKSEUMAWE &bull; TIK 2026</span>
        </footer>
      </div>
    </div>

    {/* =====================================================================
        3. NOTIFIKASI TOAST FLOATING (INDEPENDEN DI LUAR FLEXBOX CONTAINER)
        ===================================================================== */}
    {toastMessage && (
      <div className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 bg-[#0C1230] border-2 border-[#5CE1E6] text-white text-xs font-pixel-title px-4 py-2.5 max-w-sm w-auto h-auto shadow-[0_4px_25px_rgba(0,0,0,0.85),0_0_15px_rgba(92,225,230,0.5)] animate-fadeIn select-none pointer-events-auto">
        <Sparkles className="w-4 h-4 text-[#FFD84D] shrink-0" />
        <span className="text-[11px] leading-snug text-white font-normal whitespace-normal">{toastMessage}</span>
        <button
          onClick={() => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            setToastMessage(null);
          }}
          className="p-1 text-white/50 hover:text-white shrink-0 ml-auto"
          title="Tutup Notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )}

    {/* Modal Ubah / Tambah Template Persis Gambar 1 */}
    <PixelTemplateEditorModal
      isOpen={isTemplateModalOpen}
      onClose={() => setIsTemplateModalOpen(false)}
      template={editingTemplate}
      onSave={handleTemplateSaved}
    />
  </>
  );
}
