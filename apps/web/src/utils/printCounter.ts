/**
 * printCounter.ts
 * Melacak dan mengelola statistik total lembar 4R yang telah dicetak
 * di bilik photobooth dan dashboard admin.
 */

const PRINT_COUNTER_KEY = 'photobooth_total_printed_sheets';
const CHANNEL_NAME = 'photobooth_session_sync';

/**
 * Mengambil total lembar 4R yang sudah dicetak
 */
export function getTotalPrintedSheets(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(PRINT_COUNTER_KEY);
    const count = raw ? parseInt(raw, 10) : 0;
    return isNaN(count) || count < 0 ? 0 : count;
  } catch {
    return 0;
  }
}

/**
 * Menambahkan jumlah lembar cetak (default +1 atau sesuai jumlah salinan cetak)
 */
export function incrementPrintedSheets(copies = 1): number {
  if (typeof window === 'undefined') return 0;
  try {
    const current = getTotalPrintedSheets();
    const updated = current + Math.max(1, copies);
    localStorage.setItem(PRINT_COUNTER_KEY, updated.toString());

    // Siarkan ke tab admin dan bilik booth
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({
        type: 'PRINT_COUNT_UPDATED',
        totalPrintedSheets: updated,
        addedCopies: copies,
      });
      channel.close();
    } catch {}

    return updated;
  } catch {
    return 0;
  }
}

/**
 * Mereset counter lembar cetak ke 0 (atau angka tertentu untuk kalibrasi ulang kertas)
 */
export function resetPrintedSheets(val = 0): void {
  if (typeof window === 'undefined') return;
  const count = Math.max(0, val);
  localStorage.setItem(PRINT_COUNTER_KEY, count.toString());

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: 'PRINT_COUNT_UPDATED',
      totalPrintedSheets: count,
    });
    channel.close();
  } catch {}
}
