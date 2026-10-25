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
  ChevronLeft,
  ChevronRight,
  Copy,
  Tablet,
  Wifi,
  Usb,
  Download,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
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
import { getDefaultSlots } from '@/utils/photoDownloadHelper';

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
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 40, y: 250, width: 520, height: 330, photo: 0 },
      { x: 640, y: 250, width: 520, height: 330, photo: 0 },
      { x: 40, y: 605, width: 520, height: 330, photo: 1 },
      { x: 640, y: 605, width: 520, height: 330, photo: 1 },
      { x: 40, y: 960, width: 520, height: 330, photo: 2 },
      { x: 640, y: 960, width: 520, height: 330, photo: 2 },
      { x: 40, y: 1315, width: 520, height: 330, photo: 3 },
      { x: 640, y: 1315, width: 520, height: 330, photo: 3 },
    ],
  },
  {
    slug: 'night-city-grid',
    name: 'NIGHT CITY GRID',
    desc: '4 foto dalam kisi 2x2',
    photoCount: 4,
    previewType: 'grid',
    frameImage: '/assets/frames/night-city-grid.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 50, y: 330, width: 530, height: 600, photo: 0 },
      { x: 620, y: 330, width: 530, height: 600, photo: 1 },
      { x: 50, y: 960, width: 530, height: 600, photo: 2 },
      { x: 620, y: 960, width: 530, height: 600, photo: 3 },
    ],
  },
  {
    slug: 'moonlight-trio',
    name: 'MOONLIGHT TRIO',
    desc: '3 foto strip dengan bulan sabit',
    photoCount: 3,
    previewType: 'trio',
    frameImage: '/assets/frames/moonlight-trio.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 40, y: 250, width: 520, height: 450, photo: 0 },
      { x: 640, y: 250, width: 520, height: 450, photo: 0 },
      { x: 40, y: 725, width: 520, height: 450, photo: 1 },
      { x: 640, y: 725, width: 520, height: 450, photo: 1 },
      { x: 40, y: 1200, width: 520, height: 450, photo: 2 },
      { x: 640, y: 1200, width: 520, height: 450, photo: 2 },
    ],
  },
  {
    slug: 'duo-skyline',
    name: 'DUO SKYLINE',
    desc: '2 foto bertingkat untuk berdua',
    photoCount: 2,
    previewType: 'duo',
    frameImage: '/assets/frames/duo-skyline.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 50, y: 260, width: 1100, height: 620, photo: 0 },
      { x: 50, y: 920, width: 1100, height: 620, photo: 1 },
    ],
  },
  {
    slug: 'poster-tunggal',
    name: 'POSTER TUNGGAL',
    desc: '1 foto besar bergaya poster expo',
    photoCount: 1,
    previewType: 'single',
    frameImage: '/assets/frames/poster-tunggal.png',
    canvasWidth: 1200,
    canvasHeight: 1800,
    slots: [
      { x: 50, y: 260, width: 1100, height: 1200, photo: 0 },
    ],
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

  // State Modal Uji Live Feed Webcam Laptop & Canon DSLR
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState(false);
  const [testSnapshotUrl, setTestSnapshotUrl] = useState<string | null>(null);
  const [webcamDevices, setWebcamDevices] = useState<WebcamDeviceInfo[]>([]);
  const [selectedWebcamId, setSelectedWebcamId] = useState<string>('');
  const [canonApiStatus, setCanonApiStatus] = useState<{ connected: boolean; cameraName: string }>({
    connected: false,
    cameraName: 'Canon EOS 1200D',
  });
  const [isScanningCanon, setIsScanningCanon] = useState(false);
  const [tabletConnectionInfo, setTabletConnectionInfo] = useState<{ laptopIp?: string; tabletBoothUrl?: string }>({});
  const [tabletUsbStatus, setTabletUsbStatus] = useState<{ connected: boolean; deviceName?: string; error?: string } | null>(null);
  const [activeCanonTab, setActiveCanonTab] = useState<'wireless-tablet' | 'usb-otg' | 'laptop-host'>('wireless-tablet');
  const [isCopiedUrl, setIsCopiedUrl] = useState(false);
  const [isCopiedApkUrl, setIsCopiedApkUrl] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [apkQrDataUrl, setApkQrDataUrl] = useState<string | null>(null);
  const GITHUB_RELEASES_URL = 'https://github.com/Astaa25/Photobooth/releases';
  const APK_DOWNLOAD_URL = 'https://github.com/Astaa25/Photobooth/releases/download/v1.0.1/photobooth-himatik.apk';
  const testVideoRef = useRef<HTMLVideoElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [dynamicCardWidth, setDynamicCardWidth] = useState<number>(360);
  const [previewDims, setPreviewDims] = useState<{ width: number; height: number }>({ width: 336, height: 504 });

  // Hitung dimensi kartu & preview agar presisi proporsional 4R (1200x1800) tanpa gepeng di segala resolusi layar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCardDimensions = () => {
      const container = carouselRef.current;
      const reelHeight = container && container.clientHeight > 0 ? container.clientHeight : (window.innerHeight - 200);
      // Non-preview height di dalam kartu: padding (16px), bar atas kartu (32px), bar info judul (24px), tombol aksi (38px), margin (14px) = ~124px
      const availablePreviewHeight = Math.max(160, reelHeight - 124);
      // Rasio asli 4R: 1200 / 1800 = 2 / 3
      const naturalWidth = Math.round(availablePreviewHeight * (2 / 3));
      const naturalHeight = Math.round(naturalWidth * 1.5);
      const targetCardWidth = naturalWidth + 24; // 12px padding kiri + 12px kanan

      setPreviewDims({ width: naturalWidth, height: naturalHeight });
      setDynamicCardWidth(targetCardWidth);
    };

    updateCardDimensions();

    let observer: ResizeObserver | null = null;
    if (carouselRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateCardDimensions);
      observer.observe(carouselRef.current);
    }

    window.addEventListener('resize', updateCardDimensions);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateCardDimensions);
    };
  }, [step]);

  // Deteksi status PWA / WebAPK & listener event install Android
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandaloneApp(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandaloneApp(true);
      setDeferredPrompt(null);
      if (soundEnabled) retroAudio.playSuccessChime();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Buat QR Code untuk download langsung file APK dari GitHub Releases
    QRCode.toDataURL(GITHUB_RELEASES_URL, {
      width: 180,
      margin: 1,
      color: {
        dark: '#050C38',
        light: '#FFFFFF',
      },
    })
      .then((url) => setApkQrDataUrl(url))
      .catch(() => {});

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [soundEnabled]);

  const handleInstallApk = () => {
    if (soundEnabled) retroAudio.playButtonClick();
    setIsInstallModalOpen(true);
  };

  // Periksa apakah tablet sudah diaktifkan di sesi browser ini & kunci scroll window agar pas 1 layar
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
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
    return () => {
      if (typeof window !== 'undefined') {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    };
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

  // Pindai dan uji status koneksi Canon DSLR (via digiCamControl, Wi-Fi Tablet, & EOS Webcam Utility)
  const scanAndCheckCanon = async () => {
    setIsScanningCanon(true);
    try {
      // 1. Pindai API digiCamControl & info alamat IP laptop untuk tablet
      const res = await fetch('/api/canon');
      const json = await res.json();
      if (json && json.success) {
        setCanonApiStatus({
          connected: json.connected,
          cameraName: json.cameraName || 'Canon EOS 1200D',
        });
        if (json.laptopIp || json.tabletBoothUrl) {
          setTabletConnectionInfo({
            laptopIp: json.laptopIp,
            tabletBoothUrl: json.tabletBoothUrl,
          });
        }
        if (json.connected) {
          handleSwitchCamera('canon');
        }
      }

      // 2. Pindai apakah ada Canon EOS Webcam Utility atau Capture Card di perangkat video browser
      const devs = await enumerateVideoDevices();
      setWebcamDevices(devs);
      const canonDev = devs.find((d) =>
        d.label.toLowerCase().includes('canon') ||
        d.label.toLowerCase().includes('eos') ||
        d.label.toLowerCase().includes('utility') ||
        d.label.toLowerCase().includes('video capture') ||
        d.label.toLowerCase().includes('cam link')
      );
      if (canonDev && cameraSource === 'webcam') {
        setSelectedWebcamId(canonDev.deviceId);
      }
    } catch (err) {
      console.warn('Gagal memindai status Canon:', err);
    } finally {
      setIsScanningCanon(false);
    }
  };

  // Hubungkan langsung kabel USB OTG Canon di tablet via WebUSB (Chrome Android)
  const handleConnectWebUsb = async () => {
    setTabletUsbStatus(null);

    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
    const hasUsb = typeof navigator !== 'undefined' && 'usb' in navigator;

    if (!hasUsb) {
      if (!isSecure) {
        setTabletUsbStatus({
          connected: false,
          error:
            'Di Redmi Pad 2, browser membatasi WebUSB di alamat HTTP (192.168.x.x). Solusi termudah: Colok kamera ke LAPTOP dan gunakan Tab "1. BUKA DI TABLET (NIRKABEL)" tanpa perlu kabel apapun ke tablet! Atau jika ingin kabel ke tablet, aktifkan izin di chrome://flags.',
        });
      } else {
        setTabletUsbStatus({
          connected: false,
          error:
            'Browser bawaan Xiaomi (Mi Browser) di Redmi Pad 2 tidak mendukung WebUSB. Silakan buka alamat web ini menggunakan aplikasi Google Chrome di tablet Anda.',
        });
      }
      return;
    }

    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [{ vendorId: 0x04a9 }], // Vendor ID Canon Inc.
      });
      if (device) {
        await device.open().catch(() => {});
        const devName = device.productName || 'Canon EOS 1200D';
        setTabletUsbStatus({
          connected: true,
          deviceName: devName,
        });
        setCanonApiStatus({
          connected: true,
          cameraName: `${devName} (USB OTG Tablet)`,
        });
        handleSwitchCamera('canon');
        if (soundEnabled) retroAudio.playSuccessChime();
      }
    } catch (err: any) {
      console.warn('WebUSB request error:', err);
      setTabletUsbStatus({
        connected: false,
        error:
          err?.name === 'SecurityError'
            ? 'Izin akses USB ditolak browser.'
            : err?.message || 'Pastikan aplikasi Camera Connect & Control sudah ditutup dari Recent Apps agar port USB tidak terkunci.',
      });
    }
  };

  // Salin alamat URL booth laptop untuk dibuka di tablet
  const handleCopyTabletUrl = () => {
    const url = tabletConnectionInfo.tabletBoothUrl || `http://${window.location.hostname}:3000/booth`;
    navigator.clipboard?.writeText(url).then(() => {
      setIsCopiedUrl(true);
      if (soundEnabled) retroAudio.playSuccessChime();
      setTimeout(() => setIsCopiedUrl(false), 2500);
    }).catch(() => {
      prompt('Salin tautan ini untuk dibuka di tablet:', url);
    });
  };

  // Buka modal uji kamera dan pasangkan feed langsung jika mode webcam
  const handleOpenWebcamTest = async () => {
    setIsWebcamModalOpen(true);
    scanAndCheckCanon().catch(() => {});
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

        const executeCapture = async () => {
          let photoData = '';

          // 1. Panggil API Canon ke tablet jika mode Canon aktif
          if (cameraSource === 'canon') {
            try {
              const res = await fetch('/api/canon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  photoIndex: retakeIndex !== null ? retakeIndex : currentPhotoIdx,
                  visitorName: visitorName || 'Pengunjung',
                }),
              });
              const json = await res.json();
              if (json.success && json.photoUrl) {
                photoData = json.photoUrl;
              }
            } catch (err) {
              console.warn('Gagal memanggil API Canon:', err);
            }
          }

          // 2. Fallback ke webcam laptop snapshot atau simulator
          if (!photoData) {
            const colors = ['#1D4ED8', '#BE185D', '#047857', '#B45309', '#7C3AED', '#DB2777'];
            const fallbackColor = colors[currentPhotoIdx % colors.length];
            photoData = latestWebcamSnapshotRef.current || fallbackColor;
            latestWebcamSnapshotRef.current = null;
          }

          setIsFlashActive(false);

          // 1. KASUS KHUSUS RETAKE SINGLE FOTO (HANYA GANTI 1 FOTO YANG DIULANG)
          if (retakeIndex !== null) {
            const updated = [...capturedPhotos];
            updated[retakeIndex] = photoData;
            setCapturedPhotos(updated.slice(0, selectedTemplate.photoCount));
            setRetakeIndex(null);
            setStep('review');
            if (soundEnabled) retroAudio.playSuccessChime();
            return;
          }

          // 2. KASUS NORMAL (JEPRET BERURUTAN DARI 0 SAMPAI photoCount)
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
        };

        setTimeout(() => {
          executeCapture().catch(console.error);
        }, 360);
      }
    }
    return () => clearTimeout(timer);
  }, [step, countdownNum, currentPhotoIdx, capturedPhotos, selectedTemplate.photoCount, soundEnabled, retakeIndex, cameraSource, webcamStatus, visitorName]);

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

  // Simpan data sesi yang telah selesai ke server (/api/sessions) dan localStorage secara instan
  const persistCompletedSession = async (photosToSave: string[]) => {
    const cleanNumber = ticketNumber || '#001';
    const cleanName = visitorName || 'Pengunjung';
    const payload = {
      number: cleanNumber,
      nickname: cleanName,
      template: selectedTemplate.name,
      frameImage: selectedTemplate.frameImage,
      slots: selectedTemplate.slots,
      canvasWidth: selectedTemplate.canvasWidth || 1200,
      canvasHeight: selectedTemplate.canvasHeight || 1800,
      photos: photosToSave,
      accentColor: '#00E599',
    };

    // 1. Simpan ke disk server lewat API agar langsung bisa diakses oleh HP yang memindai QR Code
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Gagal POST /api/sessions:', err);
    }

    // 2. Simpan ke galeri publik lokal dengan array berkas foto utuh
    try {
      const savedGalleries = JSON.parse(
        localStorage.getItem('photobooth_completed_sessions') || '[]'
      );
      const filtered = Array.isArray(savedGalleries)
        ? savedGalleries.filter(
            (item: any) =>
              item.number?.replace('#', '').trim().toLowerCase() !==
              cleanNumber.replace('#', '').trim().toLowerCase()
          )
        : [];
      const newEntry = {
        id: `sess-${Date.now()}`,
        ...payload,
        time:
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        date: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      };
      localStorage.setItem(
        'photobooth_completed_sessions',
        JSON.stringify([newEntry, ...filtered])
      );
    } catch {}

    // 3. Beritahukan admin & galeri bahwa sesi telah selesai
    try {
      const channel = new BroadcastChannel('photobooth_session_sync');
      channel.postMessage({
        type: 'SESSION_COMPLETED',
        ticketNumber: cleanNumber,
        visitorName: cleanName,
      });
      channel.close();
    } catch {}
  };

  // Saat pengunjung menekan tombol selesai di akhir sesi foto
  const handleFinishSession = () => {
    if (soundEnabled) retroAudio.playButtonClick();
    persistCompletedSession(capturedPhotos.slice(0, selectedTemplate.photoCount));

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

  // Preview Besar Penuh 4R (Model Geser & Tampak Keseluruhan)
  const renderTemplateLargePreview = (tpl: TemplateOption) => {
    const slots =
      tpl.slots && tpl.slots.length > 0
        ? tpl.slots
        : getDefaultSlots(tpl.photoCount || 4, 1200, 1800);

    return (
      <div className="relative w-64 sm:w-72 md:w-80 aspect-[2/3] bg-gradient-to-b from-[#0C1230] to-[#160078] border-4 border-[#35408E] shadow-[0_0_24px_rgba(224,47,117,0.4)] overflow-hidden flex items-center justify-center shrink-0">
        {/* Layer Posisi Slot Foto (Tampak Keseluruhan) */}
        <div className="absolute inset-0 pointer-events-none">
          {slots.map((s, idx) => {
            const leftPct = (s.x / 1200) * 100;
            const topPct = (s.y / 1800) * 100;
            const widthPct = (s.width / 1200) * 100;
            const heightPct = (s.height / 1800) * 100;
            const poseNum =
              (s.photo !== undefined
                ? s.photo
                : s.source_index !== undefined
                ? s.source_index
                : idx) + 1;

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
                className="bg-black/80 border border-[#FE0168]/70 flex flex-col items-center justify-center text-[#FFD84D] font-pixel-title"
              >
                <span className="text-[10px] sm:text-xs font-bold text-[#FFD84D] drop-shadow">
                  POSE #{poseNum}
                </span>
                <span className="text-[7px] text-white/60 font-mono">
                  SLOT {idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Layer Frame Asli Transparan PNG */}
        {tpl.frameImage && (
          <img
            src={tpl.frameImage}
            alt={tpl.name}
            className="absolute inset-0 w-full h-full object-fill pixel-art pointer-events-none z-10"
          />
        )}

        {/* Badge 4R */}
        <span className="absolute bottom-1 right-1.5 z-20 text-[7px] font-pixel-title text-[#FFD84D] bg-black/80 px-1 border border-[#FFD84D]/40">
          CETAK 4R (1200×1800)
        </span>
      </div>
    );
  };

  const currentTemplateIdx = templates.findIndex((t) => t.slug === selectedTemplate.slug);
  const safeTemplateIdx = currentTemplateIdx >= 0 ? currentTemplateIdx : 0;

  const handlePrevTemplate = () => {
    if (soundEnabled) retroAudio.playButtonClick();
    const prevIdx = (safeTemplateIdx - 1 + templates.length) % templates.length;
    setSelectedTemplate(templates[prevIdx]);
  };

  const handleNextTemplate = () => {
    if (soundEnabled) retroAudio.playButtonClick();
    const nextIdx = (safeTemplateIdx + 1) % templates.length;
    setSelectedTemplate(templates[nextIdx]);
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
  // TAMPILAN APLIKASI BOOTH (STANDBY / SESI FOTO / LOCK) - FLUTTER APK TABLET STYLE
  // =========================================================================
  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-[#050C38] text-white flex flex-col overflow-hidden select-none font-pixel touch-manipulation">
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

      {/* Header Aplikasi Booth Kios - SELALU MUNCUL PERMANEN DI ATAS */}
      <header className="sticky top-0 left-0 right-0 w-full shrink-0 z-40 bg-[#0C1230]/95 backdrop-blur border-b-2 sm:border-b-4 border-[#4B57B2] px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shadow-md">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className={`w-2.5 h-2.5 ${!isUnlocked ? 'bg-[#FE0168]' : step === 'standby' ? 'bg-[#FFD84D]' : 'bg-[#00E599]'} animate-pulse shadow-[0_0_8px_currentColor] shrink-0`} />
          <span className="font-pixel-title text-[10px] sm:text-xs text-[#A9B8FF] tracking-wider whitespace-nowrap">
            EXPO WISUDA TIK 2026 &bull; PHOTOBOOTH APP
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
          {!isUnlocked ? (
            <span className="bg-[#FE0168]/20 px-2 py-1 border border-[#FE0168] text-[#FE0168] font-pixel-title text-[10px] whitespace-nowrap">
              KIOS TERKUNCI
            </span>
          ) : ticketNumber ? (
            <span className="bg-[#131947] px-2 sm:px-3 py-1 border border-[#4B57B2] text-[#FFD84D] font-pixel-title text-[10px] sm:text-xs whitespace-nowrap">
              TIKET: {ticketNumber}
            </span>
          ) : (
            <span className="bg-[#131947] px-2 sm:px-3 py-1 border border-[#4B57B2] text-[#5CE1E6] font-pixel-title text-[10px] sm:text-xs whitespace-nowrap">
              STANDBY
            </span>
          )}

          {/* Tombol Opsi Sumber Kamera (Canon DSLR vs Laptop Webcam) & Uji */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Tombol Hubungkan / Status Canon Langsung di Navbar */}
            <button
              type="button"
              onClick={() => {
                handleOpenWebcamTest();
                scanAndCheckCanon();
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 border-2 text-[10px] font-pixel-title transition-all active:scale-95 shadow-sm shrink-0 whitespace-nowrap ${
                cameraSource === 'canon'
                  ? 'bg-[#00E599]/20 border-[#00E599] text-[#00E599] hover:bg-[#00E599]/30'
                  : 'bg-[#131947] hover:bg-[#160078] border-[#FFD84D] text-[#FFD84D] animate-pulse'
              }`}
              title="Hubungkan & Uji Kamera Canon EOS 1200D"
            >
              <Camera className="w-3.5 h-3.5 text-[#00E599]" />
              <span>
                {cameraSource === 'canon'
                  ? 'CANON 1200D ● AKTIF'
                  : 'HUBUNGKAN CANON'}
              </span>
            </button>

            {/* Tombol Pilihan Sumber Kamera (Laptop / Simulator / Uji) */}
            <button
              type="button"
              onClick={handleOpenWebcamTest}
              className={`px-2 py-1 bg-[#131947] hover:bg-[#160078] border text-[10px] font-pixel-title active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap ${
                cameraSource === 'webcam' ? 'border-[#5CE1E6] text-[#5CE1E6]' : 'border-white/20 text-white/60'
              }`}
              title="Buka Pengaturan Kamera & Live Feed"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>
                {selectedWebcamId === 'simulator-virtual-webcam' ? 'SIMULATOR' : 'WEBCAM'}{' '}
                {webcamStatus === 'connected' ? '●' : '○'}
              </span>
            </button>

            {/* Tombol Download / Pasang APK di Tablet */}
            <button
              type="button"
              onClick={handleInstallApk}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 border text-[10px] font-pixel-title transition-all active:scale-95 shadow-sm shrink-0 whitespace-nowrap ${
                isStandaloneApp
                  ? 'bg-[#00E599]/20 border-[#00E599] text-[#00E599]'
                  : 'bg-[#FE0168] hover:bg-[#E02F75] border-[#FFD84D] text-white animate-pulse'
              }`}
              title="Download & Pasang APK Aplikasi Booth di Tablet Android"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isStandaloneApp ? 'APK AKTIF ✓' : '📲 PASANG APK'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) retroAudio.playButtonClick();
            }}
            className="p-1.5 border border-[#4B57B2] hover:bg-white/10 text-[#FFD84D] shrink-0"
            title="Toggle Suara 8-Bit"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 border border-[#4B57B2] hover:bg-white/10 text-white shrink-0"
            title="Layar Penuh (App Mode)"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          {isUnlocked ? (
            <button
              onClick={handleLockAgain}
              className="text-[9px] text-white/50 hover:text-white underline shrink-0 whitespace-nowrap pl-1"
            >
              Kunci Kios
            </button>
          ) : (
            <button
              onClick={() => {
                setIsUnlocked(true);
                sessionStorage.setItem('booth_kiosk_unlocked', 'true');
                if (soundEnabled) retroAudio.playSuccessChime();
              }}
              className="px-2 py-0.5 bg-[#00E599] text-[#050C38] text-[9px] font-pixel-title font-bold shrink-0 whitespace-nowrap"
            >
              Buka Kios
            </button>
          )}
        </div>
      </header>

      {/* Konten Utama Interaktif Booth */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5 z-20 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Layar Kios Terkunci (Jika isUnlocked false) */}
        {!isUnlocked ? (
          <div className="w-full max-w-sm bg-[#0C1230]/95 pixel-box p-6 sm:p-8 text-center relative z-10 backdrop-blur shadow-[0_0_30px_rgba(5,12,56,0.9)] my-auto" suppressHydrationWarning>
            <div className="w-12 h-12 pixel-box-cyber bg-[#E02F75] text-white flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-white" />
            </div>

            <h1 className="font-pixel-title text-sm font-bold text-[#FFD84D] mb-2 leading-relaxed">
              KIOS BOOTH TERKUNCI
            </h1>
            <p className="text-[11px] text-white/70 mb-5 leading-relaxed font-sans">
              Layar ini khusus untuk bilik photobooth. Masukkan PIN operator atau tekan tombol buka untuk memulai.
            </p>

            <form onSubmit={handleUnlock} className="space-y-3" suppressHydrationWarning autoComplete="off">
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
                  className="w-full h-11 text-center text-sm tracking-widest font-pixel-title border-2 border-[#4B57B2] bg-[#010030] text-[#FFD84D] focus:outline-none focus:border-[#E02F75] transition-all"
                />
                <KeyRound className="w-4 h-4 text-white/40 absolute left-3 top-3.5 pointer-events-none" />
              </div>

              {pinError && (
                <p className="text-xs text-[#FF5A57] font-bold">
                  [!] PIN SALAH
                </p>
              )}

              <button
                type="submit"
                suppressHydrationWarning
                className="w-full h-11 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white text-xs font-pixel-title font-bold active:scale-95"
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
                className="w-full h-10 pixel-btn bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] text-xs font-pixel-title font-bold mt-1.5 active:scale-95 shadow"
              >
                🚀 BUKA KIOS LANGSUNG (PIN: 1234)
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/50">
              PIN Default Operator: <span className="text-[#FFD84D] font-mono font-bold">1234</span>
            </div>
          </div>
        ) : (
          <>
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
            STEP 2: PILIH DESAIN BINGKAI (DYNAMIC HORIZONTAL REEL - 1 LAYAR PAS)
            =================================================================== */}
        {step === 'choosing_design' && (
          <div className="w-full max-w-6xl h-full max-h-full flex flex-col justify-between bg-[#0C1230]/95 pixel-box p-1.5 sm:p-2 backdrop-blur text-center shadow-[0_0_35px_rgba(5,12,56,0.95)] overflow-hidden min-h-0">
            {/* BAR ATAS: JUDUL & KONTROL GESER ARCADE */}
            <div className="flex items-center justify-between gap-2 px-1.5 py-0.5 border-b-2 border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFD84D]" />
                <h2 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D]">
                  PILIH BINGKAI FOTO 4R
                </h2>
                <span className="text-[10px] text-[#A9B8FF] hidden md:inline font-sans">
                  &bull; Geser ke samping | 1 | | 2 | | 3 |
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (carouselRef.current) carouselRef.current.scrollBy({ left: -(dynamicCardWidth + 14), behavior: 'smooth' });
                    handlePrevTemplate();
                  }}
                  className="px-2.5 py-1 pixel-btn bg-[#160078] hover:bg-[#FE0168] text-[#FFD84D] hover:text-white text-[10px] sm:text-xs font-pixel-title flex items-center gap-1 shadow-[2px_2px_0_0_#050C38] active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>KIRI</span>
                </button>

                <div className="px-3 py-0.5 bg-[#050C38] border border-[#FFD84D]/60 font-pixel-title text-[10px] sm:text-xs text-[#FFD84D] truncate max-w-[240px] sm:max-w-[360px]">
                  | {safeTemplateIdx + 1} / {templates.length} | &bull; <span className="text-white">{selectedTemplate.name}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (carouselRef.current) carouselRef.current.scrollBy({ left: (dynamicCardWidth + 14), behavior: 'smooth' });
                    handleNextTemplate();
                  }}
                  className="px-2.5 py-1 pixel-btn bg-[#160078] hover:bg-[#FE0168] text-[#FFD84D] hover:text-white text-[10px] sm:text-xs font-pixel-title flex items-center gap-1 shadow-[2px_2px_0_0_#050C38] active:scale-95"
                >
                  <span>KANAN</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* REEL TRACK HORIZONTAL DINAMIS: HANYA GESER KE SAMPING, 100% PAS 1 LAYAR TANPA SCROLL VERTIKAL */}
            <div
              ref={carouselRef}
              className="flex-1 min-h-0 flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory py-1 px-2 scroll-smooth scrollbar-thin items-stretch w-full"
            >
              {templates.map((tpl, idx) => {
                const isSelected = selectedTemplate.slug === tpl.slug;
                const slots =
                  tpl.slots && tpl.slots.length > 0
                    ? tpl.slots
                    : getDefaultSlots(tpl.photoCount || 4, 1200, 1800);

                return (
                  <div
                    key={tpl.slug}
                    onClick={() => {
                      if (!isSelected) {
                        setSelectedTemplate(tpl);
                        if (soundEnabled) retroAudio.playButtonClick();
                      }
                    }}
                    style={{ width: `${dynamicCardWidth}px` }}
                    className={`h-full max-h-full flex flex-col justify-between shrink-0 snap-center pixel-box p-2 cursor-pointer transition-all text-left overflow-hidden ${
                      isSelected
                        ? 'border-4 border-[#00E599] bg-[#131947] shadow-[0_0_24px_rgba(0,229,153,0.7),3px_3px_0_0_#050C38] ring-2 ring-[#00E599]/50 scale-[1.01]'
                        : 'border-2 border-[#4B57B2] bg-[#0C1230]/90 hover:border-[#5CE1E6] hover:bg-[#131947]/80 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Header Nomor Kartu: | 1 | | 2 | | 3 | */}
                    <div className="flex items-center justify-between pb-1 border-b border-white/10 shrink-0">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-pixel-title text-xs sm:text-sm text-[#FFD84D] px-2 py-0.5 bg-[#050C38] border border-[#FFD84D]/70 shadow-[1px_1px_0_0_#050C38] whitespace-nowrap">
                          | {idx + 1} |
                        </span>
                        {tpl.isCustom && (
                          <span className="text-[7px] font-pixel-title bg-[#E02F75] px-1 py-0.5 text-white border border-[#FFD84D] whitespace-nowrap">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-pixel-title text-[#00E599] bg-[#160078] px-2 py-0.5 border border-[#00E599]/40 whitespace-nowrap">
                        {tpl.photoCount}X FOTO
                      </span>
                    </div>

                    {/* Lembar Preview Proporsional 4R Penuh (TIDAK GEPENG: RASIO 2:3 ASLI 1200x1800) */}
                    <div className="flex-1 min-h-0 flex items-center justify-center my-1 w-full overflow-hidden">
                      <div
                        style={{
                          width: `${previewDims.width}px`,
                          height: `${previewDims.height}px`,
                          aspectRatio: '1200 / 1800',
                        }}
                        className="relative bg-gradient-to-b from-[#0C1230] to-[#160078] border-2 border-[#35408E] overflow-hidden shadow-[0_0_12px_rgba(0,0,0,0.8)] mx-auto shrink-0 select-none"
                      >
                        {/* Layer Slot Foto & Posisi Pose */}
                        <div className="absolute inset-0 pointer-events-none">
                          {slots.map((s, sIdx) => {
                            const leftPct = (s.x / 1200) * 100;
                            const topPct = (s.y / 1800) * 100;
                            const widthPct = (s.width / 1200) * 100;
                            const heightPct = (s.height / 1800) * 100;
                            const poseNum =
                              (s.photo !== undefined
                                ? s.photo
                                : s.source_index !== undefined
                                ? s.source_index
                                : sIdx) + 1;

                            return (
                              <div
                                key={sIdx}
                                style={{
                                  position: 'absolute',
                                  left: `${leftPct}%`,
                                  top: `${topPct}%`,
                                  width: `${widthPct}%`,
                                  height: `${heightPct}%`,
                                }}
                                className="bg-black/85 border border-[#FE0168]/70 flex flex-col items-center justify-center text-[#FFD84D] font-pixel-title"
                              >
                                <span className="text-[9px] sm:text-[10px] font-bold text-[#FFD84D] drop-shadow">
                                  #{poseNum}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Layer Frame Asli PNG Transparan (object-contain agar TIDAK GEPENG) */}
                        {tpl.frameImage && (
                          <img
                            src={tpl.frameImage}
                            alt={tpl.name}
                            className="absolute inset-0 w-full h-full object-contain pixel-art pointer-events-none z-10"
                          />
                        )}

                        {/* Badge 4R */}
                        <span className="absolute bottom-1 right-1 z-20 text-[6px] sm:text-[7px] font-pixel-title text-[#FFD84D] bg-black/80 px-1 border border-[#FFD84D]/40">
                          4R (1200×1800)
                        </span>
                      </div>
                    </div>

                    {/* Informasi Ringkas Template */}
                    <div className="my-1 shrink-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="font-pixel-title text-xs text-[#FFD84D] truncate font-bold">
                          {tpl.name}
                        </h3>
                        <span className="text-[8px] font-pixel-title text-[#5CE1E6] bg-[#050C38] px-1.5 py-0.5 border border-[#5CE1E6]/40 shrink-0">
                          {slots.length} SLOT
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi per Kartu */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCapture();
                          }}
                          className="w-full h-8 sm:h-9 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-[11px] sm:text-xs font-pixel-title font-bold flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#050C38] active:scale-95"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#FFD84D]" />
                          <span>MULAI FOTO ({tpl.photoCount}X)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(tpl);
                            if (soundEnabled) retroAudio.playButtonClick();
                          }}
                          className="w-full h-8 sm:h-9 pixel-btn bg-[#160078] hover:bg-[#1E2768] text-[#5CE1E6] hover:text-white text-[11px] sm:text-xs font-pixel-title flex items-center justify-center gap-1 border border-[#5CE1E6]/40 active:scale-95"
                        >
                          <span>PILIH | {idx + 1} |</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BAR BAWAH: INDIKATOR TOMBOL TITIK LOMPAT & STATUS KAMERA */}
            <div className="flex items-center justify-between gap-2 px-1.5 pt-1 border-t border-white/10 shrink-0 text-[9px] font-pixel-title">
              {/* Indikator Tombol Titik Lompat Langsung */}
              <div className="flex items-center gap-1">
                <span className="text-[#A9B8FF] hidden sm:inline">LOMPAT:</span>
                {templates.map((tpl, i) => (
                  <button
                    key={tpl.slug}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      if (carouselRef.current) {
                        const child = carouselRef.current.children[i] as HTMLElement;
                        if (child) {
                          child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        }
                      }
                      if (soundEnabled) retroAudio.playButtonClick();
                    }}
                    className={`px-1.5 py-0.5 border transition-all ${
                      selectedTemplate.slug === tpl.slug
                        ? 'bg-[#FFD84D] text-[#050C38] border-white font-bold'
                        : 'bg-[#050C38] text-white/50 border-white/20 hover:text-white'
                    }`}
                  >
                    | {i + 1} |
                  </button>
                ))}
              </div>

              {/* Status Kamera Ringkas */}
              <div className="flex items-center gap-1 text-[#A9B8FF]">
                <span>KAMERA:</span>
                <span className={cameraSource === 'webcam' ? 'text-[#5CE1E6]' : 'text-[#00E599]'}>
                  {cameraSource === 'webcam'
                    ? `LAPTOP ${webcamStatus === 'connected' ? '● SIAP' : '● CEK'}`
                    : 'CANON 1200D ● SIAP'}
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
          <div className="w-full max-w-4xl max-h-full flex flex-col justify-between animate-fadeIn bg-[#0C1230]/90 pixel-box p-3 sm:p-5 backdrop-blur text-center overflow-hidden min-h-0">
            <div className="shrink-0 mb-1">
              <h2 className="font-pixel-title text-sm sm:text-base text-[#FFD84D] mb-0.5">
                TINJAU HASIL FOTO ANDA
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#A9B8FF]">
                Puas dengan hasilnya? Anda dapat mengulang foto tertentu jika ingin mengganti pose.
              </p>
            </div>

            <div className="flex-1 min-h-0 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 overflow-y-auto py-1">
              {capturedPhotos.slice(0, selectedTemplate.photoCount).map((color, idx) => {
                const isImg = color.startsWith('data:image') || color.startsWith('/') || color.startsWith('http');
                return (
                  <div key={idx} className="relative group shrink-0">
                    <div
                      style={{ backgroundColor: isImg ? '#000' : color }}
                      className="w-28 sm:w-36 h-20 sm:h-26 border-2 sm:border-4 border-[#4B57B2] overflow-hidden flex flex-col items-center justify-center font-pixel-title text-xs text-white shadow-[2px_2px_0_0_#050C38] relative"
                    >
                      {isImg ? (
                        <img src={color} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <span>FOTO #{idx + 1}</span>
                      )}
                    </div>
                    <button
                      onClick={() => retakeSingle(idx)}
                      className="mt-1 w-full py-1 pixel-btn bg-[#6700A3] hover:bg-[#E02F75] text-[9px] sm:text-[10px] text-white font-bold flex items-center justify-center gap-1 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>ULANGI #{idx + 1}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  if (soundEnabled) {
                    retroAudio.playPrintSound();
                    retroAudio.playSuccessChime();
                  }
                  const finalPhotos = capturedPhotos.slice(0, selectedTemplate.photoCount);
                  persistCompletedSession(finalPhotos);
                  setStep('result');
                }}
                className="h-10 sm:h-11 px-6 sm:px-8 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white text-xs font-bold flex items-center justify-center gap-2 mx-auto shadow-[2px_2px_0_0_#050C38] active:scale-95"
              >
                <Check className="w-4 h-4 text-[#FFD84D]" />
                <span>PAKAI FOTO INI &amp; SIMPAN STRIP</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 5: HASIL SIAP, QR CODE & DISPENSER STRIP (1 LAYAR PAS)
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
          </>
        )}
      </main>

      {/* Footer Kios Ringkas - Hemat Ruang Layar Tablet */}
      <footer className="px-4 py-1.5 border-t-2 border-[#4B57B2] flex items-center justify-between text-[10px] text-[#A9B8FF] z-30 bg-[#0C1230]/95 shrink-0">
        <span className="truncate">EXPO WISUDA JURUSAN TIK 2026 &bull; PHOTOBOOTH SYSTEM</span>
        <span className="text-[#FFD84D] truncate">CANON 1200D &bull; EPSON L300 4R READY</span>
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
              <div className="bg-[#050C38] border-2 border-[#00E599] p-3 sm:p-4 text-center mb-3">
                {/* Header Status Kamera Canon */}
                <div className="flex items-center justify-between gap-2 mb-3 bg-[#0C1230] p-2.5 border border-[#4B57B2]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-[#00E599]/20 border border-[#00E599] text-[#00E599] flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-pixel-title text-xs text-[#00E599]">
                        KAMERA CANON EOS 1200D
                      </h4>
                      <span className="text-[10px] text-[#A9B8FF] flex items-center gap-1 font-mono">
                        <span className={`w-2 h-2 rounded-full ${canonApiStatus.connected ? 'bg-[#00E599] animate-pulse' : 'bg-[#FFD84D]'}`} />
                        {canonApiStatus.connected
                          ? `AKTIF: ${canonApiStatus.cameraName}`
                          : 'STANDBY (PILIH METODE KONEKSI DI BAWAH)'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-1 bg-[#131947] border border-[#FFD84D]/40 text-[#FFD84D] text-[9px] font-pixel-title hidden sm:inline-block">
                    DSLR 18.0 MP
                  </span>
                </div>

                {/* Tab Pilihan Metode Koneksi Canon & Tablet */}
                <div className="grid grid-cols-3 gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveCanonTab('wireless-tablet')}
                    className={`py-1.5 px-1 text-[9px] font-pixel-title flex flex-col items-center justify-center gap-0.5 border transition-all ${
                      activeCanonTab === 'wireless-tablet'
                        ? 'bg-[#FFD84D] text-[#050C38] border-white font-bold shadow'
                        : 'bg-[#131947] text-white/70 border-[#4B57B2] hover:bg-[#160078]'
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span className="truncate">1. BUKA DI TABLET</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCanonTab('usb-otg')}
                    className={`py-1.5 px-1 text-[9px] font-pixel-title flex flex-col items-center justify-center gap-0.5 border transition-all ${
                      activeCanonTab === 'usb-otg'
                        ? 'bg-[#00E599] text-[#050C38] border-white font-bold shadow'
                        : 'bg-[#131947] text-white/70 border-[#4B57B2] hover:bg-[#160078]'
                    }`}
                  >
                    <Usb className="w-3.5 h-3.5" />
                    <span className="truncate">2. USB OTG TABLET</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCanonTab('laptop-host')}
                    className={`py-1.5 px-1 text-[9px] font-pixel-title flex flex-col items-center justify-center gap-0.5 border transition-all ${
                      activeCanonTab === 'laptop-host'
                        ? 'bg-[#5CE1E6] text-[#050C38] border-white font-bold shadow'
                        : 'bg-[#131947] text-white/70 border-[#4B57B2] hover:bg-[#160078]'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span className="truncate">3. HOST LAPTOP</span>
                  </button>
                </div>

                {/* Konten Tab 1: Alur Bilik Nirkabel Tablet (Rekomendasi Standar Photobooth) */}
                {activeCanonTab === 'wireless-tablet' && (
                  <div className="bg-[#0C1230] p-3 border border-[#FFD84D]/60 text-left text-[10px] font-sans space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[#FFD84D] font-pixel-title text-[10px]">
                      <Tablet className="w-4 h-4 text-[#FFD84D]" />
                      <span>CARA MEMBUKA APLIKASI DI TABLET (REKOMENDASI TERBAIK):</span>
                    </div>
                    <p className="text-white/80 leading-relaxed">
                      Kamera Canon dicolok dengan kabel USB ke Laptop. Tablet Anda cukup menjadi layar sentuh bilik photobooth tanpa kabel menjuntai!
                    </p>

                    <div className="bg-[#050C38] p-2 border border-[#4B57B2] flex items-center justify-between gap-2">
                      <div className="truncate font-mono text-xs text-[#00E599]">
                        {tabletConnectionInfo.tabletBoothUrl || `http://192.168.110.93:3000/booth`}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyTabletUrl}
                        className="px-2.5 py-1 pixel-btn bg-[#FFD84D] hover:bg-[#FFE57F] text-[#050C38] text-[9px] font-pixel-title font-bold shrink-0 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{isCopiedUrl ? 'TERSALIN! ✓' : 'SALIN LINK'}</span>
                      </button>
                    </div>

                    <ol className="list-decimal list-inside text-white/75 space-y-1 pl-1">
                      <li>Pastikan Tablet dan Laptop terhubung ke Wi-Fi / Hotspot yang sama.</li>
                      <li>Buka Google Chrome di tablet, lalu ketik alamat link di atas.</li>
                      <li>Aplikasi bilik foto langsung aktif di tablet, dan saat hitungan mundur selesai, kamera Canon di laptop otomatis menjepret!</li>
                    </ol>
                  </div>
                )}

                {/* Konten Tab 2: USB OTG Tablet & Solusi Redmi Pad 2 */}
                {activeCanonTab === 'usb-otg' && (
                  <div className="bg-[#0C1230] p-3 border border-[#00E599]/60 text-left text-[10px] font-sans space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[#00E599] font-pixel-title text-[10px]">
                      <Usb className="w-4 h-4 text-[#00E599]" />
                      <span>KONEKSI KABEL USB OTG LANGSUNG KE REDMI PAD 2:</span>
                    </div>

                    {/* Panduan Spesifik Redmi Pad 2 */}
                    <div className="p-2.5 bg-[#131947] border border-[#5CE1E6]/60 text-white/90 leading-relaxed space-y-1.5">
                      <p className="font-bold text-[#FFD84D] font-pixel-title text-[9px]">
                        📱 PANDUAN PENGGUNA REDMI PAD 2 (XIAOMI):
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[9.5px] text-white/80">
                        <li>
                          <strong>Wajib Buka di Google Chrome:</strong> Jangan gunakan <em>Mi Browser</em> (browser bawaan Xiaomi), karena Mi Browser mematikan fitur WebUSB.
                        </li>
                        <li>
                          <strong>Tutup Camera Connect &amp; Control:</strong> Pastikan aplikasi tersebut di-swipe tutup dari Recent Apps agar port USB tidak terkunci eksklusif.
                        </li>
                        <li>
                          <strong>Aktifkan Izin USB di Chrome (Khusus HTTP):</strong> Di Chrome tablet, buka tab baru lalu ketik <code className="text-[#00E599] bg-black/60 px-1 font-mono">chrome://flags</code> &rarr; cari <code className="text-[#FFD84D]">unsafely-treat-insecure-origin-as-secure</code> &rarr; pilih <strong>Enabled</strong> &rarr; masukkan alamat IP laptop &rarr; klik tombol biru <strong>Relaunch</strong>.
                        </li>
                      </ul>
                    </div>

                    <div className="p-2 bg-[#FFD84D]/10 border border-[#FFD84D]/40 text-[#FFD84D] text-[9.5px]">
                      💡 <strong>SARAN TERBAIK (TANPA KABEL KE TABLET):</strong>
                      <br />
                      Jika kamera Canon dicolok ke <strong>Laptop</strong>, Anda <strong>TIDAK PERLU</strong> repot mengatur kabel USB di tablet! Cukup gunakan <strong>Tab 1 (BUKA DI TABLET)</strong>. Tablet langsung berfungsi sebagai layar sentuh nirkabel.
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectWebUsb}
                      className="w-full py-2.5 pixel-btn bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] text-[10px] font-pixel-title font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow"
                    >
                      <Usb className="w-4 h-4 text-[#050C38]" />
                      <span>HUBUNGKAN CANON KE TABLET (WebUSB)</span>
                    </button>

                    {tabletUsbStatus && (
                      <div className={`p-2 border text-[9.5px] font-mono leading-relaxed ${tabletUsbStatus.connected ? 'bg-[#00E599]/20 border-[#00E599] text-[#00E599]' : 'bg-[#FE0168]/20 border-[#FE0168] text-[#FFD84D]'}`}>
                        {tabletUsbStatus.connected
                          ? `✓ Sukses Terhubung: ${tabletUsbStatus.deviceName}`
                          : `✕ ${tabletUsbStatus.error}`}
                      </div>
                    )}
                  </div>
                )}

                {/* Konten Tab 3: Host Laptop & digiCamControl */}
                {activeCanonTab === 'laptop-host' && (
                  <div className="bg-[#0C1230] p-3 border border-[#5CE1E6]/60 text-left text-[10px] font-sans space-y-2">
                    <div className="flex items-center gap-1.5 text-[#5CE1E6] font-pixel-title text-[10px]">
                      <Laptop className="w-4 h-4 text-[#5CE1E6]" />
                      <span>KONTROL RANA FISIK VIA DIGICAMCONTROL DI LAPTOP:</span>
                    </div>
                    <p className="text-white/80 leading-relaxed">
                      Hubungkan Canon ke port USB Laptop. Buka software gratis <span className="text-[#00E599] font-bold">digiCamControl</span> (server port 5513). Rana fisik dan lampu flash kamera Canon akan menyala otomatis saat berfoto.
                    </p>
                    <div className="p-1.5 bg-[#050C38] border border-white/10 text-[9px] text-[#A9B8FF] font-mono">
                      Status digiCamControl: <span className={canonApiStatus.connected ? 'text-[#00E599] font-bold' : 'text-[#FFD84D]'}>{canonApiStatus.connected ? 'Online ✓' : 'Belum Terdeteksi (Pastikan software dibuka)'}</span>
                    </div>
                  </div>
                )}

                {/* Pratinjau Snapshot Uji Coba Canon jika ada */}
                {testSnapshotUrl && (
                  <div className="w-56 aspect-[4/3] mx-auto border-2 border-[#FFD84D] my-3 bg-black overflow-hidden shadow-lg relative">
                    <img src={testSnapshotUrl} alt="Hasil Snapshot Canon" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[#00E599] text-[8px] font-pixel-title px-1 border border-[#00E599]/40">
                      HASIL UJI CANON
                    </span>
                  </div>
                )}

                {/* Tombol Aksi Bawah */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={scanAndCheckCanon}
                    disabled={isScanningCanon}
                    className="py-2 px-3 pixel-btn bg-[#131947] hover:bg-[#160078] text-[#5CE1E6] text-[10px] font-pixel-title border border-[#4B57B2] active:scale-95 flex items-center justify-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningCanon ? 'animate-spin' : ''}`} />
                    <span>PINDAI ULANG</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (soundEnabled) retroAudio.playShutterSound();
                      try {
                        const res = await fetch('/api/canon', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isTest: true, photoIndex: 0, visitorName: 'Uji Coba Tablet' }),
                        });
                        const json = await res.json();
                        if (json.success && json.photoUrl) {
                          setTestSnapshotUrl(json.photoUrl);
                          if (soundEnabled) retroAudio.playSuccessChime();
                        }
                      } catch {
                        alert('Gagal menguji API Canon');
                      }
                    }}
                    className="flex-1 py-2 pixel-btn bg-[#FFD84D] hover:bg-[#FFE57F] text-[#050C38] text-[10px] font-pixel-title font-bold flex items-center justify-center gap-1 active:scale-95 shadow"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#050C38]" />
                    <span>📸 TES JEPRET CANON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWebcamModalOpen(false)}
                    className="py-2 px-3 pixel-btn bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] text-[10px] font-pixel-title font-bold active:scale-95"
                  >
                    GUNAKAN CANON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Panduan Download & Pasang APK Mandiri dari GitHub (Khusus Tablet Redmi Pad 2) */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-pixel">
          <div className="bg-[#050C38] border-2 sm:border-4 border-[#FFD84D] w-full max-w-xl p-4 sm:p-6 shadow-[0_0_30px_rgba(5,12,56,0.9)] relative pixel-box max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsInstallModalOpen(false)}
              className="absolute top-3 right-3 text-[#FFD84D] hover:text-[#FE0168] p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-3 mb-4 border-b-2 border-[#4B57B2] pb-3">
              <div className="w-11 h-11 bg-[#FE0168]/20 border-2 border-[#FE0168] text-[#FE0168] flex items-center justify-center shrink-0">
                <Tablet className="w-6 h-6 text-[#FFD84D]" />
              </div>
              <div>
                <h3 className="font-pixel-title text-xs sm:text-sm text-[#FFD84D]">
                  UNDUH APK PHOTOBOOTH HIMATIK (ANDROID)
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#5CE1E6] font-sans">
                  Aplikasi Tablet Redmi Pad 2 &bull; Layar Penuh Tanpa Google Chrome
                </p>
              </div>
            </div>

            {/* Konten Utama: Download + QR Code + Langkah Pemasangan */}
            <div className="space-y-4 text-xs font-sans text-white/90 mb-5">
              
              {/* Kartu Tombol Unduh & QR Code */}
              <div className="p-3.5 bg-[#0C1230] border-2 border-[#00E599] flex flex-col sm:flex-row items-center gap-4">
                {/* QR Code untuk Kamera Tablet */}
                <div className="flex flex-col items-center shrink-0 bg-white p-2 border-2 border-[#4B57B2]">
                  {apkQrDataUrl ? (
                    <img src={apkQrDataUrl} alt="QR Code GitHub Releases APK" className="w-28 h-28 pixel-art" />
                  ) : (
                    <div className="w-28 h-28 bg-[#050C38] flex items-center justify-center text-[#FFD84D]">
                      <QrCode className="w-8 h-8 animate-pulse" />
                    </div>
                  )}
                  <span className="text-[9px] text-[#050C38] font-bold mt-1 text-center font-pixel">
                    SCAN DENGAN TABLET
                  </span>
                </div>

                {/* Tombol Aksi Unduh */}
                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <div className="text-[11px] text-white/80 leading-relaxed">
                    Unduh paket aplikasi <span className="text-[#00E599] font-mono font-bold">photobooth-himatik.apk</span> (Sertifikat Resmi Terverifikasi) dari GitHub Releases:
                  </div>

                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 pixel-btn bg-[#00E599] hover:bg-[#5CE1E6] text-[#050C38] font-pixel-title font-bold text-[11px] flex items-center justify-center gap-2 shadow active:scale-95 text-center"
                  >
                    <Download className="w-4 h-4 text-[#050C38]" />
                    <span>⬇️ BUKA GITHUB RELEASES (UNDUH APK)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#050C38]" />
                  </a>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(APK_DOWNLOAD_URL);
                        setIsCopiedApkUrl(true);
                        setTimeout(() => setIsCopiedApkUrl(false), 2500);
                        if (soundEnabled) retroAudio.playSuccessChime();
                      }}
                      className="flex-1 py-1.5 px-2 bg-[#131947] hover:bg-[#160078] border border-[#5CE1E6] text-[#5CE1E6] text-[10px] font-pixel flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{isCopiedApkUrl ? 'LINK APK TERSALIN! ✓' : 'Salin Link Langsung APK'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Panduan 4 Langkah Pasang di Redmi Pad 2 */}
              <div className="space-y-2">
                <div className="p-2.5 bg-[#0C1230] border border-[#4B57B2] flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-[#FFD84D] text-[#050C38] font-pixel font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <p className="font-bold text-[#FFD84D] font-pixel text-[10px]">UNDUH FILE .APK DARI GITHUB</p>
                    <p className="text-white/80 text-[10.5px]">
                      Buka rilis GitHub melalui tombol di atas atau scan QR di tablet Redmi Pad 2, lalu unduh file <strong>photobooth-himatik.apk</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-[#0C1230] border border-[#4B57B2] flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-[#5CE1E6] text-[#050C38] font-pixel font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <p className="font-bold text-[#5CE1E6] font-pixel text-[10px]">PASANG (INSTALL) DI TABLET</p>
                    <p className="text-white/80 text-[10.5px]">
                      Buka file APK yang telah diunduh di Redmi Pad 2 &gt; pilih <strong>Pasang / Install</strong>. Paket sudah ditandatangani sertifikat resmi v1 + v2.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-[#0C1230] border border-[#4B57B2] flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-[#FE0168] text-white font-pixel font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <p className="font-bold text-[#FE0168] font-pixel text-[10px]">BUKA APLIKASI &amp; SAMBUNGKAN KE LAPTOP</p>
                    <p className="text-white/80 text-[10.5px]">
                      Buka aplikasi <strong>Photobooth HIMATIK</strong> di tablet. Masukkan alamat IP laptop ini:
                    </p>
                    <code className="inline-block mt-1 p-1 bg-black/70 text-[#00E599] font-mono text-[10.5px] border border-white/20 select-all">
                      {tabletConnectionInfo.tabletBoothUrl || 'http://192.168.1.100:3000/booth'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Info Keunggulan Kiosk */}
              <div className="p-2.5 bg-[#FFD84D]/10 border border-[#FFD84D]/40 text-[10.5px] text-[#FFD84D] leading-relaxed">
                ✨ <strong>Keunggulan Photobooth HIMATIK:</strong> Berjalan <strong>100% Layar Penuh (Fullscreen)</strong> tanpa bilah URL Google Chrome, layar tablet dijamin <strong>tidak akan tidur/mati</strong> saat pengunjung mengantre, dan izin kamera langsung otomatis!
              </div>

              {/* Opsi Cadangan: PWA jika ada */}
              {deferredPrompt && (
                <div className="pt-2 border-t border-white/10 text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      deferredPrompt.prompt();
                      const choice = await deferredPrompt.userChoice;
                      if (choice && choice.outcome === 'accepted') {
                        setIsStandaloneApp(true);
                        setIsInstallModalOpen(false);
                      }
                    }}
                    className="text-[10px] text-[#A9B8FF] hover:text-white underline font-sans"
                  >
                    Atau pasang instan WebAPK via Chrome di tablet ini &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Tombol Tutup */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(false)}
                className="w-full py-2.5 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white font-pixel-title font-bold text-xs active:scale-95 text-center"
              >
                TUTUP PANDUAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
