# Task

Urutan pengerjaan. Dikerjakan dari atas ke bawah. Fase tidak boleh dilompati karena fase berikutnya bergantung pada fase sebelumnya. Centang hanya setelah kriteria selesai terpenuhi dan dibuktikan (tes, perintah, atau pengamatan), bukan karena kodenya sudah ditulis.

Aturan khusus fase pertama: semua konfigurasi dan uji perangkat keras diselesaikan sebelum UI dibangun. Tujuannya satu: tidak ada pengerjaan ulang karena konfigurasi baru ketahuan di akhir.

---

## Fase 0. Keputusan dan konfigurasi (blokir semua fase lain)

Tujuan: semua hal yang berada di luar kode sudah diputuskan dan terpasang.

### 0.1 Keputusan (catat di `TECHSTACK.md` bagian "Keputusan yang dikunci")
- [x] Sistem operasi laptop (Windows 10/11)
- [x] Model kamera Canon dan metode kendali (Canon 1200D & Adaptif via `digicamcontrol` / `webcam` / `mock`)
- [x] Model printer dan ukuran kertas 4R (Epson L300 & Universal Windows Driver 4R)
- [x] Model tablet dan antarmuka (Universal Tablet Android & Web Kiosk)
- [x] Mode akses pengunjung: `lan-http` & Cloudflare Tunnel gratis
- [x] Mode galeri: `local` (gratis)
- [x] Metode pembayaran yang dicatat operator (Tunai & QRIS statis)
- [x] Kebijakan retensi data dan masa berlaku tautan galeri (30 hari)

### 0.2 Perangkat lunak di laptop
- [ ] Git, Node.js LTS, pnpm
- [ ] PostgreSQL terpasang, dua peran dibuat (`booth_app` hak terbatas, `booth_migrator`), database `booth`
- [ ] FFmpeg terpasang dan ada di PATH
- [ ] Flutter SDK dan Android Studio (Android SDK, driver USB tablet)
- [ ] Driver kendali kamera (digiCamControl atau gphoto2) terpasang dan teruji dengan kamera
- [ ] SumatraPDF (Windows) atau CUPS dikonfigurasi untuk printer
- [ ] mkcert, CA lokal dibuat, sertifikat untuk IP laptop diterbitkan
- [ ] gitleaks, lefthook
- [ ] Cloudflare Tunnel (bila `tunnel`), domain dan rute `/public/*` saja
- [ ] Bucket S3 atau R2 dan kunci terbatas (bila `cloud`)

### 0.3 Perangkat keras
- [ ] Kamera: mode manual (M), JPEG kualitas tinggi, auto power off mati, stabilisasi dan autofokus sesuai lensa, dummy battery LP-E10 terpasang, kartu memori dipasang
- [ ] EOS Utility dan aplikasi Canon lain tidak berjalan otomatis
- [ ] Kabel USB kamera ke laptop langsung (hindari hub murah)
- [ ] Printer: driver terpasang, profil kertas 4R tanpa tepi, uji cetak satu lembar dari aplikasi lain
- [ ] Tablet: mode pengembang aktif untuk build, baterai dan pengisi daya, layar tetap menyala, orientasi landscape
- [ ] Router atau titik akses khusus perangkat, SSID terpisah, IP statis laptop
- [ ] Windows: mode daya tinggi, tidur dan hibernasi mati, Windows Update dijadwalkan di luar jam acara, firewall membuka hanya port yang dibutuhkan

### 0.4 Repo dan rahasia
- [ ] Repo dibuat, `.gitignore` mencakup `.env`, `secrets/`, penyimpanan berkas, build
- [ ] `.env.example` dibuat sesuai `TECHSTACK.md`
- [ ] `pnpm secrets:generate` menghasilkan `SESSION_SECRET`, `ENCRYPTION_KEY`, `HMAC_PEPPER`
- [ ] lefthook menjalankan gitleaks, lint, typecheck sebelum commit
- [ ] Skill terpasang (lihat `SKILLS.md`)

**Selesai bila:** semua kotak di atas tercentang dan `TECHSTACK.md` tidak punya sel keputusan yang kosong.

---

## Fase 1. Fondasi dan uji perangkat keras

Tujuan: membuktikan jalur fisik bekerja dan menyiapkan kerangka proyek. Belum ada UI sungguhan.

- [ ] Inisialisasi monorepo pnpm: `apps/server`, `apps/web`, `apps/tablet`, `packages/shared`
- [ ] TypeScript `strict`, Biome, Vitest, konfigurasi bersama
- [ ] Validasi `.env` dengan zod saat server start, pesan error yang jelas
- [ ] `pnpm doctor` dengan semua pemeriksaan di `TECHSTACK.md`
- [ ] Skema database awal, migrasi pertama, peran aplikasi tanpa superuser
- [ ] Antarmuka `CameraDriver` dan `PrinterDriver` dengan implementasi `mock`
- [ ] **Uji kamera:** driver nyata mengambil satu foto lewat server, berkas diterima, valid, dan tersimpan. Live View menghasilkan aliran yang bisa dilihat. Catat apa yang tidak didukung model ini
- [ ] **Uji printer:** PDF 102 x 152 mm dicetak dari server, tepi tidak terpotong, orientasi benar, warna layak
- [ ] **Uji tablet:** aplikasi Flutter kosong terhubung ke server lewat HTTPS dengan CA tertanam, dan membuka WebSocket
- [ ] **Uji jaringan:** ponsel membuka halaman uji lewat mode akses yang dipilih
- [ ] Tulis hasil uji dan batasannya di `docs/adr/0001-hardware-findings.md`

**Selesai bila:** keempat uji lulus di perangkat sebenarnya dan terdokumentasi. Bila ada yang gagal, perbaiki atau ubah keputusan di Fase 0 sekarang, bukan nanti.

---

## Fase 2. Autentikasi, peran, dan keamanan dasar

Dikerjakan lebih dulu karena fitur lain bergantung pada ini.

- [ ] Tabel pengguna, peran `admin` dan `operator`, Argon2id
- [ ] Login, logout, sesi cookie aman, rotasi sesi, CSRF
- [ ] Rate limit dan penguncian sementara
- [ ] `pnpm admin:create` untuk akun pertama
- [ ] TOTP 2FA untuk admin
- [ ] Tiga kelompok rute (`/public`, `/tablet`, `/admin`), pemeriksaan `ADMIN_ALLOWED_CIDRS`
- [ ] Pairing tablet: kode sekali pakai, token perangkat ter-hash, pencabutan
- [ ] Header keamanan dan CSP dengan nonce
- [ ] Log pino dengan redaksi
- [ ] Log audit append-only (peran database tanpa UPDATE dan DELETE, trigger penolak)
- [ ] Pustaka enkripsi untuk nomor telepon (AES-256-GCM) dan HMAC
- [ ] Tes: akses tanpa login ditolak, operator tidak bisa membuka rute admin, token dicabut langsung ditolak

**Selesai bila:** checklist A12 di `SECURITY.md` lulus untuk semua rute yang ada, dan `pnpm security:scan` bersih.

---

## Fase 3. Antrean dan pendaftaran

- [ ] Tabel `event`, `visitor`, `queue_ticket`, `settings`
- [ ] Nomor antrean atomik per event, `UNIQUE (event_id, number)`
- [ ] Halaman daftar (ponsel) dengan validasi, honeypot, rate limit, Turnstile opsional
- [ ] Token pengunjung acak, halaman status real-time
- [ ] Mesin status antrean dengan transisi sah saja
- [ ] Dashboard antrean: daftar, ringkasan, panggil, lewati, kembalikan, batalkan
- [ ] WebSocket dengan autentikasi saat handshake, snapshot dan sinkron ulang
- [ ] QR Code pendaftaran yang dapat dicetak
- [ ] Gerak sesuai `StyleGuide.md` (transisi baris, cross-fade badge)
- [ ] Tes beban: 50 pendaftar bersamaan menghasilkan 50 nomor unik tanpa celah
- [ ] Tes: dilewati lalu dipanggil kembali, nomor tetap; tebak URL antrean orang lain ditolak

**Selesai bila:** skenario uji 1, 2, dan 11 di `PRD.md` lulus.

---

## Fase 4. Template fleksibel

- [ ] Tabel `template`, `template_version` (immutable)
- [ ] Unggah PNG aman (magic bytes, batas, encode ulang)
- [ ] Skema layout dengan koordinat relatif, `source_index`, mode potong, lapisan
- [ ] Editor visual slot dengan pratinjau langsung
- [ ] Perhitungan otomatis jumlah foto sumber dari `source_index`
- [ ] Pengaturan ukuran cetak 4R (1200 x 1800 piksel)
- [ ] Mesin render komposit (sharp), terpisah dari UI sehingga bisa diuji dengan keluaran referensi
- [ ] Tes visual: templat 4 slot, 3 slot, 2 slot, dan 8 slot dengan 4 foto sumber
- [ ] Tes: mengubah template tidak mengubah hasil sesi lama

**Selesai bila:** empat template contoh dirender benar tanpa perubahan kode.

---

## Fase 5. Sesi foto dan tablet

- [ ] Tabel `photo_session`, `capture`, partial unique index satu sesi aktif per booth
- [ ] Mesin status sesi
- [ ] Alur ambil foto sesuai `TECHSTACK.md`: tunggu berkas, validasi, baru lanjut
- [ ] Aplikasi Flutter: layar siaga, sapaan, pilih desain, Live View, hitung mundur, tinjau, retake per foto, konfirmasi
- [ ] Penanganan gagal: coba lagi, kamera putus, tablet putus dan tersambung ulang tanpa kehilangan sesi
- [ ] Dashboard menandai sesi yang butuh perhatian
- [ ] Momen sinematik sesuai `StyleGuide.md` (hitung mundur, jepret, strip meluncur)
- [ ] Mode kios di tablet
- [ ] Tes: dua operator memulai sesi bersamaan, hanya satu berhasil; kamera dicabut di tengah sesi, sesi tidak selesai; retake tidak mengubah foto lain
- [ ] Uji di tablet dan kamera sebenarnya, 60 fps terjaga

**Selesai bila:** skenario uji 3, 4, 5, dan 7 lulus di perangkat sebenarnya.

---

## Fase 6. Pengolahan hasil

- [ ] pg-boss, worker terpisah dari proses API
- [ ] Job: individual, strip, video, thumbnail dan placeholder blur
- [ ] Status job, percobaan ulang otomatis terbatas, tombol Coba lagi
- [ ] Buang EXIF dan GPS dari keluaran
- [ ] Nama berkas tanpa data pribadi
- [ ] Sesi `completed` hanya setelah individual dan strip sukses
- [ ] Tes: video gagal tidak menghapus foto, server dimatikan paksa saat proses lalu job dilanjutkan, menjalankan ulang job tidak membuat duplikat
- [ ] Ukur waktu: foto terakhir dikonfirmasi sampai QR Code tampil kurang dari 60 detik

**Selesai bila:** skenario uji 6 dan 12 lulus.

---

## Fase 7. Galeri dan QR Code

- [ ] Tabel `gallery` dengan token ter-hash, kedaluwarsa, pencabutan, PIN opsional
- [ ] Halaman galeri dengan semua sesi pengunjung, pratinjau, unduh satuan, ZIP streaming
- [ ] Header privasi dan `noindex`, penyajian berkas dengan pemeriksaan hak akses
- [ ] Rate limit pembukaan galeri dan unduh
- [ ] QR Code galeri di tablet dan di dashboard
- [ ] Sesi kedua dan ketiga masuk galeri yang sama
- [ ] Hapus data pengunjung (galeri, berkas, data pribadi) dengan audit
- [ ] Retensi otomatis nomor telepon dan berkas
- [ ] Gerak galeri sesuai `StyleGuide.md`
- [ ] Tes: token salah ditolak dan dibatasi, tautan dicabut langsung tidak berlaku, berkas belum selesai tidak tampil
- [ ] Mode `cloud` (bila dipilih): sinkron ke bucket, URL bertanda tangan, uji akses dari luar jaringan

**Selesai bila:** skenario uji 10 dan 11 lulus dan checklist A3 `SECURITY.md` terpenuhi.

---

## Fase 8. Pesanan cetak, pembayaran, printer

- [ ] Tabel `print_order`, `print_order_item`, `payment`, `print_job`
- [ ] Harga di `settings`, disalin ke item saat pesanan dibuat, uang bilangan bulat
- [ ] UI pemilihan hasil dan kontrol jumlah, subtotal dan total dihitung ulang di server
- [ ] Status pembayaran dan status cetak terpisah, mesin status keduanya
- [ ] Penolakan cetak sebelum `paid`, pengecualian admin dengan alasan dan audit
- [ ] Kunci idempoten untuk bayar dan cetak
- [ ] Pembuatan berkas cetak 4R sesuai profil yang lulus uji Fase 1
- [ ] Operator menandai lembar berhasil atau gagal bila printer tidak melaporkan status
- [ ] Cetak ulang: `reprint_free` dan `reprint_paid`, bukan penjualan baru
- [ ] Tes: skenario 8 dan 9; klik ganda tidak menggandakan transaksi; mengubah harga tidak mengubah riwayat

**Selesai bila:** laporan jumlah lembar berhasil sama dengan hitungan fisik pada uji dengan printer sebenarnya.

---

## Fase 9. Riwayat, laporan, audit

- [ ] Halaman riwayat pengunjung dan sesi (dua lapisan)
- [ ] Laporan: lembar berhasil, pesanan gagal, total transaksi, pendapatan, cetak ulang
- [ ] Penampil log audit dengan filter, tanpa kemampuan menyunting
- [ ] Ekspor laporan (CSV) tanpa data pribadi

**Selesai bila:** angka laporan cocok dengan data uji yang sudah diketahui.

---

## Fase 10. Pengerasan dan gladi bersih

- [ ] Jalankan semua skenario uji di `PRD.md` (1 sampai 12)
- [ ] Uji penetrasi ringan: tebak token, IDOR, unggah berkas berbahaya, CSRF, brute force login, injeksi nama
- [ ] `pnpm audit`, periksa dependensi, tinjauan keamanan lewat skill (lihat `SKILLS.md`)
- [ ] Audit aksesibilitas dan reduced motion
- [ ] Gladi bersih penuh 1 sampai 2 jam dengan orang yang bukan pengembang sebagai pengunjung dan operator
- [ ] Skrip cadangan dan uji pemulihan dari cadangan
- [ ] Panduan operator satu halaman (cetak), termasuk tindakan darurat
- [ ] Bekukan versi, catat di `TECHSTACK.md`, buat cadangan lockfile dan build

**Selesai bila:** gladi bersih berjalan tanpa campur tangan pengembang dan tidak ada temuan keamanan tingkat tinggi yang terbuka.

---

## Fase 11. Setelah MVP (opsional)

- [ ] Pembayaran QRIS otomatis lewat payment gateway
- [ ] Multi booth dalam satu event
- [ ] Notifikasi WhatsApp tautan galeri
- [ ] Tema dan merek per event

---

## Aturan alur kerja

- Satu fase satu cabang kerja, satu tugas satu commit yang kecil dan dapat dijelaskan.
- Setiap tugas mengikuti siklus: rencana, tes dulu, implementasi, verifikasi, tinjauan. Lihat `SKILLS.md`.
- Bila menemukan kebutuhan konfigurasi atau keputusan baru, berhenti, selesaikan, catat di `TECHSTACK.md`, baru lanjut.
- Bila sebuah fase mengungkap kesalahan di fase sebelumnya, perbaiki fase sebelumnya dulu, tulis alasannya di `docs/adr/`.
