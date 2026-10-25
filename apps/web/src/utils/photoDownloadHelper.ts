/**
 * Utilitas Unduh Foto & Komposisi Strip 4R (Client-side HTML5 Canvas)
 * Menjamin tombol unduh selalu berhasil mengunduh file JPEG beresolusi tinggi (1200x1800 4R),
 * menempatkan foto secara presisi di lubang/slot bingkai, dan mendukung unduh foto individual.
 */

export interface PhotoSlotConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  photo?: number;
  source_index?: number;
}

export interface CompositeDownloadOptions {
  photos: string[];
  frameImage?: string;
  slots?: PhotoSlotConfig[];
  canvasWidth?: number;
  canvasHeight?: number;
  visitorName?: string;
  ticketNumber?: string;
  templateName?: string;
  fileName?: string;
}

/**
 * Muat gambar dari URL atau data:image secara aman ke HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback tanpa crossOrigin jika gagal
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (err) => reject(err);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Gambar gambar ke canvas dengan efek 'object-fit: cover'
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) return;

  const targetRatio = w / h;
  const imgRatio = imgW / imgH;

  let sourceW = imgW;
  let sourceH = imgH;
  let sourceX = 0;
  let sourceY = 0;

  if (imgRatio > targetRatio) {
    sourceW = imgH * targetRatio;
    sourceX = (imgW - sourceW) / 2;
  } else {
    sourceH = imgW / targetRatio;
    sourceY = (imgH - sourceH) / 2;
  }

  ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, x, y, w, h);
}

/**
 * Gambar kartu foto sintetis bergaya retro jika input adalah warna hex
 */
function drawColorCard(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string
) {
  ctx.save();
  // Latar warna foto
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  // Efek gradien bayangan
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Label Pose
  ctx.fillStyle = 'rgba(5, 12, 56, 0.75)';
  ctx.fillRect(x + w / 2 - 60, y + h / 2 - 18, 120, 36);
  ctx.strokeStyle = '#FFD84D';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + w / 2 - 60, y + h / 2 - 18, 120, 36);

  ctx.fillStyle = '#FFD84D';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}

/**
 * Hitung slot default jika template tidak memiliki konfigurasi slots eksplisit
 */
export function getDefaultSlots(photoCount: number, width = 1200, height = 1800): PhotoSlotConfig[] {
  if (photoCount === 4) {
    // Format Dual Strip Photobooth (2 Kolom x 4 Baris = 8 slot, presisi night-city-strip & metropolitan)
    const slotW = 520;
    const slotH = 330;
    const colLeftX = 40;
    const colRightX = 640;
    const yPositions = [250, 605, 960, 1315];

    const slots: PhotoSlotConfig[] = [];
    for (let row = 0; row < 4; row++) {
      slots.push({ x: colLeftX, y: yPositions[row], width: slotW, height: slotH, photo: row });
      slots.push({ x: colRightX, y: yPositions[row], width: slotW, height: slotH, photo: row });
    }
    return slots;
  }

  if (photoCount === 3) {
    // Format Dual Strip 3 Foto (2 Kolom x 3 Baris = 6 slot, presisi moonlight-trio)
    const slotW = 520;
    const slotH = 450;
    const colLeftX = 40;
    const colRightX = 640;
    const yPositions = [250, 725, 1200];

    const slots: PhotoSlotConfig[] = [];
    for (let row = 0; row < 3; row++) {
      slots.push({ x: colLeftX, y: yPositions[row], width: slotW, height: slotH, photo: row });
      slots.push({ x: colRightX, y: yPositions[row], width: slotW, height: slotH, photo: row });
    }
    return slots;
  }

  if (photoCount === 2) {
    // Format 2 Foto Bertingkat Seimbang (presisi duo-skyline)
    return [
      { x: 50, y: 260, width: 1100, height: 620, photo: 0 },
      { x: 50, y: 920, width: 1100, height: 620, photo: 1 },
    ];
  }

  // Format 1 Foto Poster Tunggal (presisi poster-tunggal)
  return [{ x: 50, y: 260, width: 1100, height: 1200, photo: 0 }];
}

/**
 * Picu pengunduhan file dari Blob / DataUrl langsung di browser
 */
export function triggerFileDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Hasilkan komposit foto strip 4R (1200x1800) dan unduh langsung sebagai file JPG
 */
export async function downloadCompositePhotoStrip(options: CompositeDownloadOptions): Promise<string> {
  const {
    photos,
    frameImage,
    visitorName = 'Wisudawan TIK',
    ticketNumber = '#001',
    templateName = 'PHOTO STRIP 4R',
    fileName = `Photobooth_${ticketNumber.replace('#', '')}_${Date.now()}.jpg`,
  } = options;

  const canvasWidth = options.canvasWidth || 1200;
  const canvasHeight = options.canvasHeight || 1800;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Gagal menginisialisasi canvas context.');

  // 1. Warna Latar Dasar
  ctx.fillStyle = '#050C38';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Tentukan konfigurasi slot foto
  const slots: PhotoSlotConfig[] =
    options.slots && options.slots.length > 0
      ? options.slots
      : getDefaultSlots(photos.length || 4, canvasWidth, canvasHeight);

  // 3. Render setiap foto pada posisinya yang presisi
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const photoIdx = slot.photo !== undefined ? slot.photo : (slot.source_index !== undefined ? slot.source_index : (i % photos.length));
    const photoData = photos[photoIdx] || photos[0] || '#1D4ED8';
    const isImage = photoData.startsWith('data:image') || photoData.startsWith('/') || photoData.startsWith('http');

    if (isImage) {
      try {
        const img = await loadImage(photoData);
        drawImageCover(ctx, img, slot.x, slot.y, slot.width, slot.height);
      } catch (err) {
        console.warn('Gagal memuat gambar pose untuk komposit:', err);
        drawColorCard(ctx, '#1D4ED8', slot.x, slot.y, slot.width, slot.height, `POSE #${photoIdx + 1}`);
      }
    } else {
      drawColorCard(ctx, photoData, slot.x, slot.y, slot.width, slot.height, `POSE #${photoIdx + 1}`);
    }
  }

  // 4. Render Bingkai Overlay PNG Transparan jika ada
  if (frameImage) {
    try {
      const frameImg = await loadImage(frameImage);
      ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
    } catch (err) {
      console.warn('Gagal memuat bingkai frame overlay:', err);
    }
  }

  // 5. Watermark Footer Elegan
  ctx.save();
  ctx.fillStyle = 'rgba(5, 12, 56, 0.85)';
  ctx.fillRect(20, canvasHeight - 48, canvasWidth - 40, 36);
  ctx.strokeStyle = '#4B57B2';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, canvasHeight - 48, canvasWidth - 40, 36);

  ctx.fillStyle = '#FFD84D';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`TIK 2026 • ${visitorName.toUpperCase()} (${ticketNumber})`, 40, canvasHeight - 30);

  ctx.fillStyle = '#5CE1E6';
  ctx.textAlign = 'right';
  ctx.fillText(templateName.toUpperCase(), canvasWidth - 40, canvasHeight - 30);
  ctx.restore();

  // 6. Konversi ke DataURL JPEG dan unduh
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  triggerFileDownload(dataUrl, fileName);
  return dataUrl;
}

/**
 * Unduh satu foto individual sebagai file JPG resolusi penuh
 */
export async function downloadSinglePhoto(
  photoDataOrColor: string,
  fileName: string,
  label = 'Foto Photobooth'
): Promise<string> {
  const isImage =
    photoDataOrColor.startsWith('data:image') ||
    photoDataOrColor.startsWith('/') ||
    photoDataOrColor.startsWith('http');

  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

  if (isImage) {
    try {
      const img = await loadImage(photoDataOrColor);
      drawImageCover(ctx, img, 0, 0, 1920, 1280);
    } catch (err) {
      drawColorCard(ctx, '#1D4ED8', 0, 0, 1920, 1280, label);
    }
  } else {
    drawColorCard(ctx, photoDataOrColor, 0, 0, 1920, 1280, label);
  }

  // Overlay Telemetri Photobooth TIK 2026
  ctx.save();
  ctx.fillStyle = 'rgba(5, 12, 56, 0.75)';
  ctx.fillRect(30, 1280 - 60, 1920 - 60, 40);
  ctx.fillStyle = '#FFD84D';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`EXPO WISUDA TIK 2026 • ${label.toUpperCase()}`, 50, 1280 - 40);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  triggerFileDownload(dataUrl, fileName);
  return dataUrl;
}
