/**
 * Utilitas Pemindai Frame Foto (Auto-Detect Transparent Photo Slots)
 * Menganalisis gambar frame PNG transparan untuk menemukan area lubang foto landscape (4:3, 16:9, 3:2).
 */

export interface DetectedSlot {
  id: number;
  xPercent: number; // 0 - 100%
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  aspectRatio: '4:3' | '16:9' | '3:2' | 'custom';
  ratioValue: number; // width / height
}

export interface FrameScanResult {
  slots: DetectedSlot[];
  detectedCount: number;
  dominantRatio: '4:3' | '16:9' | '3:2';
  hasTransparency: boolean;
  message: string;
}

/**
 * Pindai gambar frame dari Data URL / base64 untuk mendeteksi lubang transparan
 */
export async function scanFrameTransparency(
  imageSource: string,
  preferredRatio: '4:3' | '16:9' | '3:2' = '4:3'
): Promise<FrameScanResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Skalakan ke resolusi analisis efisien (lebar 300, tinggi 450 -> rasio 2:3)
      const aW = 300;
      const aH = 450;
      const canvas = document.createElement('canvas');
      canvas.width = aW;
      canvas.height = aH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(getFallbackPreset(4, preferredRatio, false, 'Canvas tidak didukung'));
        return;
      }

      ctx.drawImage(img, 0, 0, aW, aH);
      const imgData = ctx.getImageData(0, 0, aW, aH);
      const data = imgData.data;

      // Matriks binary transparansi (1 = transparan / alpha < 40)
      const binary = new Uint8Array(aW * aH);
      let transparentPixelCount = 0;

      for (let i = 0; i < aW * aH; i++) {
        const alpha = data[i * 4 + 3];
        if (alpha < 40) {
          binary[i] = 1;
          transparentPixelCount++;
        } else {
          binary[i] = 0;
        }
      }

      // Jika area transparan terlalu sedikit (< 3% luas kanvas)
      if (transparentPixelCount < aW * aH * 0.03) {
        resolve(
          getFallbackPreset(
            4,
            preferredRatio,
            false,
            'Frame tidak memiliki lubang transparan yang cukup. Menggunakan tata letak landscape preset.'
          )
        );
        return;
      }

      // Deteksi bounding box komponen transparan dengan grid sampling
      const visited = new Uint8Array(aW * aH);
      const components: { minX: number; maxX: number; minY: number; maxY: number; count: number }[] = [];

      for (let y = 10; y < aH - 10; y += 3) {
        for (let x = 10; x < aW - 10; x += 3) {
          const idx = y * aW + x;
          if (binary[idx] === 1 && visited[idx] === 0) {
            // BFS pencarian komponen
            let minX = x;
            let maxX = x;
            let minY = y;
            let maxY = y;
            let count = 0;

            const queue: [number, number][] = [[x, y]];
            visited[idx] = 1;

            while (queue.length > 0 && count < 15000) {
              const [cx, cy] = queue.pop()!;
              count++;

              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

              // Cek tetangga 4-arah (lompatan 3 piksel)
              const neighbors: [number, number][] = [
                [cx + 3, cy],
                [cx - 3, cy],
                [cx, cy + 3],
                [cx, cy - 3],
              ];

              for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < aW && ny >= 0 && ny < aH) {
                  const nIdx = ny * aW + nx;
                  if (binary[nIdx] === 1 && visited[nIdx] === 0) {
                    visited[nIdx] = 1;
                    queue.push([nx, ny]);
                  }
                }
              }
            }

            const w = maxX - minX;
            const h = maxY - minY;
            const area = w * h;

            // Hanya ambil komponen yang cukup besar untuk menjadi lubang foto (> 1.5% luas kanvas)
            if (area > aW * aH * 0.015 && w > 30 && h > 20) {
              components.push({ minX, maxX, minY, maxY, count });
            }
          }
        }
      }

      // Jika berhasil mendeteksi komponen lubang
      if (components.length > 0) {
        // Urutkan berdasarkan posisi Y lalu X
        components.sort((a, b) => {
          if (Math.abs(a.minY - b.minY) > 25) return a.minY - b.minY;
          return a.minX - b.minX;
        });

        const detectedSlots: DetectedSlot[] = components.slice(0, 8).map((comp, i) => {
          const w = comp.maxX - comp.minX;
          const h = comp.maxY - comp.minY;
          const ratio = w / h;

          let slotRatio: '4:3' | '16:9' | '3:2' | 'custom' = '4:3';
          if (ratio >= 1.55) slotRatio = '16:9';
          else if (ratio >= 1.4) slotRatio = '3:2';
          else if (ratio >= 1.15) slotRatio = '4:3';
          else slotRatio = 'custom';

          return {
            id: i + 1,
            xPercent: Math.round((comp.minX / aW) * 1000) / 10,
            yPercent: Math.round((comp.minY / aH) * 1000) / 10,
            widthPercent: Math.round((w / aW) * 1000) / 10,
            heightPercent: Math.round((h / aH) * 1000) / 10,
            aspectRatio: slotRatio,
            ratioValue: Math.round(ratio * 100) / 100,
          };
        });

        resolve({
          slots: detectedSlots,
          detectedCount: detectedSlots.length,
          dominantRatio: preferredRatio,
          hasTransparency: true,
          message: `Berhasil mendeteksi ${detectedSlots.length} lubang foto transparan pada frame!`,
        });
        return;
      }

      // Fallback jika tidak ada komponen yang cocok
      resolve(
        getFallbackPreset(
          4,
          preferredRatio,
          false,
          'Komponen transparan tidak beraturan. Menggunakan tata letak landscape preset.'
        )
      );
    };

    img.onerror = () => {
      resolve(getFallbackPreset(4, preferredRatio, false, 'Gagal memuat gambar frame'));
    };

    img.src = imageSource;
  });
}

/**
 * Generator Tata Letak Landscape Preset (4:3, 16:9, 3:2)
 * Menghasilkan posisi slot foto landscape yang rapi dan presisi di atas kertas 4R (1200x1800)
 */
export function getFallbackPreset(
  count: number,
  ratio: '4:3' | '16:9' | '3:2' = '4:3',
  hasTransparency = false,
  message = ''
): FrameScanResult {
  const slots: DetectedSlot[] = [];

  // Hitung rasio aspek (W / H)
  const ratioNum = ratio === '16:9' ? 16 / 9 : ratio === '3:2' ? 3 / 2 : 4 / 3;

  if (count === 4) {
    // Preset 4 Foto Strip Ganda (2 kolom x 2 baris) atau Strip Vertikal
    // Masing-masing foto berorientasi Landscape (4:3 atau 16:9)
    const slotW = 42; // 42% lebar kanvas
    const slotH = slotW / ratioNum; // sesuaikan tinggi dengan rasio

    slots.push(
      { id: 1, xPercent: 6, yPercent: 12, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum },
      { id: 2, xPercent: 52, yPercent: 12, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum },
      { id: 3, xPercent: 6, yPercent: 52, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum },
      { id: 4, xPercent: 52, yPercent: 52, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum }
    );
  } else if (count === 3) {
    // Preset 3 Foto Vertikal Landscape
    const slotW = 82;
    const slotH = slotW / ratioNum * (2 / 3);
    const spacing = (80 - slotH * 3) / 4;

    for (let i = 0; i < 3; i++) {
      slots.push({
        id: i + 1,
        xPercent: 9,
        yPercent: Math.round((10 + i * (slotH + spacing)) * 10) / 10,
        widthPercent: slotW,
        heightPercent: Math.round(slotH * 10) / 10,
        aspectRatio: ratio,
        ratioValue: ratioNum,
      });
    }
  } else if (count === 2) {
    // Preset 2 Foto Landscape Bertingkat
    const slotW = 86;
    const slotH = Math.min(38, (slotW / ratioNum) * (2 / 3));

    slots.push(
      { id: 1, xPercent: 7, yPercent: 12, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum },
      { id: 2, xPercent: 7, yPercent: 54, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum }
    );
  } else if (count === 1) {
    // Preset 1 Foto Landscape Besar (Poster)
    const slotW = 88;
    const slotH = Math.min(65, (slotW / ratioNum) * (2 / 3));

    slots.push({
      id: 1,
      xPercent: 6,
      yPercent: 18,
      widthPercent: slotW,
      heightPercent: slotH,
      aspectRatio: ratio,
      ratioValue: ratioNum,
    });
  } else {
    // Default 4 Foto
    const slotW = 42;
    const slotH = slotW / ratioNum;
    for (let i = 0; i < count; i++) {
      slots.push({
        id: i + 1,
        xPercent: i % 2 === 0 ? 6 : 52,
        yPercent: 10 + Math.floor(i / 2) * (slotH + 4),
        widthPercent: slotW,
        heightPercent: slotH,
        aspectRatio: ratio,
        ratioValue: ratioNum,
      });
    }
  }

  return {
    slots,
    detectedCount: slots.length,
    dominantRatio: ratio,
    hasTransparency,
    message: message || `Menggunakan tata letak landscape preset ${ratio} (${count} foto).`,
  };
}
