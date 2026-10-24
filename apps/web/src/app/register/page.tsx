'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { VisitorRegistrationSchema } from '@photobooth/shared';
import { PixelTicketIcon } from '@/components/pixel/PixelIcons';
import { PixelCrossStar, PixelStreetLamp, PixelVendingMachine } from '@/components/pixel/PixelPosterDecorations';
import { retroAudio } from '@/utils/audio';

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
      // Simulasi panggilan pendaftaran antrean
      await new Promise((resolve) => setTimeout(resolve, 500));

      const randomTicketNum = Math.floor(Math.random() * 80) + 1;
      const formattedNum = `#${String(randomTicketNum).padStart(3, '0')}`;

      retroAudio.playSuccessChime();

      setTicket({
        number: formattedNum,
        nickname,
        status: 'DALAM ANTREAN',
      });

      // Simpan & pancarkan ke dashboard admin secara real-time
      try {
        const newItem = {
          id: `reg-${Date.now()}`,
          number: formattedNum,
          nickname,
          status: 'QUEUED',
          registeredAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          printCopies: 1,
        };
        const existing = JSON.parse(localStorage.getItem('photobooth_registered_tickets') || '[]');
        localStorage.setItem('photobooth_registered_tickets', JSON.stringify([newItem, ...existing]));

        const ch = new BroadcastChannel('photobooth_session_sync');
        ch.postMessage({ type: 'NEW_REGISTRATION', item: newItem });
        ch.close();
      } catch {}
    } catch {
      setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050C38] text-white font-pixel flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Layer: Gradien Langit Malam & Bintang Pixel */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-50 animate-twinkle pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-44 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-30 pointer-events-none" />

      {/* Dekorasi Pixel di Sudut Kiri dan Kanan */}
      <div className="fixed bottom-0 left-8 z-0 hidden lg:block pointer-events-none">
        <PixelStreetLamp height={120} />
      </div>
      <div className="fixed bottom-0 right-8 z-0 hidden lg:block pointer-events-none">
        <PixelVendingMachine height={110} />
      </div>

      <main className="max-w-md mx-auto px-6 py-12 relative z-10 w-full flex-1 flex flex-col justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-pixel-title text-[#A9B8FF] hover:text-[#FFD84D] mb-6 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&lt;&lt; KEMBALI KE BERANDA</span>
        </Link>

        {!ticket ? (
          <div className="bg-[#0C1230]/95 pixel-box-cyber p-8 backdrop-blur">
            <div className="mb-6 text-center">
              <div className="w-14 h-14 pixel-box-cyber bg-[#E02F75] text-white flex items-center justify-center mx-auto mb-3">
                <PixelTicketIcon size={32} />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[#FFD84D] mb-1">
                <PixelCrossStar size={10} />
                <h1 className="font-pixel-title text-base sm:text-lg tracking-wider">
                  DAFTAR ANTREAN
                </h1>
                <PixelCrossStar size={10} />
              </div>
              <p className="text-xs text-[#A9B8FF]">
                Masukkan nama Anda untuk nomor antrean bilik booth
              </p>
            </div>

            {error && (
              <div className="p-3 mb-5 border-2 border-[#FE0168] bg-[#FE0168]/20 text-[#FF8E72] text-xs font-pixel-title flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FE0168]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nickname" className="block text-[11px] font-pixel-title text-[#FFD84D] mb-1.5">
                  NAMA PANGGILAN <span className="text-[#FE0168]">*</span>
                </label>
                <input
                  id="nickname"
                  type="text"
                  required
                  maxLength={40}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Contoh: Diana"
                  className="w-full h-11 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white font-pixel text-xs focus:outline-none focus:border-[#E02F75] transition-all"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-[11px] font-pixel-title text-[#A9B8FF] mb-1.5">
                  NOMOR WHATSAPP (OPSIONAL)
                </label>
                <input
                  id="phone"
                  type="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full h-11 px-3 border-2 border-[#4B57B2] bg-[#050C38] text-white font-pixel text-xs focus:outline-none focus:border-[#E02F75] transition-all"
                />
              </div>

              {/* Honeypot Bot Trap */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 pixel-btn bg-[#E02F75] hover:bg-[#FE0168] text-white font-pixel-title text-xs tracking-wider transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'MENDAFTAR...' : 'DAPATKAN NOMOR TIKET'}
              </button>
            </form>
          </div>
        ) : (
          /* Tiket Berhasil */
          <div className="bg-[#0C1230]/95 pixel-box-cyber p-8 text-center backdrop-blur animate-fadeIn">
            <div className="w-12 h-12 pixel-box bg-[#0D5235] text-[#00E599] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <span className="font-pixel-title text-xs text-[#00E599] block mb-1">
              PENDAFTARAN BERHASIL!
            </span>
            <h2 className="font-pixel-title text-base text-white mb-6">
              HALO, {ticket.nickname}!
            </h2>

            {/* Tiket Nomor Kartrid */}
            <div className="p-6 bg-[#050C38] border-4 border-[#FFD84D] mb-6 relative">
              <span className="text-[10px] font-pixel-title text-[#A9B8FF] block mb-1">
                NOMOR ANTREAN ANDA:
              </span>
              <div className="font-pixel-title text-5xl sm:text-6xl text-[#FFD84D] tracking-wider my-2">
                {ticket.number}
              </div>
              <span className="inline-block px-3 py-1 bg-[#6700A3] text-[#5CE1E6] font-pixel-title text-[10px] border border-[#5CE1E6]/40">
                [ {ticket.status} ]
              </span>
            </div>

            <p className="text-xs text-white/70 mb-6 leading-relaxed">
              Nomor Anda akan dipanggil di layar bilik booth saat sesi foto siap dimulai.
            </p>

            <Link
              href="/"
              className="w-full h-12 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-xs flex items-center justify-center gap-2"
            >
              <span>KEMBALI KE BERANDA</span>
            </Link>
          </div>
        )}
      </main>

      <footer className="w-full border-t-4 border-[#4B57B2] py-3 px-6 relative z-10 bg-[#0C1230]/90 text-center text-[10px] text-[#A9B8FF]">
        EXPO WISUDA TIK 2026 &bull; SISTEM ANTREAN ATOMIK
      </footer>
    </div>
  );
}
