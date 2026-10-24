'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { PixelCrossStar, PixelStreetLamp, PixelVendingMachine } from '@/components/pixel/PixelPosterDecorations';
import { retroAudio } from '@/utils/audio';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (
        (username === 'admin' && password === 'admin123') ||
        (username === 'operator' && password === 'operator123')
      ) {
        retroAudio.playSuccessChime();
        const maxAge = 8 * 60 * 60;
        document.cookie = `booth_admin_session=${username}; path=/; max-age=${maxAge}; SameSite=Lax`;
        router.push('/admin');
        router.refresh();
      } else {
        setError('Nama pengguna atau kata sandi tidak cocok.');
      }
    } catch {
      setError('Terjadi kendala saat memproses login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050C38] text-white font-pixel flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden select-none">
      {/* Background Layer: Gradien Langit Malam & Bintang Pixel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#160078] via-[#050C38] to-[#010030] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/assets/pixel/stars-a.png')] bg-repeat pixel-art opacity-50 animate-twinkle pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-[url('/assets/pixel/city-night.png')] bg-repeat-x bg-bottom pixel-art opacity-35 pointer-events-none" />

      {/* Dekorasi Pixel di Sudut Kiri dan Kanan */}
      <div className="absolute bottom-0 left-12 z-0 hidden md:block pointer-events-none">
        <PixelStreetLamp height={120} />
      </div>
      <div className="absolute bottom-0 right-12 z-0 hidden md:block pointer-events-none">
        <PixelVendingMachine height={110} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-pixel-title text-[#A9B8FF] hover:text-[#FFD84D] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&lt;&lt; KEMBALI KE BERANDA</span>
        </Link>

        <div className="bg-[#0C1230]/95 pixel-box p-8 backdrop-blur">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 pixel-box-cyber bg-[#E02F75] text-white flex items-center justify-center mx-auto mb-3 shadow-[0_0_12px_#E02F75]">
              <Shield className="w-7 h-7 text-white" />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[#FFD84D] mb-1">
              <PixelCrossStar size={10} />
              <h1 className="font-pixel-title text-sm tracking-wider">
                OPERATOR TERMINAL
              </h1>
              <PixelCrossStar size={10} />
            </div>
            <p className="text-xs text-[#A9B8FF]">
              EXPO WISUDA TIK 2026 &bull; Panel Laptop
            </p>
          </div>

          {error && (
            <div className="p-3 mb-5 border-2 border-[#FE0168] bg-[#FE0168]/20 text-[#FF8E72] text-xs font-pixel-title flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FE0168]" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-pixel-title text-[#FFD84D] mb-1.5">
                NAMA PENGGUNA
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="operator / admin"
                  className="w-full h-11 pl-10 pr-3 border-2 border-[#4B57B2] bg-[#050C38] text-white font-pixel text-xs focus:outline-none focus:border-[#E02F75] transition-all"
                />
                <User className="w-4 h-4 text-[#A9B8FF]/60 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-pixel-title text-[#FFD84D] mb-1.5">
                KATA SANDI
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3 border-2 border-[#4B57B2] bg-[#050C38] text-white font-pixel text-xs focus:outline-none focus:border-[#E02F75] transition-all"
                />
                <Lock className="w-4 h-4 text-[#A9B8FF]/60 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 pixel-btn bg-[#049A5C] hover:bg-[#00E599] text-white font-pixel-title text-xs tracking-wider transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'MEMERIKSA...' : 'MASUK KE DASHBOARD'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t-2 border-[#4B57B2]/40 text-center">
            <span className="text-[10px] text-white/50 block">
              Default: operator / operator123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
