/**
 * Utilitas Pemindai Frame Foto (Auto-Detect Transparent Photo Slots)
 * Menganalisis gambar frame PNG transparan untuk menemukan area lubang foto landscape (4:3, 16:9, 3:2).
 * Mendukung format Photobooth Strip Klasik (Dual Strip 8-Slot 4R / Single Strip Vertikal) & Grid.
 */

export interface DetectedSlot {
  id: number;
  poseId: number; // 1, 2, 3, 4 (untuk dual strip, slot kiri & kanan memiliki poseId yang sama)
  label: string; // e.g. "Pose #1 (Kiri)", "Pose #1 (Kanan)", "Pose #2"
  xPercent: number; // 0 - 100%
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  aspectRatio: '4:3' | '16:9' | '3:2' | 'custom';
  ratioValue: number; // width / height
}

export interface FrameScanResult {
  slots: DetectedSlot[];
  detectedCount: number; // Total lubang fisik (misal 8 untuk dual strip)
  poseCount: number; // Jumlah pose kamera yang harus diambil di booth (misal 4 untuk dual strip)
  dominantRatio: '4:3' | '16:9' | '3:2';
  isDualStrip: boolean;
  hasTransparency: boolean;
  message: string;
}

/**
 * Pindai gambar frame dari Data URL / base64 / path lokal untuk mendeteksi lubang transparan
 */
export async function scanFrameTransparency(
  imageSource: string,
  preferredRatio: '4:3' | '16:9' | '3:2' = '4:3'
): Promise<FrameScanResult> {
  return new Promise((resolve) => {
    const img = new Image();

    // Hanya gunakan anonymous crossOrigin jika external URL (mencegah error CORS pada asset lokal)
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      // Skalakan ke resolusi analisis efisien (lebar 300, tinggi 450 -> rasio standar 4R 2:3)
      const aW = 300;
      const aH = 450;
      const canvas = document.createElement('canvas');
      canvas.width = aW;
      canvas.height = aH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(getFallbackPreset(4, preferredRatio, 'strip', false, 'Canvas tidak didukung'));
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
            'strip',
            false,
            'Frame tidak memiliki lubang transparan yang cukup. Menggunakan tata letak strip landscape preset.'
          )
        );
        return;
      }

      // Deteksi bounding box komponen transparan dengan grid sampling BFS
      const visited = new Uint8Array(aW * aH);
      const rawComponents: { minX: number; maxX: number; minY: number; maxY: number; count: number }[] = [];

      for (let y = 10; y < aH - 10; y += 3) {
        for (let x = 10; x < aW - 10; x += 3) {
          const idx = y * aW + x;
          if (binary[idx] === 1 && visited[idx] === 0) {
            let minX = x;
            let maxX = x;
            let minY = y;
            let maxY = y;
            let count = 0;

            const queue: [number, number][] = [[x, y]];
            visited[idx] = 1;

            while (queue.length > 0 && count < 18000) {
              const [cx, cy] = queue.pop()!;
              count++;

              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

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

            // Filter komponen valid (minimal 1.2% luas kanvas)
            if (area > aW * aH * 0.012 && w > 26 && h > 16) {
              rawComponents.push({ minX, maxX, minY, maxY, count });
            }
          }
        }
      }

      // Jika berhasil mendeteksi komponen lubang
      if (rawComponents.length > 0) {
        // Urutkan berdasarkan posisi Y vertikal lalu X horizontal
        rawComponents.sort((a, b) => {
          if (Math.abs(a.minY - b.minY) > 20) return a.minY - b.minY;
          return a.minX - b.minX;
        });

        // Cek apakah format ini adalah Dual Strip 4R (Strip Ganda 8 Slot = 2 kolom x 4 baris)
        const isDualStrip = rawComponents.length === 8;
        let poseCount = rawComponents.length;
        let message = `Berhasil mendeteksi ${rawComponents.length} lubang foto transparan!`;

        if (isDualStrip) {
          poseCount = 4;
          message = 'Berhasil mendeteksi Frame Strip Ganda 4R (Dual Strip: 4 Pose Kembar / 8 Slot Lubang Landscape)!';
        } else if (rawComponents.length === 4) {
          // Bisa jadi 4 pose vertikal atau grid 2x2
          const isVerticalStrip = rawComponents.every((c, i) => i === 0 || Math.abs(c.minX - rawComponents[0].minX) < 30);
          if (isVerticalStrip) {
            message = 'Berhasil mendeteksi Frame Strip Vertikal (Single Strip: 4 Pose Landscape)!';
          } else {
            message = 'Berhasil mendeteksi Frame Grid 2x2 (4 Pose Landscape)!';
          }
        } else if (rawComponents.length === 3) {
          message = 'Berhasil mendeteksi Frame Trio Strip (3 Pose Landscape)!';
        }

        const detectedSlots: DetectedSlot[] = rawComponents.slice(0, 8).map((comp, i) => {
          const w = comp.maxX - comp.minX;
          const h = comp.maxY - comp.minY;
          const ratio = w / h;

          let slotRatio: '4:3' | '16:9' | '3:2' | 'custom' = '4:3';
          if (ratio >= 1.55) slotRatio = '16:9';
          else if (ratio >= 1.4) slotRatio = '3:2';
          else if (ratio >= 1.15) slotRatio = '4:3';
          else slotRatio = 'custom';

          // Untuk dual strip: Baris 1 (i=0,1) -> Pose 1; Baris 2 (i=2,3) -> Pose 2; dst.
          const poseId = isDualStrip ? Math.floor(i / 2) + 1 : i + 1;
          const isLeft = isDualStrip ? i % 2 === 0 : true;
          const label = isDualStrip
            ? `Pose #${poseId} (${isLeft ? 'Kiri' : 'Kanan'})`
            : `Pose #${poseId}`;

          return {
            id: i + 1,
            poseId,
            label,
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
          poseCount,
          dominantRatio: preferredRatio,
          isDualStrip,
          hasTransparency: true,
          message,
        });
        return;
      }

      // Fallback preset
      resolve(
        getFallbackPreset(
          4,
          preferredRatio,
          'strip',
          false,
          'Komponen transparan tidak teratur. Menggunakan tata letak strip landscape preset.'
        )
      );
    };

    img.onerror = () => {
      resolve(getFallbackPreset(4, preferredRatio, 'strip', false, 'Gagal memuat gambar frame. Menggunakan preset strip.'));
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
  layoutType: 'strip' | 'grid' | 'trio' | 'duo' | 'single' = 'strip',
  hasTransparency = false,
  message = ''
): FrameScanResult {
  const slots: DetectedSlot[] = [];
  const ratioNum = ratio === '16:9' ? 16 / 9 : ratio === '3:2' ? 3 / 2 : 4 / 3;

  let isDualStrip = false;
  let poseCount = count;

  if (layoutType === 'strip' || count === 4) {
    if (layoutType === 'strip') {
      // DUAL STRIP 4R (Photobooth Strip Klasik 2 kolom x 4 baris = 8 slot)
      isDualStrip = true;
      poseCount = 4;
      const slotW = 41; // 41% lebar tiap kolom
      const slotH = 17.5; // 17.5% tinggi (rasio landscape ~1.55)

      const yPositions = [14.5, 34.5, 54.0, 73.5];
      let slotCounter = 1;

      for (let row = 0; row < 4; row++) {
        // Kolom Kiri (Strip A)
        slots.push({
          id: slotCounter++,
          poseId: row + 1,
          label: `Pose #${row + 1} (Kiri)`,
          xPercent: 7.2,
          yPercent: yPositions[row],
          widthPercent: slotW,
          heightPercent: slotH,
          aspectRatio: ratio,
          ratioValue: ratioNum,
        });

        // Kolom Kanan (Strip B - Kembar)
        slots.push({
          id: slotCounter++,
          poseId: row + 1,
          label: `Pose #${row + 1} (Kanan)`,
          xPercent: 51.8,
          yPercent: yPositions[row],
          widthPercent: slotW,
          heightPercent: slotH,
          aspectRatio: ratio,
          ratioValue: ratioNum,
        });
      }
    } else {
      // GRID 2x2
      poseCount = 4;
      const slotW = 42;
      const slotH = Math.min(35, (slotW / ratioNum) * (3 / 2));
      slots.push(
        { id: 1, poseId: 1, label: 'Pose #1', xPercent: 6, yPercent: 12, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum },
        { id: 2, poseId: 2, label: 'Pose #2', xPercent: 52, yPercent: 12, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum },
        { id: 3, poseId: 3, label: 'Pose #3', xPercent: 6, yPercent: 52, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum },
        { id: 4, poseId: 4, label: 'Pose #4', xPercent: 52, yPercent: 52, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum }
      );
    }
  } else if (count === 3 || layoutType === 'trio') {
    // TRIO STRIP (3 Foto Bertingkat Vertikal)
    poseCount = 3;
    const slotW = 82;
    const slotH = 22;
    const spacing = 4;
    for (let i = 0; i < 3; i++) {
      slots.push({
        id: i + 1,
        poseId: i + 1,
        label: `Pose #${i + 1}`,
        xPercent: 9,
        yPercent: 12 + i * (slotH + spacing),
        widthPercent: slotW,
        heightPercent: slotH,
        aspectRatio: ratio,
        ratioValue: ratioNum,
      });
    }
  } else if (count === 2 || layoutType === 'duo') {
    // DUO SKYLINE (2 Foto Bertingkat)
    poseCount = 2;
    const slotW = 86;
    const slotH = 34;
    slots.push(
      { id: 1, poseId: 1, label: 'Pose #1', xPercent: 7, yPercent: 12, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum },
      { id: 2, poseId: 2, label: 'Pose #2', xPercent: 7, yPercent: 52, widthPercent: slotW, heightPercent: slotH, aspectRatio: ratio, ratioValue: ratioNum }
    );
  } else if (count === 1 || layoutType === 'single') {
    // POSTER TUNGGAL (1 Foto Besar Landscape)
    poseCount = 1;
    const slotW = 88;
    const slotH = 58;
    slots.push({
      id: 1,
      poseId: 1,
      label: 'Pose #1 (Poster)',
      xPercent: 6,
      yPercent: 20,
      widthPercent: slotW,
      heightPercent: slotH,
      aspectRatio: ratio,
      ratioValue: ratioNum,
    });
  } else {
    // Default 6 Foto Collage
    poseCount = count;
    const slotW = 42;
    const slotH = 23;
    for (let i = 0; i < count; i++) {
      slots.push({
        id: i + 1,
        poseId: i + 1,
        label: `Pose #${i + 1}`,
        xPercent: i % 2 === 0 ? 6 : 52,
        yPercent: 10 + Math.floor(i / 2) * (slotH + 3),
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
    poseCount,
    dominantRatio: ratio,
    isDualStrip,
    hasTransparency,
    message: message || `Menggunakan tata letak preset ${isDualStrip ? 'Dual Strip 4R' : layoutType} (${poseCount} pose landscape).`,
  };
}
