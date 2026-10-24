# Photobooth Terintegrasi

Sistem photobooth yang menghubungkan kamera Canon, tablet Android, dan laptop operator dalam satu alur: pendaftaran antrean lewat QR Code, sesi foto di tablet, pengolahan hasil otomatis, galeri digital gratis, lalu cetak foto berbayar.

Dokumen ini adalah pintu masuk. Baca urutannya: README (ini) lalu PRD, TECHSTACK, SECURITY, StyleGuide, Task. CLAUDE.md dan SKILLS.md adalah instruksi untuk AI coding agent.

## Peta dokumen

| File | Menjawab pertanyaan |
|---|---|
| `README.md` | Apa proyek ini, bagaimana menjalankannya, apa yang harus dikonfigurasi dulu |
| `PRD.md` | Apa yang harus dibangun, untuk siapa, aturan bisnis, status, kriteria selesai |
| `TECHSTACK.md` | Teknologi apa yang dipakai, kenapa, struktur repo, variabel konfigurasi |
| `SECURITY.md` | Aturan keamanan aplikasi dan aturan yang wajib dipatuhi AI |
| `StyleGuide.md` | Tampilan, tipografi, warna, sistem animasi |
| `Task.md` | Urutan pengerjaan, dimulai dari konfigurasi dan uji perangkat keras |
| `CLAUDE.md` | Instruksi tetap yang dibaca Claude Code di awal setiap sesi |
| `SKILLS.md` | Daftar tugas berulang beserta aturan mainnya, dan skill yang dipakai |

## Arsitektur singkat

```
  Ponsel pengunjung                         Laptop operator (pusat kendali)
  ┌──────────────────┐                    ┌─────────────────────────────────────┐
  │ Halaman daftar   │──── HTTPS ────────▶│ Next.js (admin, daftar, galeri)     │
  │ Galeri + unduh   │◀───────────────────│ Fastify API + WebSocket             │
  └──────────────────┘                    │ Worker (sharp, FFmpeg, pg-boss)     │
                                          │ PostgreSQL + penyimpanan berkas     │
  Tablet Android (Flutter)                │ Driver kamera   Driver printer      │
  ┌──────────────────┐                    └───────┬───────────────┬─────────────┘
  │ Antrean aktif    │◀── HTTPS + WS ────────────┘               │
  │ Pilih desain     │                         USB│               │USB
  │ Live view, foto  │                     ┌──────▼─────┐   ┌─────▼──────┐
  └──────────────────┘                     │ Canon EOS  │   │ Printer 4R │
                                           └────────────┘   └────────────┘
```

Aturan emas arsitektur: kamera dan printer hanya disentuh oleh server di laptop. Tablet tidak pernah bicara langsung ke kamera atau printer.

## Konfigurasi dulu, kode kemudian

Kesalahan paling mahal di proyek seperti ini adalah membangun fitur, lalu menemukan di akhir bahwa kamera tidak bisa Live View, printer memotong tepi foto, atau tablet menolak koneksi karena sertifikat. Karena itu seluruh konfigurasi dikunci di awal, dan diverifikasi oleh perintah `pnpm doctor` sebelum fitur apa pun dikerjakan.

Checklist lengkap ada di `Task.md` bagian Fase 0 dan Fase 1. Ringkasannya:

1. Putuskan tujuh hal ini sebelum menulis kode. Jawaban dicatat di `TECHSTACK.md` bagian "Keputusan yang dikunci".
   - Sistem operasi laptop (default: Windows 10 atau 11)
   - Model pasti kamera Canon dan metode kendali (digiCamControl atau gphoto2)
   - Model printer dan profil kertas 4R tanpa tepi
   - Model tablet dan versi Android
   - Mode akses pengunjung: `tunnel` (domain publik, HTTPS valid) atau `lan-http` (tanpa internet)
   - Mode galeri: `local` atau `cloud`
   - Metode pembayaran yang dicatat operator (tunai, QRIS statis, transfer)
2. Pasang perangkat lunak: Node.js LTS, pnpm, PostgreSQL, FFmpeg, Git, Flutter SDK dengan Android Studio, driver kamera, gitleaks, mkcert.
3. Atur perangkat keras: mode kamera, dummy battery LP-E10, jaringan, printer, tablet.
4. Salin `.env.example` ke `.env`, isi, lalu jalankan `pnpm doctor`. Semua baris harus lulus.
5. Jalankan uji perangkat keras (Fase 1): ambil satu foto dari kamera lewat server, cetak satu lembar 4R dari laptop, buka Live View di tablet. Jika salah satu gagal, perbaiki dulu. Jangan lanjut ke UI.

Jika AI atau kamu menemukan kebutuhan konfigurasi baru di tengah jalan, berhenti dan selesaikan konfigurasinya saat itu juga, lalu catat di `TECHSTACK.md`. Jangan membangun di atas asumsi.

## Struktur repo

```
.
├── apps/
│   ├── server/        Fastify API, WebSocket, worker, driver kamera dan printer
│   ├── web/           Next.js: admin, halaman daftar, galeri pengunjung
│   └── tablet/        Flutter (Android)
├── packages/
│   └── shared/        Skema zod, tipe, konstanta status, kontrak WebSocket
├── scripts/           doctor, seed, backup, setup helper
├── docs/adr/          Catatan keputusan arsitektur
├── .env.example
└── (dokumen: README, PRD, TECHSTACK, SECURITY, StyleGuide, Task, CLAUDE, SKILLS)
```

## Perintah utama

```bash
pnpm install --frozen-lockfile      # pasang dependensi sesuai lockfile
pnpm doctor                         # cek semua konfigurasi dan perangkat
pnpm db:migrate                     # jalankan migrasi database
pnpm db:seed                        # data contoh (template, pengaturan awal)
pnpm dev                            # server, web, worker secara bersamaan
pnpm test                           # unit dan integrasi
pnpm test:e2e                       # Playwright
pnpm lint && pnpm typecheck
pnpm security:scan                  # gitleaks dan pnpm audit
pnpm backup                         # dump database dan salin berkas ke disk cadangan
```

Tablet:

```bash
cd apps/tablet
flutter pub get
flutter run --dart-define-from-file=config/dev.json
```

`config/dev.json` hanya berisi nilai non-rahasia seperti alamat server. Tidak ada rahasia di dalam aplikasi tablet.

## Mode pengembangan tanpa perangkat keras

Driver kamera dan printer punya implementasi `mock`. Dengan `CAMERA_DRIVER=mock` dan `PRINTER_DRIVER=mock`, seluruh alur dari pendaftaran sampai cetak bisa diuji tanpa kamera dan printer. Mock tetap mensimulasikan keterlambatan, kegagalan acak, dan kamera putus, supaya penanganan error ikut teruji. Mock tidak menggantikan uji perangkat keras di Fase 1 dan Fase 10.

## Checklist hari acara

Sehari sebelum:
- [ ] `pnpm doctor` lulus di laptop yang akan dibawa
- [ ] Cadangan database dan berkas terbaru tersimpan
- [ ] Kertas dan tinta cukup, satu lembar uji tercetak benar
- [ ] Baterai tablet penuh, mode kios aktif, pengisi daya cadangan dibawa
- [ ] Dummy battery LP-E10 terpasang, kartu memori kosong sebagai cadangan
- [ ] Router dan kabel cadangan, alamat IP statis laptop sesuai `.env`
- [ ] Pengaturan tidur layar dan hibernasi laptop dimatikan, mode daya tinggi
- [ ] Jika mode `tunnel`: tunnel aktif dan halaman daftar terbuka dari data seluler

Di lokasi:
- [ ] Jalankan `pnpm doctor` lagi setelah semua terpasang
- [ ] Sesi uji end to end: daftar, foto, galeri, bayar, cetak
- [ ] Cetak QR Code pendaftaran dan tempel di dekat booth
- [ ] Operator tahu tombol darurat: batalkan sesi, tandai cetak gagal, cetak ulang

## Pemecahan masalah cepat

| Gejala | Penyebab paling mungkin | Tindakan |
|---|---|---|
| Kamera tidak terdeteksi | EOS Utility atau aplikasi lain menguasai kamera | Tutup aplikasi lain, cabut dan colok USB, nyalakan ulang kamera |
| Kamera mati sendiri | Auto power off aktif | Matikan di menu kamera, pastikan dummy battery terpasang rapat |
| Live View hitam | Mode kamera atau lensa tidak sesuai | Cek mode M dan sakelar fokus lensa, uji di digiCamControl dulu |
| Tablet tidak bisa terhubung | Sertifikat tidak dipercaya atau firewall | Cek CA tertanam di aplikasi, buka port di firewall Windows |
| Foto cetak terpotong | Profil kertas bukan 4R tanpa tepi | Atur ulang profil printer dan margin, cetak ulang uji |
| Pengunjung tidak bisa buka halaman | Mode akses salah atau tunnel mati | Cek `PUBLIC_MODE` dan status tunnel |
| Antrean tidak update | WebSocket terputus | Tablet dan dashboard otomatis sinkron ulang, cek jaringan |

## Lisensi dan privasi

Nomor telepon pengunjung bersifat opsional, disimpan terenkripsi, dan dihapus otomatis sesuai masa retensi di pengaturan. Rincian ada di `SECURITY.md`.
