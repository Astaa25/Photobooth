import Link from 'next/link';
import { Camera, QrCode, LayoutDashboard, Image as ImageIcon, Printer, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
      {/* Header */}
      <header className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-ultramarine-wash text-ultramarine text-xs font-medium mb-4">
          <ShieldCheck className="w-4 h-4" />
          <span>Sistem Aktif &bull; Mode Mock Perangkat Keras Siap</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink mb-4">
          Photobooth Terintegrasi
        </h1>
        <p className="text-ink-soft text-lg max-w-2xl leading-relaxed">
          Pendaftaran antrean mandiri via QR Code ponsel, sesi foto di tablet Android dengan kamera Canon,
          pengolahan otomatis photo strip 4R, galeri digital, dan manajemen cetak operator.
        </p>
      </header>

      {/* Grid Menu Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* Kartu 1: Pendaftaran Antrean */}
        <Link
          href="/register"
          className="group block p-6 bg-paper-raised border border-sheet rounded-panel shadow-raise-1 hover:shadow-raise-2 transition-all btn-press"
        >
          <div className="w-12 h-12 rounded-btn bg-ultramarine text-white flex items-center justify-center mb-5">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-2">
            Pendaftaran Antrean
          </h2>
          <p className="text-ink-soft text-sm leading-relaxed mb-4">
            Alur pengunjung di ponsel: pindai QR di booth, masukkan nama panggilan, terima nomor antrean #020 tanpa akun.
          </p>
          <span className="text-ultramarine font-medium text-sm group-hover:underline">
            Buka Halaman Daftar &rarr;
          </span>
        </Link>

        {/* Kartu 2: Dashboard Operator */}
        <Link
          href="/admin"
          className="group block p-6 bg-paper-raised border border-sheet rounded-panel shadow-raise-1 hover:shadow-raise-2 transition-all btn-press"
        >
          <div className="w-12 h-12 rounded-btn bg-ink text-white flex items-center justify-center mb-5">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-2">
            Dashboard Operator
          </h2>
          <p className="text-ink-soft text-sm leading-relaxed mb-4">
            Pusat kendali di laptop: pantau nomor antrean, panggil pengunjung, mulai sesi tablet, dan kelola pesanan cetak 4R.
          </p>
          <span className="text-ink font-medium text-sm group-hover:underline">
            Buka Dashboard &rarr;
          </span>
        </Link>

        {/* Kartu 3: Galeri Pengunjung */}
        <Link
          href="/gallery"
          className="group block p-6 bg-paper-raised border border-sheet rounded-panel shadow-raise-1 hover:shadow-raise-2 transition-all btn-press"
        >
          <div className="w-12 h-12 rounded-btn bg-sheet text-ink flex items-center justify-center mb-5">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-2">
            Galeri Digital
          </h2>
          <p className="text-ink-soft text-sm leading-relaxed mb-4">
            Pratinjau hasil foto individual, strip komposit 4R, dan video slideshow dengan unduhan satuan atau paket ZIP.
          </p>
          <span className="text-ink-soft font-medium text-sm group-hover:underline">
            Lihat Contoh Galeri &rarr;
          </span>
        </Link>

        {/* Kartu 4: Status Perangkat Keras */}
        <div className="p-6 bg-paper-raised border border-sheet rounded-panel shadow-raise-1">
          <div className="w-12 h-12 rounded-btn bg-sheet text-ink flex items-center justify-center mb-5">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-2">
            Driver &amp; Perangkat
          </h2>
          <ul className="text-xs text-ink-soft space-y-2 mt-3">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-signal-ok" />
              <span>Camera Driver: Canon EOS (Mode Mock aktif, 1920x1280 JPEG)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-signal-ok" />
              <span>Printer Driver: SumatraPDF 4R (102 x 152 mm borderless)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-signal-ok" />
              <span>Template Engine: 5 Template 4R terpasang (Sharp)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="pt-8 border-t border-sheet text-xs text-film flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>Photobooth Terintegrasi &bull; Standar Keamanan &amp; Integritas Data Aktif</p>
        <p>Waktu Server: UTC &bull; Tampilan: Asia/Jakarta</p>
      </footer>
    </main>
  );
}
