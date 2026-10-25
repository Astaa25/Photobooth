/**
 * slotColorDetector.ts
 * Utilitas untuk mendeteksi slot foto secara otomatis dari warna patokan (benchmark chroma-color)
 * pada gambar bingkai template, serta melubangi area tersebut menjadi transparan (alpha = 0).
 */

export interface BenchmarkColorOption {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  desc: string;
}

export const BENCHMARK_COLORS: BenchmarkColorOption[] = [
  {
    id: 'magenta',
    name: 'Magenta / Hot Pink (#FF00FF)',
    hex: '#FF00FF',
    rgb: [255, 0, 255],
    desc: 'Paling direkomendasikan karena jarang sekali muncul pada elemen desain/foto.',
  },
  {
    id: 'green',
    name: 'Neon Green (#00FF00)',
    hex: '#00FF00',
    rgb: [0, 255, 0],
    desc: 'Warna standar Chroma Key layar hijau.',
  },
  {
    id: 'cyan',
    name: 'Electric Cyan (#00FFFF)',
    hex: '#00FFFF',
    rgb: [0, 255, 255],
    desc: 'Warna biru neon terang pembeda kontras.',
  },
  {
    id: 'black',
    name: 'Solid Black (#000000)',
    hex: '#000000',
    rgb: [0, 0, 0],
    desc: 'Untuk template lama yang jendelanya diwarnai hitam pekat.',
  },
];

export interface DetectedBox {
  x: number;
  y: number;
  width: number;
  height: number;
  photo: number;
}

export interface DetectionResult {
  success: boolean;
  slots: DetectedBox[];
  punchedImageBase64?: string;
  message: string;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1800;

/**
 * Konversi Hex string ke [R, G, B]
 */
export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [255, 0, 255];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Cek apakah warna pixel cocok dengan warna patokan (dengan toleransi delta)
 */
function isColorMatch(
  r: number,
  g: number,
  b: number,
  targetRgb: [number, number, number],
  tolerance = 30
): boolean {
  return (
    Math.abs(r - targetRgb[0]) <= tolerance &&
    Math.abs(g - targetRgb[1]) <= tolerance &&
    Math.abs(b - targetRgb[2]) <= tolerance
  );
}

/**
 * Pindai gambar bingkai, deteksi kotak warna patokan, hitung koordinat slot 1200x1800,
 * dan lubangi area kotak tersebut menjadi transparan di kanvas.
 */
export async function detectSlotsAndPunchHoles(
  imageSrc: string,
  benchmarkHex = '#FF00FF',
  photoCount = 4,
  category = 'Grid'
): Promise<DetectionResult> {
  if (typeof window === 'undefined') {
    return { success: false, slots: [], message: 'Hanya dapat dijalankan di browser.' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve({ success: false, slots: [], message: 'Konteks Canvas tidak tersedia.' });
          return;
        }

        // Gambar bingkai ke ukuran kanvas 1200x1800
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const imgData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const data = imgData.data;

        const targetRgb = hexToRgb(benchmarkHex);
        const grid = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);

        // 1. Buat binary grid piksel yang cocok dengan warna patokan
        for (let y = 0; y < CANVAS_HEIGHT; y++) {
          for (let x = 0; x < CANVAS_WIDTH; x++) {
            const idx = (y * CANVAS_WIDTH + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Abaikan piksel yang sudah transparan
            if (a < 50) continue;

            if (isColorMatch(r, g, b, targetRgb)) {
              grid[y * CANVAS_WIDTH + x] = 1;
            }
          }
        }

        // 2. Deteksi bounding box menggunakan Connected Component Flood Fill
        const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
        const rawBoxes: { x: number; y: number; width: number; height: number; count: number }[] = [];
        const step = 4; // sampling step untuk kecepatan tinggi

        for (let y = 0; y < CANVAS_HEIGHT; y += step) {
          for (let x = 0; x < CANVAS_WIDTH; x += step) {
            const idx = y * CANVAS_WIDTH + x;
            if (grid[idx] === 1 && visited[idx] === 0) {
              let minX = x;
              let maxX = x;
              let minY = y;
              let maxY = y;
              let count = 0;

              const queue = [x, y];
              visited[idx] = 1;

              let head = 0;
              while (head < queue.length) {
                const cx = queue[head++];
                const cy = queue[head++];
                count++;

                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                const neighbors = [
                  [cx + step, cy],
                  [cx - step, cy],
                  [cx, cy + step],
                  [cx, cy - step],
                ];

                for (const [nx, ny] of neighbors) {
                  if (nx >= 0 && nx < CANVAS_WIDTH && ny >= 0 && ny < CANVAS_HEIGHT) {
                    const nidx = ny * CANVAS_WIDTH + nx;
                    if (grid[nidx] === 1 && visited[nidx] === 0) {
                      visited[nidx] = 1;
                      queue.push(nx, ny);
                    }
                  }
                }
              }

              const boxW = maxX - minX + step;
              const boxH = maxY - minY + step;

              // Filter out noise kecil (slot foto setidaknya berukuran > 140x100 px)
              if (boxW > 140 && boxH > 100) {
                rawBoxes.push({
                  x: Math.max(0, Math.floor(minX)),
                  y: Math.max(0, Math.floor(minY)),
                  width: Math.min(CANVAS_WIDTH - minX, Math.ceil(boxW)),
                  height: Math.min(CANVAS_HEIGHT - minY, Math.ceil(boxH)),
                  count,
                });
              }
            }
          }
        }

        if (rawBoxes.length === 0) {
          resolve({
            success: false,
            slots: [],
            message: `Tidak ditemukan kotak dengan warna patokan ${benchmarkHex}. Pastikan area jendela foto diwarnai persis dengan warna patokan yang dipilih.`,
          });
          return;
        }

        // 3. Urutkan kotak secara logis:
        // Cek apakah tata letak berupa 2 kolom (seperti strip ganda 4R)
        const isDoubleColumn =
          rawBoxes.some((b) => b.x < CANVAS_WIDTH / 2) &&
          rawBoxes.some((b) => b.x >= CANVAS_WIDTH / 2);

        let sortedBoxes: { x: number; y: number; width: number; height: number }[] = [];

        if (isDoubleColumn && rawBoxes.length >= 2) {
          // Pisahkan kolom kiri dan kolom kanan
          const colLeft = rawBoxes.filter((b) => b.x + b.width / 2 < CANVAS_WIDTH / 2);
          const colRight = rawBoxes.filter((b) => b.x + b.width / 2 >= CANVAS_WIDTH / 2);

          colLeft.sort((a, b) => a.y - b.y);
          colRight.sort((a, b) => a.y - b.y);

          // Masangkan berdampingan (kiri lalu kanan untuk pose yang sama)
          const maxRows = Math.max(colLeft.length, colRight.length);
          for (let r = 0; r < maxRows; r++) {
            if (colLeft[r]) sortedBoxes.push(colLeft[r]);
            if (colRight[r]) sortedBoxes.push(colRight[r]);
          }
        } else {
          // Urutan baris per baris (top-to-bottom, left-to-right)
          sortedBoxes = [...rawBoxes].sort((a, b) => {
            const rowDiff = Math.abs(a.y - b.y);
            if (rowDiff < 40) {
              return a.x - b.x;
            }
            return a.y - b.y;
          });
        }

        // 4. Petakan slot ke indeks foto (photo 0, 1, 2, ... hingga photoCount - 1)
        const finalSlots: DetectedBox[] = sortedBoxes.map((box, index) => {
          let photoIndex: number;
          if (isDoubleColumn && sortedBoxes.length % 2 === 0) {
            // Pasangan strip ganda berbagi nomor foto yang sama: [0, 0, 1, 1, 2, 2, 3, 3]
            photoIndex = Math.floor(index / 2) % photoCount;
          } else {
            photoIndex = index % photoCount;
          }

          return {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            photo: photoIndex,
          };
        });

        // 5. Lubangi area kotak foto yang terdeteksi menjadi transparan (alpha = 0)
        for (const slot of finalSlots) {
          ctx.clearRect(slot.x, slot.y, slot.width, slot.height);
        }

        const punchedImageBase64 = canvas.toDataURL('image/png');

        resolve({
          success: true,
          slots: finalSlots,
          punchedImageBase64,
          message: `Berhasil mendeteksi ${finalSlots.length} slot foto dari warna patokan ${benchmarkHex}! Area foto otomatis dilubangi transparan.`,
        });
      } catch (err: any) {
        console.error('Error saat deteksi warna patokan:', err);
        resolve({
          success: false,
          slots: [],
          message: `Terjadi kendala saat menganalisis gambar: ${err?.message || err}`,
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        slots: [],
        message: 'Gagal memuat gambar bingkai untuk dipindai.',
      });
    };

    img.src = imageSrc;
  });
}
