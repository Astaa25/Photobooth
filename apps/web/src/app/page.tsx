import Link from 'next/link';
import { QrCode, Image as ImageIcon, Sparkles, Shield, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-ink relative overflow-hidden flex flex-col justify-between">
      {/* Background Decorative Glow Aksen Gradien Cyber & Night */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-cyber opacity-20 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-gradient-night opacity-20 blur-3xl pointer-events-none rounded-full" />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-20 w-full relative z-10 flex-1">
        {/* Event Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-chip bg-gradient-cyber text-white text-xs font-semibold shadow-cyber-glow mb-6">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Expo Wisuda Jurusan TIK 2026</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-ink mb-4 leading-tight">
          Selamat Datang di <br />
          <span className="bg-gradient-cyber bg-clip-text text-transparent">
            Photobooth TIK
          </span>
        </h1>

        <p className="text-ink-soft text-base sm:text-lg max-w-2xl leading-relaxed mb-12">
          Abadikan momen wisuda spesial Anda bersama teman dan keluarga.
          Daftar antrean langsung dari ponsel Anda, foto di booth, unduh semua file digital secara gratis,
          dan dapatkan cetakan fisik 4R berkualitas tinggi.
        </p>

        {/* Action Cards Pengunjung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Ambil Nomor Antrean */}
          <Link
            href="/register"
            className="group relative p-8 bg-paper-raised border border-sheet rounded-panel shadow-raise-1 hover:shadow-raise-3 transition-all btn-press overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-cyber opacity-10 rounded-bl-full pointer-events-none group-hover:opacity-20 transition-opacity" />
            <div className="w-14 h-14 rounded-btn bg-gradient-cyber text-white flex items-center justify-center mb-6 shadow-cyber-glow">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink mb-2 flex items-center justify-between">
              <span>Ambil Nomor Antrean</span>
              <ChevronRight className="w-5 h-5 text-film group-hover:text-cyber-magenta transition-colors" />
            </h2>
            <p className="text-ink-soft text-sm leading-relaxed mb-4">
              Isi nama panggilan Anda untuk mendapatkan tiket antrean digital. Giliran Anda akan dipanggil di layar booth.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyber-magenta group-hover:underline">
              Daftar Sekarang &rarr;
            </span>
          </Link>

          {/* Card 2: Buka Galeri Foto */}
          <Link
            href="/gallery"
            className="group relative p-8 bg-paper-raised border border-sheet rounded-panel shadow-raise-1 hover:shadow-raise-3 transition-all btn-press overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-night opacity-10 rounded-bl-full pointer-events-none group-hover:opacity-20 transition-opacity" />
            <div className="w-14 h-14 rounded-btn bg-gradient-night text-white flex items-center justify-center mb-6 shadow-violet-glow">
              <ImageIcon className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink mb-2 flex items-center justify-between">
              <span>Galeri Foto Saya</span>
              <ChevronRight className="w-5 h-5 text-film group-hover:text-night-violet transition-colors" />
            </h2>
            <p className="text-ink-soft text-sm leading-relaxed mb-4">
              Sudah selesai berfoto? Lihat pratinjau hasil foto individual, strip 4R, dan unduh paket ZIP langsung ke ponsel.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-night-violet group-hover:underline">
              Buka Galeri &rarr;
            </span>
          </Link>
        </div>

        {/* Info Fasilitas */}
        <div className="p-6 bg-paper-raised border border-sheet rounded-panel shadow-raise-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-signal-ok flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Hasil Foto Digital 100% Gratis</p>
              <p className="text-xs text-film">Tersedia 5 pilihan desain bingkai 4R &bull; Resolusi asli Canon EOS</p>
            </div>
          </div>
          <div className="text-xs text-ink-soft sm:text-right">
            Cetak fisik 4R tersedia di booth &bull; Rp15.000 / lembar
          </div>
        </div>
      </main>

      {/* Footer Terpisah (Akses Operator Tersembunyi) */}
      <footer className="w-full border-t border-sheet py-6 px-6 relative z-10 bg-paper/80 backdrop-blur">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-film">
          <p>&copy; 2026 Jurusan TIK &bull; Photobooth Terintegrasi</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-film hover:text-ink transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk Operator</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
