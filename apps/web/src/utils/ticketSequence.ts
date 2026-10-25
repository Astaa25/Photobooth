/**
 * ticketSequence.ts
 * Mengelola nomor urut tiket photobooth (#001, #002, ...) secara berkesinambungan
 * dan tersinkronisasi antar-tab/bilik booth.
 */

const STORAGE_KEY = 'photobooth_ticket_counter';
const CHANNEL_NAME = 'photobooth_session_sync';

/**
 * Format angka menjadi format tiket berurut (misal 1 -> '#001', 45 -> '#045')
 */
export function formatTicketNumber(num: number): string {
  const safeNum = Math.max(1, Math.floor(num));
  return `#${String(safeNum).padStart(3, '0')}`;
}

/**
 * Ambil nomor urut tiket saat ini tanpa menaikkannya
 */
export function getCurrentTicketNumber(): string {
  if (typeof window === 'undefined') return '#001';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const num = raw ? parseInt(raw, 10) : 1;
    return formatTicketNumber(isNaN(num) || num < 1 ? 1 : num);
  } catch {
    return '#001';
  }
}

/**
 * Dapatkan nomor tiket berikutnya dan simpan perubahannya ke localStorage
 * serta siarkan ke BroadcastChannel agar sinkron di semua tab/perangkat
 */
export function getAndAdvanceTicketNumber(): string {
  if (typeof window === 'undefined') return '#001';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let current = raw ? parseInt(raw, 10) : 1;
    if (isNaN(current) || current < 1) current = 1;

    const assignedTicket = formatTicketNumber(current);
    const nextTicketNum = current + 1;

    localStorage.setItem(STORAGE_KEY, nextTicketNum.toString());

    // Broadcast ke tab lain
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({
        type: 'TICKET_SEQUENCE_UPDATED',
        currentTicket: assignedTicket,
        nextTicket: formatTicketNumber(nextTicketNum),
      });
      channel.close();
    } catch {}

    return assignedTicket;
  } catch {
    return '#001';
  }
}

/**
 * Atur ulang nomor antrean ke nomor tertentu (misal kembali ke #001)
 */
export function setTicketSequence(startNum: number): void {
  if (typeof window === 'undefined') return;
  const num = Math.max(1, Math.floor(startNum));
  localStorage.setItem(STORAGE_KEY, num.toString());
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: 'TICKET_SEQUENCE_UPDATED',
      currentTicket: formatTicketNumber(num),
      nextTicket: formatTicketNumber(num + 1),
    });
    channel.close();
  } catch {}
}
