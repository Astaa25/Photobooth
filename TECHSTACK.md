# Tech Stack

Daftar ini mengikat. AI dan pengembang tidak boleh mengganti framework, library utama, atau menambah dependensi besar tanpa persetujuan eksplisit dan catatan di `docs/adr/`. Alasan: stack yang berubah di tengah jalan adalah sumber utama pengerjaan ulang.

## Versi

Gunakan versi stabil terbaru pada hari proyek diinisialisasi, lalu kunci lewat lockfile dan catat di tabel ini. Jangan memakai `latest` atau rentang longgar untuk dependensi produksi.

| Komponen | Versi terkunci | Tanggal dikunci |
|---|---|---|
| Node.js (LTS) | diisi saat inisialisasi | |
| pnpm | | |
| PostgreSQL | | |
| Next.js | | |
| Fastify | | |
| Flutter / Dart | | |
| FFmpeg | | |

## Stack utama

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Bahasa | TypeScript mode `strict` | Satu bahasa untuk server, web, dan paket bersama |
| Monorepo | pnpm workspaces | Skema dan tipe dipakai bersama |
| Server | Fastify | Cepat, skema-first, mudah dites |
| Validasi | zod, dibagikan lewat `packages/shared` | Satu sumber kebenaran untuk request, response, WebSocket |
| Database | PostgreSQL | Transaksi, constraint, partial unique index untuk aturan sesi aktif |
| ORM dan migrasi | Drizzle ORM dan drizzle-kit | SQL terkendali, migrasi tertulis, tipe aman |
| Antrean job | pg-boss | Memakai PostgreSQL, tanpa Redis tambahan, tahan restart |
| Real-time | WebSocket native (`@fastify/websocket`) | Ringan, klien Flutter sederhana, protokol sendiri dengan sinkron ulang |
| Gambar | sharp | Komposit, crop, resize, buang EXIF, thumbnail, placeholder blur |
| Video | FFmpeg (dipanggil via proses anak, argumen array, tanpa shell) | Slideshow dari foto |
| QR | `qrcode` | Pembuatan QR di server |
| ZIP | archiver (stream) | Unduh Semua tanpa memuat semuanya ke memori |
| PDF cetak | pdf-lib | Berkas tepat 102 x 152 mm untuk printer |
| Web | Next.js App Router, React, TypeScript | Admin, halaman daftar, galeri |
| Gaya | Tailwind CSS dengan token dari `StyleGuide.md` | Konsisten, tanpa CSS liar |
| Komponen | Radix UI primitives, dibungkus komponen sendiri | Aksesibel, tidak terlihat seperti template bawaan |
| Animasi web | Motion (pustaka `motion`) dan CSS transition | Spring lembut dan transisi ringan |
| Data klien | TanStack Query | Cache, refetch saat WebSocket menyatakan data berubah |
| Form | react-hook-form dan zod | Validasi sama dengan server |
| Ikon | Lucide, satu ketebalan garis | Konsisten, tanpa emoji |
| Font | Bricolage Grotesque dan Figtree, dihosting sendiri | Offline-safe, lisensi OFL |
| Tablet | Flutter (Android), Riverpod, go_router, dio, web_socket_channel | Satu codebase, state jelas |
| Penyimpanan rahasia tablet | flutter_secure_storage | Token perangkat tidak di preferensi biasa |
| Kamera | Antarmuka `CameraDriver`: `digicamcontrol`, `gphoto2`, `mock` | Model Canon menentukan metode, kode tidak boleh bergantung satu cara |
| Printer | Antarmuka `PrinterDriver`: `sumatra` (Windows), `cups` (macOS/Linux), `mock` | Cetak lewat driver OS |
| Pengujian | Vitest, Playwright, flutter_test, integration_test, k6 atau autocannon | Unit, E2E, beban pendaftaran |
| Lint dan format | Biome (TS), `flutter_lints` (Dart) | Satu alat cepat |
| Git hooks | lefthook | gitleaks, lint, typecheck sebelum commit |
| Log | pino dengan redaksi | Nomor telepon dan token tidak pernah masuk log |
| Tunnel publik (opsional) | Cloudflare Tunnel | HTTPS valid tanpa membuka port router |
| Penyimpanan cloud (opsional) | Bucket kompatibel S3 (Cloudflare R2, MinIO, atau S3) | Sinkron galeri mode `cloud` |

## Keputusan yang dikunci

Isi seluruhnya sebelum Fase 2. Tanpa ini tidak ada fitur yang dikerjakan.

| Keputusan | Pilihan | Catatan |
|---|---|---|
| OS laptop | (default: Windows 10 atau 11) | digiCamControl hanya Windows |
| Model kamera Canon | | Cek dukungan Live View dan kendali jarak jauh |
| Metode kendali kamera | | `digicamcontrol`, `gphoto2` |
| Model printer dan profil kertas | | Profil 4R tanpa tepi dan hasil cetak uji |
| Model tablet dan versi Android | | Mode kios, layar tetap menyala |
| Mode akses pengunjung | `tunnel` atau `lan-http` | `tunnel` direkomendasikan, perlu internet |
| Mode galeri | `local` atau `cloud` | Mengubahnya nanti butuh migrasi berkas |
| Pembayaran | tunai, QRIS statis, transfer | Operator mencatat. Gateway otomatis ditunda |
| Jumlah booth | 1 | Skema sudah siap multi booth |

Catatan teknis kamera: dummy battery LP-E10 dan kabel mini USB menunjuk ke keluarga EOS seri 1100D sampai 4000D, tetapi model pasti harus diverifikasi sebelum diasumsikan. Dummy battery hanya menyuplai daya, tidak mengirim foto. EOS Utility dan aplikasi Canon lain harus ditutup karena menguasai kamera.

## Jaringan dan sertifikat

Tiga jenis klien dengan kebutuhan berbeda. Putuskan sebelum Fase 2.

| Klien | Cara akses | Keamanan |
|---|---|---|
| Browser admin di laptop | `https://localhost` atau `http://localhost` | Localhost dianggap secure context oleh browser, tidak perlu sertifikat |
| Tablet Android | HTTPS ke IP statis laptop | Sertifikat dari CA lokal (mkcert). Sertifikat publik CA itu ditanam di aplikasi tablet lewat `network_security_config` sehingga tablet tidak perlu mengubah pengaturan sistem |
| Ponsel pengunjung | Mode `tunnel`: domain publik HTTPS valid. Mode `lan-http`: HTTP biasa di jaringan lokal | Mode `lan-http` membuat token galeri terlihat di jaringan. Wajib aktifkan PIN galeri bila memakainya |

Aturan jaringan:
- Laptop memakai IP statis atau reservasi DHCP. Alamat dicatat di `.env`.
- Kamera dan printer terhubung USB ke laptop, bukan lewat jaringan.
- Tablet dan laptop berada di jaringan perangkat yang terpisah dari jaringan tamu. Gunakan SSID khusus perangkat dengan WPA2 atau WPA3.
- Windows Firewall: izinkan hanya port yang diperlukan dan hanya dari subnet perangkat.
- Zona waktu server `Asia/Jakarta`, disimpan di database dalam UTC.

## Tiga kelompok rute server

Satu proses Fastify, tiga kelompok rute dengan autentikasi berbeda:

| Prefiks | Dipakai oleh | Autentikasi |
|---|---|---|
| `/public/*` | Ponsel pengunjung | Token pengunjung atau token galeri, rate limit ketat |
| `/tablet/*` | Tablet | Token perangkat hasil pairing, cakupan terbatas |
| `/admin/*` | Dashboard | Sesi cookie, peran, daftar IP yang diizinkan (`ADMIN_ALLOWED_CIDRS`), CSRF |

Rute admin tidak boleh dapat dijangkau dari tunnel publik. Tunnel hanya mengarah ke `/public/*` dan halaman web publik.

## Struktur penyimpanan berkas

Di luar repo, path dari `STORAGE_ROOT`:

```
{STORAGE_ROOT}/
├── templates/{templateVersionId}/{background|overlay}.png
├── sessions/{sessionId}/
│   ├── originals/{captureId}.jpg
│   ├── outputs/{outputId}.{jpg|mp4}
│   └── thumbs/{outputId}.webp
├── tmp/                      dibersihkan berkala
└── backups/
```

Nama berkas memakai UUID atau ID acak. Tidak ada nama pengunjung dan nomor telepon di path. Berkas disajikan lewat server dengan pemeriksaan hak akses, bukan lewat direktori statis.

## Protokol WebSocket

- Amplop: `{ type, id, ts, payload }`, divalidasi zod dari `packages/shared`.
- Autentikasi saat handshake, bukan setelahnya. Periksa `Origin`.
- Event: `queue.updated`, `session.started`, `session.status`, `capture.progress`, `job.updated`, `camera.status`, `device.status`, `print.updated`.
- Setelah tersambung ulang, klien memanggil endpoint snapshot lalu menerapkan event baru. Event tidak dianggap satu-satunya sumber kebenaran.
- Heartbeat tiap 15 detik, kehilangan dua kali berarti perangkat ditandai terputus di dashboard.
- Reconnect memakai exponential backoff dengan jitter.

## Alur ambil foto

1. Server mengirim perintah jepret lewat `CameraDriver.capture()`.
2. Driver menunggu berkas, batas waktu 15 detik.
3. Server memeriksa ukuran lebih dari 0 dan `sharp(file).metadata()` berhasil.
4. Baru setelah itu `capture.status = received` dan tablet lanjut ke hitung mundur berikutnya.
5. Gagal: dicoba ulang sesuai kebijakan, lalu tablet menawarkan Coba lagi.

Live View: server meneruskan aliran MJPEG ke tablet pada `/tablet/liveview`, sekitar 12 sampai 15 fps, lebar 960 px. Hanya satu klien Live View aktif.

## Pengolahan hasil

- Job: `render_individuals`, `render_strip`, `render_video`, `make_thumbnails`, `sync_cloud`.
- Idempoten: menjalankan ulang job menghasilkan keluaran yang sama dan tidak membuat duplikat.
- Percobaan ulang otomatis maksimal 3 kali dengan jeda bertambah, setelah itu `failed` dan tombol Coba lagi muncul di dashboard.
- Sesi `completed` hanya bila `render_individuals` dan `render_strip` berhasil. Video dan sinkron cloud tidak menghalangi QR Code, tetapi statusnya tampil.
- FFmpeg dipanggil dengan argumen array, tanpa string shell, dengan batas waktu dan batas memori.

## Variabel konfigurasi (`.env.example`)

Nilai rahasia tidak pernah di-commit. Skema divalidasi zod saat server mulai. Bila ada yang hilang atau salah format, server menolak start dengan pesan yang jelas.

```dotenv
# Umum
NODE_ENV=development
TZ=Asia/Jakarta

# Database. Aplikasi memakai peran dengan hak terbatas, migrasi memakai peran terpisah.
DATABASE_URL=postgres://booth_app:CHANGE_ME@localhost:5432/booth
DATABASE_MIGRATOR_URL=postgres://booth_migrator:CHANGE_ME@localhost:5432/booth

# Server dan jaringan
API_HOST=0.0.0.0
API_PORT=4000
WEB_ORIGIN=http://localhost:3000
PUBLIC_BASE_URL=https://booth.example.com
PUBLIC_MODE=tunnel                 # tunnel | lan-http
ADMIN_ALLOWED_CIDRS=127.0.0.1/32,192.168.50.0/24
TLS_CERT_PATH=./secrets/server.pem
TLS_KEY_PATH=./secrets/server-key.pem

# Rahasia (buat dengan: pnpm secrets:generate)
SESSION_SECRET=
ENCRYPTION_KEY=                    # 32 byte, base64
HMAC_PEPPER=                       # untuk hash nomor telepon dan token
GALLERY_TOKEN_BYTES=32

# Penyimpanan
STORAGE_ROOT=D:/booth-storage
BACKUP_ROOT=E:/booth-backup

# Kamera
CAMERA_DRIVER=mock                 # mock | digicamcontrol | gphoto2
DIGICAM_BASE_URL=http://127.0.0.1:5513
CAPTURE_TIMEOUT_MS=15000
LIVEVIEW_ENABLED=true

# Printer
PRINTER_DRIVER=mock                # mock | sumatra | cups
PRINTER_NAME=
SUMATRA_PATH=
PRINT_PAPER=4R

# Media
FFMPEG_PATH=ffmpeg

# Sinkron cloud (opsional)
GALLERY_MODE=local                 # local | cloud
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Anti-bot pendaftaran (opsional)
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Pengaturan yang boleh berubah saat acara disimpan di tabel `settings`, bukan di `.env`: harga per lembar, jumlah detik hitung mundur, masa retensi data, izin pemilihan desain, PIN galeri aktif atau tidak, jumlah sesi maksimal per antrean.

## Perintah `pnpm doctor`

Memeriksa dan melaporkan lulus atau gagal untuk setiap baris, dengan petunjuk perbaikan:

- Versi Node, pnpm, FFmpeg, PostgreSQL
- `.env` lengkap, rahasia memenuhi panjang minimum, bukan nilai contoh
- Koneksi database, peran aplikasi tidak superuser, migrasi terbaru
- `STORAGE_ROOT` dan `BACKUP_ROOT` dapat ditulis, ruang kosong memadai
- Port bebas
- Sertifikat TLS ada dan belum kedaluwarsa
- Kamera terdeteksi, dapat mengambil satu foto uji
- Printer ditemukan, profil 4R tersedia
- Waktu sistem dan zona waktu benar
- Tunnel aktif (bila `PUBLIC_MODE=tunnel`)

## Konvensi kode

- TypeScript `strict`, tanpa `any` tanpa komentar alasan.
- Semua input luar divalidasi zod di batas sistem.
- Logika bisnis di `apps/server/src/domain`, bukan di handler HTTP.
- Perubahan status hanya lewat fungsi mesin status yang menolak transisi tidak sah.
- Migrasi database tidak pernah diedit setelah digabung, selalu migrasi baru.
- Uang: bilangan bulat rupiah.
- Waktu: UTC di database, tampil WIB di UI.
- Satu keputusan arsitektur, satu berkas di `docs/adr/` dengan format Konteks, Keputusan, Konsekuensi.
