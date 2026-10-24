'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';

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
      // Autentikasi operator/admin (default: operator / operator123 atau admin / admin123)
      if (
        (username === 'admin' && password === 'admin123') ||
        (username === 'operator' && password === 'operator123')
      ) {
        // Set cookie sesi untuk Next.js middleware (berlaku 8 jam)
        const maxAge = 8 * 60 * 60;
        document.cookie = `booth_admin_session=${username}; path=/; max-age=${maxAge}; SameSite=Lax`;

        // Redirect ke dashboard admin
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
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      {/* Background Glow Aksen Gradien Cyber */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-cyber opacity-15 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-sm relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </Link>

        <div className="bg-paper-raised border border-sheet rounded-panel p-8 shadow-raise-2">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-btn bg-gradient-night text-white flex items-center justify-center mx-auto mb-3 shadow-violet-glow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">
              Masuk Operator
            </h1>
            <p className="text-xs text-ink-soft mt-1">
              Photobooth Terintegrasi &bull; Panel Kendali Laptop
            </p>
          </div>

          {error && (
            <div className="p-3 mb-6 rounded-btn bg-red-50 border border-signal-bad/20 text-signal-bad text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Pengguna
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau operator"
                  className="w-full h-11 pl-10 pr-4 rounded-btn border border-sheet bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ultramarine transition-all"
                />
                <User className="w-4 h-4 text-film absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-btn border border-sheet bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ultramarine transition-all"
                />
                <Lock className="w-4 h-4 text-film absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-btn bg-gradient-night text-white font-medium text-sm transition-all btn-press shadow-raise-1 flex items-center justify-center gap-2 mt-2 hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Memeriksa kredensial...' : 'Masuk Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-sheet text-center">
            <span className="text-[11px] text-film">
              Akses terbatas untuk kru dan operator photobooth acara.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
