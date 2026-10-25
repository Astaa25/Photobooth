import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, Check, AlertCircle, RefreshCw, Wand2, Eye, Palette } from 'lucide-react';
import type { FrameTemplateItem, FrameSlotItem } from '@/app/api/frames/route';
import {
  detectSlotsAndPunchHoles,
  BENCHMARK_COLORS,
} from '@/utils/slotColorDetector';

interface PixelTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: FrameTemplateItem | null; // null if creating a new template
  onSave: (savedTemplate: FrameTemplateItem) => void;
}

// Koordinat Kanvas Standar Cetak 4R (1200 × 1800 px)
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1800;

/**
 * Generator Tata Letak Otomatis (Proporsional & Anti-Gepeng)
 */
export function generateAutoSlots(category: string, photoCount: number): FrameSlotItem[] {
  const cat = (category || 'grid').toLowerCase();

  if (cat.includes('strip')) {
    // Strip Ganda 4R: 2 kolom berdampingan dengan 4 foto per kolom (atau N foto)
    const colWidth = 510;
    const gapX = 60;
    const left1 = 60;
    const left2 = left1 + colWidth + gapX; // 630
    const topY = 260;
    const availableH = 1420;
    const count = Math.max(1, Math.min(4, photoCount));
    const slotH = Math.floor((availableH - (count - 1) * 20) / count);

    const slots: FrameSlotItem[] = [];
    // Kolom 1
    for (let p = 0; p < count; p++) {
      slots.push({
        x: left1,
        y: topY + p * (slotH + 20),
        width: colWidth,
        height: slotH,
        photo: p,
      });
    }
    // Kolom 2 (salinan strip ganda)
    for (let p = 0; p < count; p++) {
      slots.push({
        x: left2,
        y: topY + p * (slotH + 20),
        width: colWidth,
        height: slotH,
        photo: p,
      });
    }
    return slots;
  }

  if (cat.includes('grid') || photoCount === 4) {
    // Kisi 2x2 persis Gambar 1
    return [
      { x: 50, y: 330, width: 530, height: 600, photo: 0 },
      { x: 620, y: 330, width: 530, height: 600, photo: 1 },
      { x: 50, y: 960, width: 530, height: 600, photo: 2 },
      { x: 620, y: 960, width: 530, height: 600, photo: 3 },
    ];
  }

  if (cat.includes('trio') || photoCount === 3) {
    // 3 Foto Bertingkat Simetris
    return [
      { x: 100, y: 300, width: 1000, height: 430, photo: 0 },
      { x: 100, y: 760, width: 1000, height: 430, photo: 1 },
      { x: 100, y: 1220, width: 1000, height: 430, photo: 2 },
    ];
  }

  if (cat.includes('duo') || photoCount === 2) {
    // 2 Foto Bertingkat
    return [
      { x: 100, y: 320, width: 1000, height: 650, photo: 0 },
      { x: 100, y: 1010, width: 1000, height: 650, photo: 1 },
    ];
  }

  // Single 1 Foto Besar
  return [{ x: 100, y: 300, width: 1000, height: 1350, photo: 0 }];
}

export function PixelTemplateEditorModal({
  isOpen,
  onClose,
  template,
  onSave,
}: PixelTemplateEditorModalProps) {
  // State Form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Grid');
  const [photoCount, setPhotoCount] = useState(4);
  const [tags, setTags] = useState('grid, 4 foto, cetak 4R, night city');
  const [bgColor, setBgColor] = useState('#131947');
  const [order, setOrder] = useState(1);
  const [showInBooth, setShowInBooth] = useState(true);
  const [frameImageBase64, setFrameImageBase64] = useState<string | null>(null);
  const [framePreviewUrl, setFramePreviewUrl] = useState<string>('');
  const [slotsJson, setSlotsJson] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // State Deteksi Warna Patokan (Benchmark Chroma Color)
  const [benchmarkColor, setBenchmarkColor] = useState<string>('#FF00FF');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectSuccessMsg, setDetectSuccessMsg] = useState<string | null>(null);
  const [detectErrorMsg, setDetectErrorMsg] = useState<string | null>(null);

  // Inisialisasi data form saat modal dibuka atau template berubah
  useEffect(() => {
    if (!isOpen) return;

    if (template) {
      setName(template.name || '');
      setDesc(template.desc || '');
      setCategory(template.category || (template.previewType ? template.previewType.charAt(0).toUpperCase() + template.previewType.slice(1) : 'Grid'));
      setPhotoCount(template.photoCount || 4);
      setTags(Array.isArray(template.tags) ? template.tags.join(', ') : 'grid, 4 foto, cetak 4R');
      setBgColor(template.bgColor || '#131947');
      setOrder(template.order || 1);
      setShowInBooth(template.showInBooth !== false);
      setFramePreviewUrl(template.frameImage || '');
      setFrameImageBase64(null);

      const defaultSlots = template.slots && template.slots.length > 0
        ? template.slots
        : generateAutoSlots(template.category || template.previewType || 'grid', template.photoCount || 4);

      setSlotsJson(JSON.stringify(defaultSlots, null, 2));
    } else {
      // Mode Tambah Template Baru
      setName('');
      setDesc('');
      setCategory('Grid');
      setPhotoCount(4);
      setTags('grid, 4 foto, cetak 4R');
      setBgColor('#131947');
      setOrder(99);
      setShowInBooth(true);
      setFramePreviewUrl('');
      setFrameImageBase64(null);
      setSlotsJson(JSON.stringify(generateAutoSlots('Grid', 4), null, 2));
    }
    setServerError(null);
  }, [isOpen, template]);

  // Validasi Real-time JSON Koordinat Slot (Mengikuti TemplateController.php Gambar 2)
  const validationResult = useMemo(() => {
    try {
      const parsed = JSON.parse(slotsJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { valid: false, error: 'Tata letak harus memuat array JSON minimal 1 slot.', slots: [] };
      }

      const seen: Record<number, boolean> = {};
      const cleanSlots: FrameSlotItem[] = [];

      for (let i = 0; i < parsed.length; i++) {
        const s = parsed[i];
        const n = i + 1;
        const x = Math.round(Number(s.x));
        const y = Math.round(Number(s.y));
        const width = Math.round(Number(s.width));
        const height = Math.round(Number(s.height));
        const photo = typeof s.photo === 'number' && !isNaN(s.photo) ? Math.round(s.photo) : i;

        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
          return { valid: false, error: `Slot ${n} memiliki nilai koordinat yang bukan angka.`, slots: [] };
        }

        const slot = { x, y, width, height, photo };

        // 1. Cek keluar kanvas 1200x1800 px (Gambar 2: baris 183-186)
        if (
          slot.width < 1 ||
          slot.height < 1 ||
          slot.x < 0 ||
          slot.y < 0 ||
          slot.x + slot.width > CANVAS_WIDTH ||
          slot.y + slot.height > CANVAS_HEIGHT
        ) {
          return {
            valid: false,
            error: `Slot ${n} keluar dari kanvas ${CANVAS_WIDTH}x${CANVAS_HEIGHT} px.`,
            slots: [],
          };
        }

        // 2. Cek nomor foto melebihi jumlah foto (Gambar 2: baris 187-189)
        if (slot.photo < 0 || slot.photo >= photoCount) {
          return {
            valid: false,
            error: `Slot ${n} merujuk foto ke-${slot.photo + 1}, padahal jumlah foto hanya ${photoCount}.`,
            slots: [],
          };
        }

        seen[slot.photo] = true;
        cleanSlots.push(slot);
      }

      // 3. Cek semua foto punya minimal 1 slot (Gambar 2: baris 194-199)
      for (let p = 0; p < photoCount; p++) {
        if (!seen[p]) {
          return {
            valid: false,
            error: `Foto ke-${p + 1} belum punya slot di tata letak.`,
            slots: [],
          };
        }
      }

      const uniquePhotos = Object.keys(seen).length;

      return {
        valid: true,
        error: null,
        slots: cleanSlots,
        uniquePhotos,
        slotCount: cleanSlots.length,
      };
    } catch {
      return {
        valid: false,
        error: 'Format JSON koordinat tidak valid (periksa koma dan kurung siku).',
        slots: [],
      };
    }
  }, [slotsJson, photoCount]);

  // Handler Unggah File Bingkai PNG
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('image')) {
      alert('Disarankan mengunggah file PNG dengan area transparan (1200x1800 px).');
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setFrameImageBase64(base64);
      setFramePreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Handler Isi Tata Letak Otomatis (Deteksi Warna Patokan atau Fallback Preset)
  const handleAutoFillLayout = async () => {
    const targetImage = frameImageBase64 || framePreviewUrl;
    setDetectSuccessMsg(null);
    setDetectErrorMsg(null);

    if (targetImage) {
      setIsDetecting(true);
      try {
        const result = await detectSlotsAndPunchHoles(
          targetImage,
          benchmarkColor,
          Number(photoCount),
          category
        );

        if (result.success && result.slots.length > 0) {
          setSlotsJson(JSON.stringify(result.slots, null, 2));
          if (result.punchedImageBase64) {
            setFrameImageBase64(result.punchedImageBase64);
            setFramePreviewUrl(result.punchedImageBase64);
          }
          setDetectSuccessMsg(result.message);
        } else {
          setDetectErrorMsg(result.message);
          // Fallback ke preset geometri jika tidak ada kotak warna terdeteksi
          const auto = generateAutoSlots(category, Number(photoCount));
          setSlotsJson(JSON.stringify(auto, null, 2));
        }
      } catch (err: any) {
        setDetectErrorMsg(err?.message || 'Gagal memindai warna patokan.');
        const auto = generateAutoSlots(category, Number(photoCount));
        setSlotsJson(JSON.stringify(auto, null, 2));
      } finally {
        setIsDetecting(false);
      }
    } else {
      const auto = generateAutoSlots(category, Number(photoCount));
      setSlotsJson(JSON.stringify(auto, null, 2));
      setDetectSuccessMsg('Tata letak diisi berdasarkan preset geometri standar.');
    }
  };

  // Handler Submit Simpan Perubahan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult.valid) {
      setServerError(validationResult.error || 'Periksa kembali JSON tata letak Anda.');
      return;
    }
    if (!name.trim()) {
      setServerError('Nama template wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const isEdit = Boolean(template?.slug);
      const url = '/api/frames';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        slug: template?.slug,
        name: name.trim().toUpperCase(),
        desc: desc.trim(),
        photoCount: Number(photoCount),
        category,
        previewType: (category.toLowerCase() as any) || 'grid',
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        bgColor,
        order: Number(order),
        showInBooth,
        frameImageBase64: frameImageBase64 || framePreviewUrl,
        slots: validationResult.slots,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyimpan template.');
      }

      onSave(data.data);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Terjadi kesalahan saat menyimpan template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto font-pixel">
      <div className="relative w-full max-w-4xl bg-[#090D2C] border-4 border-[#35408E] p-4 sm:p-7 shadow-[8px_8px_0_0_#020517] my-auto text-white">
        {/* Tombol Tutup Silang di Kanan Atas */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A9B8FF] hover:text-[#FE0168] p-1.5 transition-colors"
          title="Tutup (ESC)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal Persis Gambar 1 */}
        <div className="mb-5 pb-3 border-b-2 border-[#1E2768]">
          <h2 className="font-pixel-title text-base sm:text-xl text-white tracking-wide">
            {template ? 'UBAH TEMPLATE' : 'TAMBAH TEMPLATE'}
          </h2>
          <p className="font-pixel-title text-[10px] sm:text-xs text-[#5CE1E6] mt-0.5">
            {template ? template.name : 'Desain Baru untuk Bilik Booth'}
          </p>
        </div>

        {/* Pesan Error Server jika Ada */}
        {serverError && (
          <div className="mb-4 bg-[#FE0168]/20 border-2 border-[#FE0168] p-3 flex items-start gap-2.5 text-xs text-[#FFD84D]">
            <AlertCircle className="w-4 h-4 text-[#FE0168] shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field: Nama template */}
          <div>
            <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
              Nama template
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Night City Grid"
              required
              className="w-full bg-[#050C38] border-2 border-[#35408E] focus:border-[#5CE1E6] text-white px-3.5 py-2.5 text-xs outline-none"
            />
          </div>

          {/* Field: Deskripsi (opsional) */}
          <div>
            <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
              Deskripsi (opsional)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Empat foto dalam kisi 2×2 dengan latar skyline malam."
              className="w-full bg-[#050C38] border-2 border-[#35408E] focus:border-[#5CE1E6] text-white px-3.5 py-2 text-xs outline-none resize-none leading-relaxed font-sans"
            />
          </div>

          {/* Baris 2 Kolom: Kategori & Jumlah Foto (1-4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#050C38] border-2 border-[#35408E] focus:border-[#5CE1E6] text-white px-3 py-2 text-xs outline-none"
              >
                <option value="Grid">Grid (Kisi 2x2)</option>
                <option value="Strip">Strip (Strip Ganda Photobooth)</option>
                <option value="Trio">Trio (3 Foto Bertingkat)</option>
                <option value="Duo">Duo (2 Foto Berdua)</option>
                <option value="Single">Single (Poster 1 Foto)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
                Jumlah Foto (1-4)
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={photoCount}
                onChange={(e) => setPhotoCount(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
                className="w-full bg-[#050C38] border-2 border-[#35408E] focus:border-[#5CE1E6] text-white px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>

          {/* Baris 2 Kolom: Tag & Warna latar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
                Tag (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="grid, 4 foto, cetak 4R, night city"
                className="w-full bg-[#050C38] border-2 border-[#35408E] focus:border-[#5CE1E6] text-white px-3 py-2 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
                Warna latar
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor.startsWith('#') && bgColor.length === 7 ? bgColor : '#131947'}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 cursor-pointer border-2 border-[#35408E] bg-transparent p-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  placeholder="#131947"
                  className="w-full bg-[#050C38] border-2 border-[#35408E] focus:border-[#5CE1E6] text-white px-3 py-2 text-xs outline-none uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* Baris 2 Kolom: Urutan tampil & Checkbox Tampilkan di booth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
            <div>
              <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
                Urutan tampil
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 1)}
                className="w-full bg-[#050C38] border-2 border-[#35408E] focus:border-[#5CE1E6] text-white px-3 py-2 text-xs outline-none"
              />
            </div>

            <div className="pt-4 sm:pt-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showInBooth}
                  onChange={(e) => setShowInBooth(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${
                    showInBooth
                      ? 'bg-[#FFD84D] border-[#FFD84D] text-[#050C38]'
                      : 'bg-[#050C38] border-[#35408E]'
                  }`}
                >
                  {showInBooth && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-pixel-title text-white">
                  Tampilkan di booth
                </span>
              </label>
            </div>
          </div>

          {/* File bingkai PNG */}
          <div>
            <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
              File bingkai (PNG transparan disarankan, 1200×1800 px)
            </label>
            <div className="flex items-center gap-3 bg-[#050C38] border-2 border-[#35408E] p-2 text-xs">
              <label className="px-3 py-1.5 bg-[#1E2768] hover:bg-[#35408E] text-white cursor-pointer font-pixel-title text-[10px] flex items-center gap-1.5 border border-white/20">
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih File Bingkai</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-white/60 truncate">
                {frameImageBase64 ? 'File baru dipilih (siap disimpan)' : framePreviewUrl ? framePreviewUrl : 'Belum ada file dipilih'}
              </span>
            </div>
            <p className="text-[9px] text-white/50 mt-1 leading-snug font-sans">
              Bingkai ditempel di atas foto. Beri jendela transparan di posisi foto. Kosongkan untuk tetap memakai bingkai saat ini.
            </p>
          </div>

          {/* ===================================================================
              TATA LETAK FOTO (JSON) - DUA SISI PERSIS GAMBAR 1
              =================================================================== */}
          <div className="pt-2">
            <label className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-2">
              Tata letak Foto (JSON)
            </label>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Sisi Kiri: Pratinjau Kanvas Proporsional 1200x1800 px (Rasio 2:3) */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div
                  className="relative w-48 sm:w-56 aspect-[2/3] border-4 border-[#35408E] shadow-[4px_4px_0_0_#020517] overflow-hidden"
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Gambar Frame Overlay jika ada */}
                  {framePreviewUrl && (
                    <img
                      src={framePreviewUrl}
                      alt="Frame Overlay"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 opacity-90 pixel-art"
                    />
                  )}

                  {/* Slot-slot foto yang digambar proporsional sesuai JSON */}
                  {validationResult.slots.map((s, idx) => {
                    const leftPercent = (s.x / CANVAS_WIDTH) * 100;
                    const topPercent = (s.y / CANVAS_HEIGHT) * 100;
                    const widthPercent = (s.width / CANVAS_WIDTH) * 100;
                    const heightPercent = (s.height / CANVAS_HEIGHT) * 100;

                    return (
                      <div
                        key={idx}
                        style={{
                          left: `${leftPercent}%`,
                          top: `${topPercent}%`,
                          width: `${widthPercent}%`,
                          height: `${heightPercent}%`,
                        }}
                        className="absolute border-2 border-[#FE0168] bg-[#050C38]/80 text-[#FFD84D] flex flex-col items-center justify-center font-pixel-title z-0 group hover:border-[#00E599] transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-bold drop-shadow">
                          {s.photo + 1}
                        </span>
                        <span className="text-[7px] text-white/60 font-mono scale-90">
                          #{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <span className="text-[9px] text-[#A9B8FF] mt-1.5 font-pixel-title">
                  Pratinjau Kanvas 1200×1800 px (4R)
                </span>
              </div>

              {/* Sisi Kanan: Textarea JSON + Validasi + Tombol Isi Otomatis */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-2.5">
                <div className="relative">
                  <textarea
                    value={slotsJson}
                    onChange={(e) => setSlotsJson(e.target.value)}
                    rows={8}
                    className="w-full bg-[#050C38] border-2 border-[#35408E] focus:border-[#5CE1E6] text-[#00E599] px-3 py-2 font-mono text-[11px] leading-relaxed outline-none resize-none"
                    spellCheck={false}
                  />
                </div>

                {/* Validasi Banner */}
                {!validationResult.valid ? (
                  <div className="bg-[#FE0168]/20 border border-[#FE0168] p-2 text-[10px] text-[#FFD84D] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#FE0168] shrink-0" />
                    <span>{validationResult.error}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-[#00E599] font-pixel-title flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#00E599]" />
                    <span>
                      {validationResult.slotCount} slot menampilkan {validationResult.uniquePhotos} foto unik.
                    </span>
                  </div>
                )}

                <p className="text-[9px] text-white/60 leading-snug font-sans">
                  Kanvas 1200×1800 px (cetak 4R). photo menunjuk foto ke-berapa (mulai 0), jadi satu foto bisa dipakai di dua slot untuk strip ganda. Foto otomatis dipotong sesuai rasio slot tanpa gepeng.
                </p>

                {/* PILIHAN WARNA PATOKAN SLOT (BENCHMARK CHROMA COLOR) */}
                <div className="bg-[#050C38] border border-[#35408E] p-2.5 rounded-none">
                  <div className="flex items-center gap-1.5 text-[10px] font-pixel-title text-[#FFD84D] mb-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    <span>WARNA PATOKAN SLOT DI DESAIN:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {BENCHMARK_COLORS.map((bc) => (
                      <button
                        key={bc.id}
                        type="button"
                        onClick={() => setBenchmarkColor(bc.hex)}
                        className={`p-1.5 flex items-center gap-1.5 text-left border transition-all ${
                          benchmarkColor === bc.hex
                            ? 'border-[#FFD84D] bg-[#1E2768] shadow-[2px_2px_0_0_#FFD84D]'
                            : 'border-white/10 bg-[#090D2C] hover:border-white/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 shrink-0 border border-black"
                          style={{ backgroundColor: bc.hex }}
                        />
                        <span className="font-pixel-title text-[8px] truncate text-white">
                          {bc.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[8px] text-[#A9B8FF]/80 leading-tight">
                    💡 <span className="text-[#FFD84D]">Tips:</span> Warnai kotak jendela foto pada file template Anda dengan warna patokan (misal <b>Magenta #FF00FF</b>). Sistem akan otomatis mendeteksi koordinat dan melubangi area tersebut menjadi transparan!
                  </p>
                </div>

                {/* Pesan Sukses / Galat Deteksi Otomatis */}
                {detectSuccessMsg && (
                  <div className="bg-[#00E599]/20 border border-[#00E599] p-2 text-[10px] text-[#00E599] flex items-center gap-1.5 font-pixel">
                    <Check className="w-3.5 h-3.5 text-[#00E599] shrink-0" />
                    <span>{detectSuccessMsg}</span>
                  </div>
                )}
                {detectErrorMsg && (
                  <div className="bg-[#FE0168]/20 border border-[#FE0168] p-2 text-[10px] text-[#FFD84D] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#FE0168] shrink-0" />
                    <span>{detectErrorMsg}</span>
                  </div>
                )}

                {/* Tombol [ Isi tata letak otomatis ] */}
                <button
                  type="button"
                  onClick={handleAutoFillLayout}
                  disabled={isDetecting}
                  className="w-full sm:w-auto px-4 py-2.5 pixel-btn bg-[#1E2768] hover:bg-[#35408E] text-[#5CE1E6] font-pixel-title text-[10px] flex items-center justify-center gap-2 border border-[#5CE1E6]/40 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isDetecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFD84D]" />
                      <span>MEMINDAI WARNA PATOKAN...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-[#FFD84D]" />
                      <span>ISI TATA LETAK OTOMATIS (PINDAI WARNA)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ===================================================================
              TOMBOL AKSI BAWAH: [ SIMPAN PERUBAHAN ] (KUNING) & [ Batal ]
              =================================================================== */}
          <div className="flex items-center gap-3 pt-4 border-t-2 border-[#1E2768]">
            <button
              type="submit"
              disabled={isSubmitting || !validationResult.valid}
              className={`px-6 py-2.5 pixel-btn font-pixel-title text-xs font-bold transition-all border-2 border-black ${
                validationResult.valid && !isSubmitting
                  ? 'bg-[#FFD84D] hover:bg-[#FFE57F] text-[#050C38] shadow-[3px_3px_0_0_#000] active:scale-95'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-700'
              }`}
            >
              {isSubmitting ? 'MENYIMPAN...' : template ? 'SIMPAN PERUBAHAN' : 'SIMPAN TEMPLATE'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 pixel-btn bg-[#171B3E] hover:bg-[#252B62] text-[#A9B8FF] font-pixel-title text-xs border border-[#3B4588] active:scale-95"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
