'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { VisitorRegistrationSchema } from '@photobooth/shared';

export default function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{ number: string; nickname: string; status: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasi Zod di batas klien
    const validation = VisitorRegistrationSchema.safeParse({
      nickname,
      phone: phone || undefined,
      website_trap: honeypot,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Input tidak valid.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulasi panggilan endpoint pendaftaran antrean
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Contoh pendaftaran berhasil menghasilkan tiket nomor atomik
      const randomTicketNum = Math.floor(Math.random() * 80) + 1;
      const formattedNum = `#${String(randomTicketNum).padStart(3, '0')}`;

      setTicket({
        number: formattedNum,
        nickname,
        status: 'Dalam Antrean',
      });
    } catch {
      setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft hover:text-ink mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>

      {!ticket ? (
        <div>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-ink mb-2">
              Daftar Antrean Booth
            </h1>
            <p className="text-sm text-ink-soft leading-relaxed">
              Silakan isi nama panggilan Anda untuk dipanggil ke layar booth saat giliran tiba.
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-btn bg-red-50 border border-signal-bad/20 text-signal-bad text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="nickname" className="block text-xs font-medium text-ink mb-1.5">
                Nama Panggilan <span className="text-signal-bad">*</span>
              </label>
              <input
                id="nickname"
                type="text"
                required
                maxLength={40}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Contoh: Diana"
                className="w-full h-12 px-4 rounded-btn border border-sheet bg-paper-raised text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ultramarine focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-ink mb-1.5">
                Nomor WhatsApp <span className="text-film">(Opsional, untuk link galeri)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full h-12 px-4 rounded-btn border border-sheet bg-paper-raised text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ultramarine focus:border-transparent transition-all"
              />
            </div>

            {/* Honeypot field - tersembunyi dari pengunjung nyata */}
            <input
              type="text"
              name="website_trap"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-btn bg-ultramarine hover:bg-ultramarine-press text-white font-medium text-sm transition-all btn-press shadow-raise-1 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses antrean...' : 'Daftar antrean'}
            </button>
          </form>

          <p className="mt-8 text-xs text-film text-center leading-relaxed">
            Data pribadi Anda dilindungi. Nomor telepon hanya digunakan untuk keperluan photobooth dan dihapus otomatis sesuai kebijakan acara.
          </p>
        </div>
      ) : (
        /* Status Tiket Berhasil */
        <div className="p-8 bg-paper-raised border border-sheet rounded-panel shadow-raise-2 text-center animate-fadeIn">
          <div className="w-12 h-12 mx-auto rounded-full bg-green-50 text-signal-ok flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <p className="text-xs font-medium text-film uppercase tracking-wider mb-2">
            Nomor Antrean Anda
          </p>
          <div className="font-display text-6xl font-bold text-ink tabular-nums my-4">
            {ticket.number}
          </div>

          <h2 className="font-display text-xl font-bold text-ink mb-1">
            Halo, {ticket.nickname}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-chip bg-ultramarine-wash text-ultramarine text-xs font-medium mt-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-ultramarine animate-pulse" />
            <span>{ticket.status}</span>
          </div>

          <p className="text-xs text-ink-soft leading-relaxed border-t border-sheet pt-4">
            Harap tetap berada di dekat booth. Nomor Anda akan dipanggil oleh operator dan muncul di layar tablet booth saat giliran tiba.
          </p>
        </div>
      )}
    </main>
  );
}
