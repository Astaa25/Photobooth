'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  Laptop,
  RotateCcw,
  Check,
  Sparkles,
  Lock,
  KeyRound,
  Maximize,
  Volume2,
  VolumeX,
  Hourglass,
  Radio,
  AlertTriangle,
  X,
  RefreshCw,
  Play,
} from 'lucide-react';
import { retroAudio } from '@/utils/audio';
import {
  getSharedWebcamStream,
  useSimulatorStream,
  bindStreamToVideo,
  stopWebcamStream,
  getHumanWebcamError,
  enumerateVideoDevices,
  type WebcamDeviceInfo,
} from '@/utils/webcamHelper';
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
import { getAndAdvanceTicketNumber, getCurrentTicketNumber } from '@/utils/ticketSequence';

type BoothStep = 'standby' | 'welcome' | 'choosing_design' | 'countdown' | 'flash' | 'review' | 'result';

interface TemplateOption {
  slug: string;
  name: string;
  desc: string;
  photoCount: number;
  previewType: 'strip' | 'grid' | 'trio' | 'duo' | 'single';
  frameImage?: string;
  isCustom?: boolean;
  slots?: { x: number; y: number; width: number; height: number; photo?: number; source_index?: number }[];
  canvasWidth?: number;
  canvasHeight?: number;
}

const TEMPLATES: TemplateOption[] = [
  {
    slug: 'night-city-strip',
    name: 'NIGHT CITY STRIP',
    desc: 'Dua strip 4 foto (gaya photobooth)',
    photoCount: 4,
    previewType: 'strip',
    frameImage: '/assets/frames/night-city-strip.png',
  },
  {
    slug: 'night-city-grid',
    name: 'NIGHT CITY GRID',
    desc: '4 foto dalam kisi 2x2',
    photoCount: 4,
    previewType: 'grid',
    frameImage: '/assets/frames/night-city-grid.png',
  },
  {
    slug: 'moonlight-trio',
    name: 'MOONLIGHT TRIO',
    desc: '3 foto strip dengan bulan sabit',
    photoCount: 3,
    previewType: 'trio',
    frameImage: '/assets/frames/moonlight-trio.png',
  },
  {
    slug: 'duo-skyline',
    name: 'DUO SKYLINE',
    desc: '2 foto bertingkat untuk berdua',
    photoCount: 2,
    previewType: 'duo',
    frameImage: '/assets/frames/duo-skyline.png',
  },
  {
    slug: 'poster-tunggal',
    name: 'POSTER TUNGGAL',
    desc: '1 foto besar bergaya poster expo',
    photoCount: 1,
    previewType: 'single',
    frameImage: '/assets/frames/poster-tunggal.png',
  },
];

export default function BoothKioskPage() {
  const [mounted, setMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Status alur booth: standby (tunggu admin) atau tahap foto
  const [step, setStep] = useState<BoothStep>('standby');
  const [templates, setTemplates] = useState<TemplateOption[]>(TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>(TEMPLATES[0]);
  const [visitorName, setVisitorName] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [countdownNum, setCountdownNum] = useState(5);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [cameraSource, setCameraSource] = useState<'canon' | 'webcam'>('webcam');
  const [webcamStatus, setWebcamStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [webcamErrorMsg, setWebcamErrorMsg] = useState<string | null>(null);
  const latestWebcamSnapshotRef = useRef<string | null>(null);

  // State Modal Uji Live Feed Webcam Laptop
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState(false);
  const [testSnapshotUrl, setTestSnapshotUrl] = useState<string | null>(null);
  const [webcamDevices, setWebcamDevices] = useState<WebcamDeviceInfo[]>([]);
  const [selectedWebcamId, setSelectedWebcamId] = useState<string>('');
  const testVideoRef = useRef<HTMLVideoElement | null>(null);

  // Periksa apakah tablet sudah diaktifkan di sesi browser ini
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('booth_kiosk_unlocked');
      if (saved === 'false') {
        setIsUnlocked(false);
      }
      try {
        const savedCam = localStorage.getItem('photobooth_selected_camera');
        if (savedCam === 'canon' || savedCam === 'webcam') {
          setCameraSource(savedCam);
        } else {
          setCameraSource('webcam');
        }
      } catch {}
    }
  }, []);

  // Uji koneksi webcam laptop di latar belakang menggunakan singleton stream
  useEffect(() => {
    if (cameraSource === 'webcam') {
      getSharedWebcamStream(selectedWebcamId || undefined)
        .then(() => {
          setWebcamStatus('connected');
          setWebcamErrorMsg(null);
          enumerateVideoDevices().then(setWebcamDevices);
        })
        .catch((err) => {
          setWebcamStatus('error');
          setWebcamErrorMsg(getHumanWebcamError(err));
        });
    } else {
      setWebcamStatus('idle');
      setWebcamErrorMsg(null);
    }
  }, [cameraSource, selectedWebcamId]);

  // Ganti sumber kamera dan broadcast ke jendela admin
  const handleSwitchCamera = (source: 'canon' | 'webcam') => {
    setCameraSource(source);
    try {
      localStorage.setItem('photobooth_selected_camera', source);
      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({ type: 'CAMERA_CHANGED', cameraSource: source });
      channel.close();
    } catch {}

    if (source === 'webcam') {
      getSharedWebcamStream(selectedWebcamId || undefined)
        .then(() => {
          setWebcamStatus('connected');
          setWebcamErrorMsg(null);
        })
        .catch((err) => {
          setWebcamStatus('error');
          setWebcamErrorMsg(getHumanWebcamError(err));
        });
    }
  };

  // Buka modal uji kamera dan pasangkan feed langsung jika mode webcam
  const handleOpenWebcamTest = async () => {
    setIsWebcamModalOpen(true);
    if (cameraSource === 'webcam') {
      try {
        const res = await getSharedWebcamStream(selectedWebcamId || undefined);
        setWebcamStatus('connected');
        setWebcamErrorMsg(null);
        if (testVideoRef.current) {
          await bindStreamToVideo(testVideoRef.current, res.stream);
        }
        const devs = await enumerateVideoDevices();
        setWebcamDevices(devs);
      } catch (err: any) {
        console.warn('Status koneksi webcam saat uji coba:', err?.name || err?.message || err);
        setWebcamStatus('error');
        setWebcamErrorMsg(getHumanWebcamError(err));
      }
    }
  };

  // Aktifkan simulator webcam virtual langsung ke video modal
  const handleUseSimulatorInModal = async () => {
    try {
      const sim = useSimulatorStream();
      setSelectedWebcamId('simulator-virtual-webcam');
      setWebcamStatus('connected');
      setWebcamErrorMsg(null);
      if (testVideoRef.current) {
        await bindStreamToVideo(testVideoRef.current, sim.stream);
      }
      const devs = await enumerateVideoDevices().catch(() => []);
      setWebcamDevices(devs);
    } catch (err: any) {
      console.warn('Simulator error:', err);
    }
  };

  // Beralih langsung ke mode simulator 30 FPS
  const handleSwitchToSimulator = async () => {
    setCameraSource('webcam');
    setSelectedWebcamId('simulator-virtual-webcam');
    try {
      localStorage.setItem('photobooth_selected_camera', 'webcam');
      localStorage.setItem('photobooth_selected_webcam_id', 'simulator-virtual-webcam');
      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({ type: 'CAMERA_CHANGED', cameraSource: 'webcam' });
      channel.close();
    } catch {}

    try {
      const sim = useSimulatorStream();
      setWebcamStatus('connected');
      setWebcamErrorMsg(null);
      if (testVideoRef.current) {
        await bindStreamToVideo(testVideoRef.current, sim.stream);
      }
    } catch (err: any) {
      console.warn('Simulator error:', err);
    }
  };

  // Jepret foto uji coba di modal
  const handleCaptureTestSnapshot = () => {
    if (testVideoRef.current && testVideoRef.current.videoWidth > 0) {
      const video = testVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg', 0.9);
        setTestSnapshotUrl(url);
        if (soundEnabled) retroAudio.playShutterSound();
      }
    }
  };

  // Mulai sesi foto mandiri langsung dari tablet (menggunakan nomor tiket berurut tersinkronisasi)
  const handleQuickDemoStart = () => {
    const nextTicket = getAndAdvanceTicketNumber();
    setVisitorName(`PENGUNJUNG ${nextTicket}`);
    setTicketNumber(nextTicket);
    setCapturedPhotos([]);
    setStep('choosing_design');
    if (soundEnabled) retroAudio.playSuccessChime();
  };

  // Sinkronisasi Sesi Aktif & Desain Bingkai dengan Admin Dashboard secara Real-Time
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Muat template kustom dari server /api/frames atau fallback localStorage
    const loadTemplates = async () => {
      try {
        const res = await fetch('/api/frames');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTemplates(json.data);
          return;
        }
      } catch {}

      try {
        const raw = localStorage.getItem('photobooth_custom_templates');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTemplates([...TEMPLATES, ...parsed]);
            return;
          }
        }
      } catch {}
      setTemplates(TEMPLATES);
    };
    loadTemplates();

    // 1. Periksa sesi aktif awal di localStorage
    const checkActiveSession = () => {
      try {
        const raw = localStorage.getItem('photobooth_active_session');
        if (raw) {
          const session = JSON.parse(raw);
          if (session && session.visitorName && session.ticketNumber) {
            setVisitorName(session.visitorName);
            setTicketNumber(session.ticketNumber);
            if (step === 'standby') {
              setStep('welcome');
              if (soundEnabled) retroAudio.playSuccessChime();
            }
          }
        }
        const savedCam = localStorage.getItem('photobooth_selected_camera');
        if (savedCam === 'canon' || savedCam === 'webcam') {
          setCameraSource(savedCam);
        }
      } catch {}
    };

    checkActiveSession();

    // 2. BroadcastChannel untuk komunikasi tab/jendela instan
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('photobooth_session_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'START_SESSION') {
          setVisitorName(event.data.visitorName);
          setTicketNumber(event.data.ticketNumber);
          setCapturedPhotos([]);
          setStep('welcome');
          if (soundEnabled) retroAudio.playSuccessChime();
        } else if (event.data?.type === 'RESET_TO_STANDBY') {
          setStep('standby');
          setVisitorName('');
          setTicketNumber('');
          setCapturedPhotos([]);
        } else if (event.data?.type === 'TEMPLATES_UPDATED') {
          loadTemplates();
        } else if (
          event.data?.type === 'CAMERA_CHANGED' &&
          (event.data.cameraSource === 'canon' || event.data.cameraSource === 'webcam')
        ) {
          setCameraSource(event.data.cameraSource);
        }
      };
    } catch {}

    // 3. Storage event listener (jika antar-tab di browser yang sama)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'photobooth_active_session') {
        if (e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            setVisitorName(data.visitorName);
            setTicketNumber(data.ticketNumber);
            setCapturedPhotos([]);
            setStep('welcome');
            if (soundEnabled) retroAudio.playSuccessChime();
          } catch {}
        } else {
          setStep('standby');
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Polling ringan setiap 1 detik sebagai cadangan
    const pollInterval = setInterval(checkActiveSession, 1000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, [step, soundEnabled]);

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
      // Jika mode kamera laptop aktif tapi belum terhubung, tahan countdown agar tidak memotret layar kosong
      if (cameraSource === 'webcam' && webcamStatus !== 'connected') {
        return;
      }

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

          // 1. KASUS KHUSUS RETAKE SINGLE FOTO (HANYA GANTI 1 FOTO YANG DIULANG)
          if (retakeIndex !== null) {
            const newPalette = [
              '#3B82F6', '#EC4899', '#10B981', '#F59E0B',
              '#8B5CF6', '#EF4444', '#06B6D4', '#E11D48',
              '#14B8A6', '#F97316', '#6366F1', '#84CC16',
            ];
            const oldColor = capturedPhotos[retakeIndex];
            const pool = newPalette.filter((c) => c !== oldColor);
            const fallbackColor = pool[Math.floor(Math.random() * pool.length)] || newPalette[0];
            const photoData =
              latestWebcamSnapshotRef.current || fallbackColor;
            latestWebcamSnapshotRef.current = null;

            const updated = [...capturedPhotos];
            updated[retakeIndex] = photoData;

            // Pastikan panjang array tetap pas sejumlah template photoCount
            setCapturedPhotos(updated.slice(0, selectedTemplate.photoCount));
            setRetakeIndex(null);
            setStep('review');
            if (soundEnabled) retroAudio.playSuccessChime();
            return;
          }

          // 2. KASUS NORMAL (JEPRET BERURUTAN DARI 0 SAMPAI photoCount)
          const colors = ['#1D4ED8', '#BE185D', '#047857', '#B45309', '#7C3AED', '#DB2777'];
          const fallbackColor = colors[currentPhotoIdx % colors.length];
          const photoData =
            latestWebcamSnapshotRef.current || fallbackColor;
          latestWebcamSnapshotRef.current = null;

          const newPhotos = [...capturedPhotos, photoData];
          setCapturedPhotos(newPhotos.slice(0, selectedTemplate.photoCount));

          if (currentPhotoIdx + 1 < selectedTemplate.photoCount) {
            setCurrentPhotoIdx(currentPhotoIdx + 1);
            setCountdownNum(5);
            setStep('countdown');
          } else {
            setStep('review');
            if (soundEnabled) retroAudio.playSuccessChime();
          }
        }, 360);
      }
    }
    return () => clearTimeout(timer);
  }, [step, countdownNum, currentPhotoIdx, capturedPhotos, selectedTemplate.photoCount, soundEnabled, retakeIndex, cameraSource, webcamStatus]);

  const startCapture = () => {
    if (soundEnabled) retroAudio.playButtonClick();
    setRetakeIndex(null);
    setCapturedPhotos([]);
    setCurrentPhotoIdx(0);
    setCountdownNum(5);
    setStep('countdown');
  };

  const retakeSingle = (idx: number) => {
    if (soundEnabled) retroAudio.playButtonClick();
    setRetakeIndex(idx);
    setCurrentPhotoIdx(idx);
    setCountdownNum(5);
    setStep('countdown');
  };

  // Saat pengunjung menekan tombol selesai di akhir sesi foto
  const handleFinishSession = () => {
    if (soundEnabled) retroAudio.playButtonClick();

    // Beritahukan admin bahwa sesi ini telah selesai
    try {
      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({ type: 'SESSION_COMPLETED', ticketNumber, visitorName });
      channel.close();
    } catch {}

    // Simpan ke galeri publik lokal agar langsung muncul di halaman galeri
    try {
      const savedGalleries = JSON.parse(localStorage.getItem('photobooth_completed_sessions') || '[]');
      const newEntry = {
        id: `sess-${Date.now()}`,
        number: ticketNumber || '#001',
        nickname: visitorName || 'Pengunjung',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        photosCount: capturedPhotos.length || 4,
        template: selectedTemplate.name,
      };
      localStorage.setItem('photobooth_completed_sessions', JSON.stringify([newEntry, ...savedGalleries]));
    } catch {}

    // Hapus sesi aktif dan kembalikan booth ke status STANDBY (tunggu admin set sesi berikutnya)
    localStorage.removeItem('photobooth_active_session');
    setStep('standby');
    setVisitorName('');
    setTicketNumber('');
    setCapturedPhotos([]);
  };

  // Mini preview layout pixel untuk kartu template (menampilkan gambar frame asli PNG jika ada)
  const renderTemplateMiniPreview = (tpl: TemplateOption) => {
    if (tpl.frameImage) {
      return (
        <div className="w-12 h-16 bg-black/80 border-2 border-[#5CE1E6] overflow-hidden flex items-center justify-center relative shadow-sm shrink-0">
          <img
            src={tpl.frameImage}
            alt={tpl.name}
            className="w-full h-full object-contain pixel-art"
          />
        </div>
      );
    }

    switch (tpl.previewType) {
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

  // Cegah hydration mismatch sebelum client ter-mount
  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-[#050C38] flex items-center justify-center text-white font-pixel" suppressHydrationWarning>
        <div className="flex items-center gap-2 text-xs text-[#FFD84D]">
          <span className="w-2.5 h-2.5 bg-[#00E599] animate-pulse" />
          <span>MEMUAT BILIK PHOTOBOOTH...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1. TAMPILAN TERKUNCI (Jika Dibuka Tanpa PIN Operator)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="w-screen h-screen bg-[#050C38] text-white flex flex-col items-center justify-center p-6 relative select-none overflow-hidden font-pixel" suppressHydrationWarning>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-50 animate-twinkle pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-30 pointer-events-none" />

        <div className="absolute bottom-0 left-8 z-0 hidden sm:block">
          <PixelStreetLamp height={110} />
        </div>
        <div className="absolute bottom-0 right-8 z-0 hidden sm:block">
          <PixelVendingMachine height={100} />
        </div>

        <div className="w-full max-w-sm bg-[#0C1230]/90 pixel-box p-8 text-center relative z-10 backdrop-blur" suppressHydrationWarning>
          <div className="w-14 h-14 pixel-box-cyber bg-[#E02F75] text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <h1 className="font-pixel-title text-sm font-bold text-[#FFD84D] mb-2 leading-relaxed">
            KIOS BOOTH TERKUNCI
          </h1>
          <p className="text-xs text-white/70 mb-6 leading-relaxed">
            Layar ini khusus untuk tablet di bilik foto. Masukkan PIN operator untuk mengaktifkan mode aplikasi booth.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4" suppressHydrationWarning autoComplete="off">
            <div className="relative" suppressHydrationWarning>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="PIN OPERATOR"
                autoComplete="new-password"
                data-1p-ignore="true"
                data-lpignore="true"
                suppressHydrationWarning
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
              suppressHydrationWarning
              className="w-full h-12 pixel-btn bg-[#E02F75] text-white text-xs font-bold hover:bg-[#FF5A57]"
            >
              BUKA APLIKASI BOOTH
            </button>

            <button
              type="button"
              onClick={() => {
                setIsUnlocked(true);
                sessionStorage.setItem('booth_kiosk_unlocked', 'true');
                if (soundEnabled) retroAudio.playSuccessChime();
              }}
              suppressHydrationWarning
              className="w-full h-10 pixel-btn bg-[#00E599] text-[#050C38] text-xs font-bold hover:bg-[#5CE1E6] mt-2 active:scale-95"
            >
              🚀 BUKA KIOS LANGSUNG (PIN: 1234)
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
  // 2. TAMPILAN APLIKASI BOOTH (STANDBY / SESI FOTO) - FLUTTER APK TABLET STYLE
  // =========================================================================
  return (
    <div className="relative w-screen h-[100dvh] bg-[#050C38] text-white flex flex-col justify-between overflow-hidden select-none font-pixel touch-manipulation">
      {/* 1. Latar Belakang Gradien Langit Malam Metropolitan */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />

      {/* 2. Bintang Berkelip Pixel */}
      <div className="fixed inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-60 animate-twinkle pointer-events-none" />

      {/* 3. Bintang Silang 4 Sudut */}
      <div className="absolute top-12 left-16 pointer-events-none z-0">
        <PixelCrossStar size={18} />
      </div>
      <div className="absolute top-28 right-36 pointer-events-none z-0">
        <PixelCrossStar size={14} color="#5CE1E6" />
      </div>

      {/* 4. Bulan Sabit Pixel */}
      <div className="absolute top-6 right-10 w-16 h-16 pointer-events-none pixel-art z-0 opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
        <Image src="/assets/pixel/moon.png" alt="Moon" width={64} height={64} className="pixel-art" />
      </div>

      {/* 5. Awan Mengambang */}
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

      {/* 7. Skyline Gedung Kota Malam */}
      <div className="fixed bottom-0 left-0 right-0 h-48 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-45 pointer-events-none z-0" />

      {/* 8. Elemen Foreground Jalan & Taman dari Poster */}
      <div className="fixed bottom-6 left-4 z-0 hidden lg:flex flex-col items-center pointer-events-none">
        <PixelStreetLamp height={130} />
        <PixelBushes width={90} className="-mt-3" />
      </div>

      <div className="fixed bottom-4 left-32 z-0 hidden xl:block pointer-events-none opacity-85">
        <PixelCar width={130} />
      </div>

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-0 hidden 2xl:block pointer-events-none opacity-75">
        <PixelBench width={120} />
      </div>

      <div className="fixed bottom-4 right-4 z-0 hidden lg:flex items-end gap-3 pointer-events-none">
        <PixelVendingMachine height={110} />
        <div className="flex flex-col items-center">
          <PixelStreetLamp height={130} />
          <PixelBushes width={80} className="-mt-3" />
        </div>
      </div>

      {/* Flash Effect Layer */}
      {isFlashActive && (
        <div className="fixed inset-0 bg-[#FFD84D] opacity-95 z-50 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Header Aplikasi Booth Kios */}
      <header className="px-6 py-4 flex items-center justify-between border-b-4 border-[#4B57B2] z-30 bg-[#0C1230]/90 backdrop-blur sticky top-0">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 ${step === 'standby' ? 'bg-[#FFD84D]' : 'bg-[#00E599]'} animate-pulse shadow-[0_0_8px_currentColor]`} />
          <span className="font-pixel-title text-xs text-[#A9B8FF] tracking-wider">
            EXPO WISUDA TIK 2026 &bull; PHOTOBOOTH APP
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {ticketNumber ? (
            <span className="bg-[#131947] px-3 py-1 border-2 border-[#4B57B2] text-[#FFD84D] font-pixel-title text-xs">
              TIKET: {ticketNumber}
            </span>
          ) : (
            <span className="bg-[#131947] px-3 py-1 border-2 border-[#4B57B2] text-[#5CE1E6] font-pixel-title text-xs">
              STANDBY
            </span>
          )}

          {/* Tombol Opsi Sumber Kamera (Canon DSLR vs Laptop Webcam) & Uji */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenWebcamTest}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#131947] hover:bg-[#160078] border-2 text-[11px] font-pixel-title transition-all active:scale-95 ${
                cameraSource === 'webcam' && webcamStatus === 'error'
                  ? 'border-[#FE0168] text-[#FE0168]'
                  : cameraSource === 'webcam' && webcamStatus === 'connected'
                  ? 'border-[#00E599] text-[#00E599]'
                  : 'border-[#4B57B2] text-[#5CE1E6]'
              }`}
              title="Pengaturan Sumber Kamera (Canon DSLR / Laptop Webcam / Simulator)"
            >
              {cameraSource === 'webcam' ? (
                <>
                  <Laptop className="w-3.5 h-3.5" />
                  <span>
                    KAMERA: {selectedWebcamId === 'simulator-virtual-webcam' ? 'SIMULATOR' : 'LAPTOP'}{' '}
                    {webcamStatus === 'connected'
                      ? '● SIAP'
                      : webcamStatus === 'error'
                      ? '● KENDALA'
                      : '● CEK'}
                  </span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-[#00E599]" />
                  <span className="text-[#00E599]">KAMERA: CANON 1200D</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenWebcamTest}
              className="px-2.5 py-1.5 bg-[#6700A3] hover:bg-[#FE0168] border-2 border-[#5CE1E6] text-white text-[10px] font-pixel-title active:scale-95 flex items-center gap-1"
              title="Buka Pengaturan & Uji Feed Kamera"
            >
              <span>UJI</span>
            </button>
          </div>

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

      {/* Konten Utama Interaktif Booth (Bisa Di-scroll Secara Mulus) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-5xl mx-auto p-4 sm:p-6 z-20 relative flex flex-col items-center justify-center my-auto">
        {/* ===================================================================
            STEP 0: STANDBY (MOHON TUNGGU SEBENTAR / PILIH KAMERA)
            =================================================================== */}
        {step === 'standby' && (
          <div className="animate-fadeIn max-w-xl w-full bg-[#0C1230]/95 pixel-box p-6 sm:p-8 text-center backdrop-blur shadow-[0_0_24px_rgba(5,12,56,0.9)] my-auto">
            <div className="w-14 h-14 mx-auto pixel-box-cyber bg-[#160078] text-[#FFD84D] flex items-center justify-center mb-3">
              <Hourglass className="w-7 h-7 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <PixelCrossStar size={12} />
              <h1 className="font-pixel-title text-base sm:text-xl text-[#FFD84D] tracking-wider leading-relaxed">
                BILIK PHOTOBOOTH TABLET KIOSK
              </h1>
              <PixelCrossStar size={12} />
            </div>

            <h2 className="font-pixel-title text-xs text-[#5CE1E6] mb-6">
              EXPO WISUDA POLITEKNIK JURUSAN TIK 2026
            </h2>

            {/* Tombol Aksi Kios Standby */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleQuickDemoStart}
                className="w-full h-13 px-6 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-xs font-pixel-title font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#6700A3] active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#FFD84D]" />
                <span>MULAI SESI FOTO ({getCurrentTicketNumber()})</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWebcamTest}
                className="w-full h-11 px-6 pixel-btn bg-[#160078] hover:bg-[#1E2768] text-[#5CE1E6] text-xs font-pixel-title font-bold flex items-center justify-center gap-2 border-2 border-[#5CE1E6]/50 shadow-[3px_3px_0_0_#050C38] active:scale-95"
              >
                <Camera className="w-4 h-4 text-[#FFD84D]" />
                <span>🎥 UJI COBA KAMERA / TEST TRIAL</span>
              </button>

              <div className="p-2 bg-[#050C38]/80 border border-[#4B57B2]/40 text-[10px] text-[#A9B8FF] font-pixel-title flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-[#FFD84D] animate-pulse" />
                <span>MENUNGGU PANGGILAN ANTREAN DARI OPERATOR ADMIN</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 1: WELCOME (GILIRAN KAMU SEKARANG - SETELAH ADMIN KLIK MULAI SESI)
            =================================================================== */}
        {step === 'welcome' && (
          <div className="animate-fadeIn max-w-2xl bg-[#0C1230]/95 pixel-box p-8 backdrop-blur text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <PixelCrossStar size={12} />
              <span className="font-pixel-title text-xs text-[#FFD84D] tracking-wider">
                ★ GILIRAN KAMU SEKARANG ★
              </span>
              <PixelCrossStar size={12} />
            </div>

            <h1 className="font-pixel-title text-2xl sm:text-4xl text-white mb-4 leading-relaxed">
              HALO, {visitorName.toUpperCase()}!
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

        {/* ===================================================================
            STEP 2: PILIH DESAIN BINGKAI
            =================================================================== */}
        {step === 'choosing_design' && (
          <div className="w-full animate-fadeIn bg-[#0C1230]/90 pixel-box p-6 sm:p-8 backdrop-blur text-center">
            <h2 className="font-pixel-title text-base sm:text-lg text-[#FFD84D] mb-1">
              PILIH DESAIN BINGKAI FOTO 4R
            </h2>
            <p className="text-xs text-[#A9B8FF] mb-6">
              Pilih tata letak bingkai cetak favoritmu (kompatibel kertas foto 4R 1200x1800).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-h-[58vh] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.slug}
                  onClick={() => {
                    if (soundEnabled) retroAudio.playButtonClick();
                    setSelectedTemplate(tpl);
                  }}
                  className={`p-3 text-left border-4 transition-all flex items-start gap-3 pixel-art relative ${
                    selectedTemplate.slug === tpl.slug
                      ? 'border-[#E02F75] bg-[#6700A3]/60 shadow-[0_0_12px_#E02F75]'
                      : 'border-[#4B57B2] bg-[#131947]/70 hover:border-white/50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {renderTemplateMiniPreview(tpl)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-1">
                      <span className="font-pixel-title text-[11px] text-[#FFD84D] leading-tight truncate">
                        {tpl.name}
                      </span>
                      {tpl.isCustom && (
                        <span className="text-[7px] font-pixel-title bg-[#E02F75] px-1 py-0.5 text-white border border-[#FFD84D] shrink-0">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-pixel-title bg-black/60 px-1.5 py-0.5 text-[#5CE1E6] border border-white/20 inline-block mb-1">
                      {tpl.photoCount}X JEPRET
                    </span>
                    <p className="text-[11px] text-white/70 leading-snug line-clamp-2">{tpl.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Banner Peringatan Akses Kamera Laptop Jika Ditolak/Belum Aktif */}
            {cameraSource === 'webcam' && webcamStatus === 'error' && (
              <div className="w-full max-w-xl mx-auto mb-4 p-3.5 bg-[#FE0168]/20 border-2 border-[#FE0168] text-white text-xs font-pixel-title flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#FFD84D] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#FFD84D] block font-bold mb-0.5">KAMERA LAPTOP BUTUH AKSES:</span>
                    <span className="text-[11px] font-normal font-sans text-white/90 leading-tight block">
                      {webcamErrorMsg || 'Klik ikon gembok di sebelah kiri localhost:3000 -> Izinkan Kamera.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenWebcamTest}
                  className="px-3 py-1.5 bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] text-[10px] font-pixel-title shrink-0 font-bold active:scale-95"
                >
                  HUBUNGKAN &amp; UJI
                </button>
              </div>
            )}

            <button
              onClick={startCapture}
              className="h-14 px-8 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-xs font-bold flex items-center justify-center gap-2 mx-auto"
            >
              <Camera className="w-4 h-4" />
              <span>MULAI SESI FOTO ({selectedTemplate.photoCount}X JEPRET)</span>
            </button>

            {/* Indikator Sumber Kamera Aktif */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[#A9B8FF] font-pixel-title">
              <span>SUMBER KAMERA:</span>
              <span className={cameraSource === 'webcam' ? 'text-[#5CE1E6]' : 'text-[#00E599]'}>
                {cameraSource === 'webcam'
                  ? `KAMERA LAPTOP ${webcamStatus === 'connected' ? '● SIAP' : webcamStatus === 'error' ? '● BUTUH IZIN' : '● MEMERIKSA'}`
                  : 'CANON EOS 1200D DSLR ● SIAP'}
              </span>
              <button
                type="button"
                onClick={() => handleSwitchCamera(cameraSource === 'canon' ? 'webcam' : 'canon')}
                className="underline text-[#FFD84D] hover:text-white ml-1"
              >
                (GANTI)
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 3: HITUNG MUNDUR & VIEWFINDER KAMERA PIXEL REALISTIS
            =================================================================== */}
        {(step === 'countdown' || step === 'flash') && (
          <PixelCameraViewfinder
            countdownNum={countdownNum}
            currentPhotoIdx={currentPhotoIdx}
            totalPhotos={retakeIndex !== null ? 1 : selectedTemplate.photoCount}
            isRetake={retakeIndex !== null}
            cameraName="CANON 1200D"
            cameraSource={cameraSource}
            selectedWebcamId={selectedWebcamId}
            onSwitchCamera={handleSwitchCamera}
            onSnapshotCapture={(dataUrl) => {
              latestWebcamSnapshotRef.current = dataUrl;
            }}
          />
        )}

        {/* ===================================================================
            STEP 4: TINJAU & RETAKE PER FOTO
            =================================================================== */}
        {step === 'review' && (
          <div className="w-full animate-fadeIn bg-[#0C1230]/90 pixel-box p-6 sm:p-8 backdrop-blur text-center">
            <h2 className="font-pixel-title text-base sm:text-lg text-[#FFD84D] mb-1">
              TINJAU HASIL FOTO ANDA
            </h2>
            <p className="text-xs text-[#A9B8FF] mb-6">
              Puas dengan hasilnya? Anda dapat mengulang foto tertentu (hanya 1 jepretan ulang untuk mengganti pose tersebut).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              {capturedPhotos.slice(0, selectedTemplate.photoCount).map((color, idx) => {
                const isImg = color.startsWith('data:image') || color.startsWith('/') || color.startsWith('http');
                return (
                  <div key={idx} className="relative group">
                    <div
                      style={{ backgroundColor: isImg ? '#000' : color }}
                      className="w-36 h-28 border-4 border-[#4B57B2] overflow-hidden flex flex-col items-center justify-center font-pixel-title text-xs text-white shadow-[4px_4px_0_0_#050C38] relative"
                    >
                      {isImg ? (
                        <img src={color} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <span>FOTO #{idx + 1}</span>
                      )}
                    </div>
                    <button
                      onClick={() => retakeSingle(idx)}
                      className="mt-2 w-full py-1.5 pixel-btn bg-[#6700A3] hover:bg-[#E02F75] text-[10px] text-white font-bold flex items-center justify-center gap-1 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>ULANGI</span>
                    </button>
                  </div>
                );
              })}
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

        {/* ===================================================================
            STEP 5: HASIL SIAP, QR CODE & DISPENSER STRIP (DAPAT DI-SCROLL LANCAR)
            =================================================================== */}
        {step === 'result' && (
          <PixelPhotoStripDispenser
            visitorName={visitorName || 'Diana'}
            ticketNumber={ticketNumber || '#001'}
            photos={
              capturedPhotos.slice(0, selectedTemplate.photoCount).length > 0
                ? capturedPhotos.slice(0, selectedTemplate.photoCount)
                : ['#1D4ED8', '#BE185D', '#047857', '#B45309']
            }
            templateName={selectedTemplate.name}
            frameImage={selectedTemplate.frameImage}
            slots={selectedTemplate.slots}
            canvasWidth={selectedTemplate.canvasWidth}
            canvasHeight={selectedTemplate.canvasHeight}
            onReset={handleFinishSession}
          />
        )}
      </main>

      {/* Footer Kios */}
      <footer className="px-6 py-2.5 border-t-4 border-[#4B57B2] flex items-center justify-between text-[11px] text-[#A9B8FF] z-30 bg-[#0C1230]/90 shrink-0">
        <span>EXPO WISUDA JURUSAN TIK 2026 &bull; PHOTOBOOTH SYSTEM</span>
        <span className="text-[#FFD84D]">CANON 1200D &bull; EPSON L300 4R READY</span>
      </footer>

      {/* Modal Uji & Pengaturan Kamera */}
      {isWebcamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-pixel">
          <div className="relative w-full max-w-lg bg-[#0C1230] border-4 border-[#5CE1E6] p-5 shadow-[8px_8px_0_0_#050C38] text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#4B57B2]">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-[#5CE1E6]" />
                <h3 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D]">
                  PENGATURAN & UJI KAMERA BOOTH
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWebcamModalOpen(false)}
                className="p-1 text-white/60 hover:text-[#FE0168]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pilihan Sumber Kamera (Kamera Laptop / Canon 1200D / Simulator 30 FPS) */}
            <div className="mb-3">
              <label className="block text-[10px] font-pixel-title text-[#FFD84D] mb-1.5">
                PILIH SUMBER KAMERA:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSwitchCamera('webcam');
                    getSharedWebcamStream(selectedWebcamId !== 'simulator-virtual-webcam' ? selectedWebcamId : undefined, true)
                      .then((res) => {
                        setWebcamStatus('connected');
                        setWebcamErrorMsg(null);
                        if (testVideoRef.current) bindStreamToVideo(testVideoRef.current, res.stream);
                        enumerateVideoDevices().then(setWebcamDevices);
                      })
                      .catch((err) => {
                        setWebcamStatus('error');
                        setWebcamErrorMsg(getHumanWebcamError(err));
                      });
                  }}
                  className={`p-2 pixel-btn text-center flex flex-col items-center justify-center gap-1 text-[10px] font-pixel-title transition-all active:scale-95 ${
                    cameraSource === 'webcam' && selectedWebcamId !== 'simulator-virtual-webcam'
                      ? 'bg-[#5CE1E6] text-[#050C38] border-2 border-white font-bold shadow'
                      : 'bg-[#131947] text-white/70 hover:bg-[#160078]'
                  }`}
                >
                  <Laptop className="w-4 h-4 shrink-0" />
                  <span className="truncate">KAMERA LAPTOP</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchCamera('canon')}
                  className={`p-2 pixel-btn text-center flex flex-col items-center justify-center gap-1 text-[10px] font-pixel-title transition-all active:scale-95 ${
                    cameraSource === 'canon'
                      ? 'bg-[#00E599] text-[#050C38] border-2 border-white font-bold shadow'
                      : 'bg-[#131947] text-white/70 hover:bg-[#160078]'
                  }`}
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span className="truncate">CANON 1200D</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSwitchToSimulator();
                    if (testVideoRef.current) {
                      const sim = useSimulatorStream();
                      bindStreamToVideo(testVideoRef.current, sim.stream);
                    }
                  }}
                  className={`p-2 pixel-btn text-center flex flex-col items-center justify-center gap-1 text-[10px] font-pixel-title transition-all active:scale-95 ${
                    cameraSource === 'webcam' && selectedWebcamId === 'simulator-virtual-webcam'
                      ? 'bg-[#FFD84D] text-[#050C38] border-2 border-white font-bold shadow'
                      : 'bg-[#131947] text-white/70 hover:bg-[#160078]'
                  }`}
                  title="Gunakan simulasi live feed virtual jika kamera fisik bermasalah"
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-[#FE0168]" />
                  <span className="truncate">SIMULATOR 30FPS</span>
                </button>
              </div>
            </div>

            {/* KONTEN JIKA MODE WEBCAM / SIMULATOR AKTIF */}
            {cameraSource === 'webcam' ? (
              <>
                {/* Selector Device jika ada lebih dari 1 kamera */}
                {webcamDevices.length > 1 && (
                  <div className="mb-3 bg-[#050C38] p-2 border border-[#4B57B2]/60">
                    <label className="block text-[9px] font-pixel-title text-[#A9B8FF] mb-1">
                      PILIH PERANGKAT WEBCAM:
                    </label>
                    <select
                      value={selectedWebcamId}
                      onChange={(e) => {
                        const newDevId = e.target.value;
                        setSelectedWebcamId(newDevId);
                        if (newDevId === 'simulator-virtual-webcam') {
                          handleSwitchToSimulator();
                          if (testVideoRef.current) {
                            const sim = useSimulatorStream();
                            bindStreamToVideo(testVideoRef.current, sim.stream);
                          }
                        } else {
                          getSharedWebcamStream(newDevId, true)
                            .then((res) => {
                              setWebcamStatus('connected');
                              setWebcamErrorMsg(null);
                              if (testVideoRef.current) bindStreamToVideo(testVideoRef.current, res.stream);
                            })
                            .catch((err) => {
                              setWebcamStatus('error');
                              setWebcamErrorMsg(getHumanWebcamError(err));
                            });
                        }
                      }}
                      className="w-full bg-[#131947] border border-[#5CE1E6] text-xs text-white p-1.5 outline-none font-pixel"
                    >
                      {webcamDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                      <option value="simulator-virtual-webcam">🎭 Simulator Live 30 FPS</option>
                    </select>
                  </div>
                )}

                {/* Video Preview */}
                <div className="relative aspect-[4/3] w-full bg-black border-2 border-[#4B57B2] overflow-hidden mb-3">
                  <video
                    ref={testVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />

                  {webcamStatus === 'connected' && (
                    <div className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 border border-[#00E599] text-[#00E599] text-[9px] font-pixel-title flex items-center gap-1 z-10">
                      <span className="w-1.5 h-1.5 bg-[#00E599] animate-pulse" />
                      <span>{selectedWebcamId === 'simulator-virtual-webcam' ? 'SIMULATOR 30 FPS AKTIF' : 'LIVE KAMERA AKTIF'}</span>
                    </div>
                  )}

                  {/* Overlay Error Izin Ditolak Browser */}
                  {webcamStatus === 'error' && (
                    <div className="absolute inset-0 bg-black/95 p-4 flex flex-col items-center justify-center text-center z-20">
                      <div className="w-10 h-10 bg-[#FE0168]/20 border border-[#FE0168] text-[#FE0168] flex items-center justify-center mb-2">
                        <AlertTriangle className="w-5 h-5 animate-bounce" />
                      </div>
                      <h4 className="text-xs font-pixel-title text-[#FFD84D] mb-1">
                        IZIN KAMERA DIBLOKIR BROWSER
                      </h4>
                      <p className="text-[10px] text-white/80 max-w-sm mb-3 leading-relaxed font-sans bg-[#131947]/90 p-2 border border-[#4B57B2] text-center">
                        {webcamErrorMsg || 'Browser belum mengizinkan akses ke webcam laptop.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="px-3 py-1.5 pixel-btn bg-[#FFD84D] hover:bg-[#FFE57F] text-[#050C38] text-[10px] font-pixel-title font-bold flex items-center gap-1 active:scale-95 shadow"
                        >
                          🔄 MUAT ULANG (F5)
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenWebcamTest}
                          className="px-3 py-1.5 pixel-btn bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] text-[10px] font-pixel-title font-bold flex items-center gap-1 active:scale-95"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>COBA HUBUNGKAN LAGI</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleUseSimulatorInModal}
                          className="px-3 py-1.5 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-[10px] font-pixel-title font-bold flex items-center gap-1 shadow active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#FFD84D]" />
                          <span>🎭 GUNAKAN SIMULATOR</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {testSnapshotUrl && (
                    <div className="absolute bottom-2 right-2 w-24 aspect-[4/3] border-2 border-[#FFD84D] shadow-lg overflow-hidden bg-black z-10">
                      <img src={testSnapshotUrl} alt="Hasil Snapshot" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureTestSnapshot}
                    className="flex-1 py-2.5 pixel-btn bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] text-xs font-pixel-title font-bold flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>JEPRET FOTO CONTOH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWebcamModalOpen(false)}
                    className="px-4 py-2.5 pixel-btn bg-[#131947] hover:bg-[#160078] text-[#FFD84D] text-xs font-pixel-title border border-[#4B57B2] active:scale-95"
                  >
                    GUNAKAN INI
                  </button>
                </div>
              </>
            ) : (
              /* KONTEN JIKA MODE CANON 1200D AKTIF */
              <div className="bg-[#050C38] border-2 border-[#00E599] p-5 text-center mb-3">
                <div className="w-12 h-12 bg-[#00E599]/20 border border-[#00E599] text-[#00E599] flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-pixel-title text-xs text-[#00E599] mb-1">
                  KAMERA CANON EOS 1200D AKTIF
                </h4>
                <p className="text-[11px] text-white/80 max-w-sm mx-auto mb-4 font-sans leading-relaxed">
                  Bilik foto terhubung langsung ke kamera Canon DSLR via driver backend server. Foto akan diambil menggunakan sensor Canon saat sesi berlangsung.
                </p>
                <button
                  type="button"
                  onClick={() => setIsWebcamModalOpen(false)}
                  className="w-full py-2.5 pixel-btn bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] text-xs font-pixel-title font-bold active:scale-95"
                >
                  SELESAI & GUNAKAN CANON
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
