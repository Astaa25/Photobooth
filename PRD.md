# Product Requirements Document

PRD menjelaskan apa yang harus dibangun. Cara membangunnya ada di `TECHSTACK.md`, urutannya di `Task.md`.

## Product Goal

Mengurangi pekerjaan manual operator photobooth dan menghapus antrean yang berantakan. Pengunjung mendaftar sendiri lewat ponsel, difoto lewat tablet, menerima semua hasil digital secara gratis, dan bisa membeli cetakan 4R. Operator cukup mengatur antrean, memeriksa pembayaran, dan mengawasi cetak dari satu laptop.

Ukuran keberhasilan:
- Operator tidak perlu mengetik nama pengunjung untuk 95 persen sesi.
- Waktu dari "mulai sesi" sampai QR Code galeri tampil di tablet kurang dari 60 detik setelah foto terakhir dikonfirmasi (untuk 4 foto, video 6 detik).
- Nol nomor antrean ganda dan nol hasil foto tertukar di uji beban 50 pendaftar bersamaan.
- Jumlah lembar tercetak di laporan sama dengan hitungan fisik di akhir acara.
- Satu kegagalan (video, printer, koneksi) tidak pernah menghilangkan foto yang sudah tersimpan.

## Target Users

| Pengguna | Perangkat | Kebutuhan utama |
|---|---|---|
| Pengunjung | Ponsel sendiri, tanpa akun | Daftar cepat, tahu giliran, unduh hasil |
| Pengunjung di booth | Tablet | Layar jelas, hitung mundur, bisa ulang foto |
| Operator | Laptop | Kontrol antrean, pembayaran, cetak, tanpa kebingungan |
| Admin | Laptop | Template, harga, laporan, audit, pengaturan |

Pengguna bukan teknisi. Setiap pesan error harus menjelaskan apa yang terjadi dan apa yang bisa dilakukan.

## Ruang lingkup

Masuk (MVP):
1. Pendaftaran antrean via QR Code, nomor antrean tetap
2. Dashboard operator: antrean, status, panggil, lewati, batalkan, riwayat
3. Sesi foto di tablet: pilih desain, Live View (bila didukung), hitung mundur, retake per foto
4. Template fleksibel yang bisa diunggah admin tanpa ubah kode
5. Pengolahan otomatis: foto individual, photo strip, video slideshow, thumbnail
6. Galeri digital per pengunjung dengan QR Code, unduh satuan dan ZIP
7. Pesanan cetak, pembayaran dicatat operator, pencetakan 4R, cetak ulang
8. Riwayat, laporan, log audit
9. Keamanan dasar penuh (lihat `SECURITY.md`)

Ditunda (setelah MVP):
- Integrasi pembayaran otomatis (payment gateway QRIS dinamis)
- Sinkronisasi ke penyimpanan cloud bila belum dipilih di Fase 0
- Beberapa booth dalam satu event (skema database sudah siap lewat `booth_id`)
- Notifikasi WhatsApp otomatis
- Filter wajah dan efek AR

Di luar ruang lingkup: akun pengunjung, media sosial otomatis, pengeditan foto oleh pengunjung.

## Entitas dan hubungan

Antrean, pengunjung, dan sesi adalah tiga konsep berbeda. Jangan digabung.

```
event ──< visitor ──< queue_ticket ──< photo_session ──< capture (versi foto)
                │                           │
                │                           ├──< output (individual, strip, video, thumbnail)
                │                           └──< processing_job
                └── gallery (token) ──── memuat semua sesi milik visitor di event itu

template ──< template_version (immutable) ──── dipakai photo_session
print_order ──< print_order_item (menunjuk output) ──< payment
print_order ──< print_job (setiap percobaan cetak)
settings, audit_log (append-only), device (tablet terpasangkan), user (admin/operator)
```

Aturan data:
- Satu pengunjung bisa punya banyak antrean pada waktu berbeda. Satu antrean menghasilkan satu atau lebih sesi sesuai aturan event.
- Setiap sesi menyimpan `template_version_id`. Mengubah template membuat versi baru dan tidak mengubah sesi lama.
- Harga per lembar disalin ke `print_order_item.unit_price` saat pesanan dibuat. Uang disimpan sebagai bilangan bulat rupiah, tidak pernah float.
- Foto pengganti retake disimpan sebagai versi baru; versi lama ditandai `superseded`, tidak dihapus.

## Fitur inti dan kriteria penerimaan

### F1. Pendaftaran dan nomor antrean
- Pengunjung memindai QR, membuka halaman daftar, mengisi nama panggilan (wajib) dan nomor telepon (opsional), lalu menekan Daftar.
- Server memberi nomor berurutan per event lewat transaksi atomik. Tampil sebagai `#020`.
- Nomor tidak pernah berubah dan tidak dipakai ulang, termasuk saat pengunjung dilewati atau dibatalkan.
- Halaman status menampilkan nama, nomor, status, dan pembaruan real-time. Diakses lewat token pengunjung acak, bukan ID berurutan.
- Penerimaan: 50 pendaftaran bersamaan menghasilkan 50 nomor unik berurutan tanpa celah akibat error.

### F2. Dashboard dan pengelolaan antrean
Status antrean:

| Kode | Tampilan | Arti |
|---|---|---|
| `queued` | Dalam Antrean | Baru mendaftar |
| `waiting` | Menunggu | Dilewati sementara |
| `in_session` | Sedang Foto | Sesi aktif |
| `done` | Selesai Foto | Hasil tersimpan |
| `cancelled` | Dibatalkan | Dibatalkan operator atau aturan |

Transisi yang sah: `queued → in_session`, `queued → waiting`, `waiting → in_session`, `waiting → queued`, `in_session → done`, `queued/waiting → cancelled`, `in_session → cancelled` (hanya dengan alasan, dan sesi ikut dibatalkan). Transisi lain ditolak server.

- Hanya satu sesi aktif per booth. Dijamin database lewat partial unique index, bukan hanya tombol yang dinonaktifkan.
- Tindakan operator: panggil, mulai sesi, lewati, kembalikan ke antrean, batalkan, buka riwayat.
- Setiap perubahan tersimpan di database dan muncul di dashboard serta tablet tanpa muat ulang.

### F3. Sesi foto di tablet
Status sesi: `created → choosing_design → capturing → reviewing → processing → completed`, dengan `failed` dan `aborted` sebagai cabang.

- Tablet menampilkan "Halo, Diana" dan nomor antrean saat operator memulai sesi.
- Pilihan desain berasal dari template aktif. Operator dapat mengunci satu desain bila event tidak mengizinkan pemilihan.
- Live View ditampilkan bila driver mendukung. Bila tidak, tampil panduan posisi dan hitung mundur saja.
- Foto diambil berurutan. Foto dianggap berhasil hanya setelah berkas diterima server, tidak kosong, dan dapat dibaca sebagai JPEG. Perintah jepret yang terkirim belum berarti sukses.
- Foto gagal dapat diulang tanpa memulai ulang sesi.
- Retake per foto: pengunjung memilih foto tertentu untuk diulang, foto lain tidak tersentuh. Hasil baru dipakai setelah disetujui.
- Kamera atau koneksi bermasalah tidak pernah menandai sesi selesai. Tablet menampilkan pesan jelas, dashboard memberi tanda butuh perhatian.
- Sesi selesai hanya setelah foto terpilih dikonfirmasi dan tersimpan.

### F4. Template fleksibel
- Admin mengunggah PNG transparan (latar dan atau lapisan atas), mengatur slot lewat editor visual dengan pratinjau.
- Konfigurasi per template: ukuran kanvas, daftar slot (`x`, `y`, `w`, `h` relatif 0 sampai 1), `source_index`, urutan, mode potong (`cover` atau `contain`), rotasi, lapisan (`under` atau `over`).
- Jumlah foto yang diambil dihitung dari `source_index` unik. Jumlah slot boleh berbeda (delapan slot, empat foto).
- Template punya nama, status aktif, ukuran cetak. Setiap perubahan menghasilkan `template_version` baru yang tidak dapat diubah.
- Penerimaan: tiga template (4 slot, 3 slot, 2 slot) bekerja tanpa mengubah kode. Template dengan 8 slot dan 4 foto sumber menghasilkan strip benar.

### F5. Pengolahan hasil
- Per sesi: foto individual (tanpa bingkai), photo strip (komposit), video slideshow (dari foto, bukan rekaman), thumbnail.
- Berjalan sebagai job terpisah: `pending → running → succeeded | failed`, dengan percobaan ulang otomatis terbatas dan tombol coba lagi.
- Nama berkas tidak memuat nomor telepon atau data pribadi. Format: `{sessionId}-{jenis}-{urutan}`.
- Video gagal tidak menghapus foto. Strip gagal tidak menghapus individual.
- Metadata EXIF, termasuk GPS, dibuang dari semua berkas publik.

### F6. Galeri digital
- Tautan galeri memakai token acak 256-bit. Tablet menampilkan QR Code setelah semua hasil penting selesai.
- Isi: nama panggilan, tanggal, seluruh sesi milik pengunjung, tiap sesi memuat foto individual, strip, video, dengan pratinjau dan unduh masing-masing, serta Unduh Semua (ZIP, di-stream).
- Sesi kedua dan ketiga masuk ke galeri yang sama, tidak menimpa sesi lama.
- Opsi PIN galeri per event.
- Berkas yang belum selesai diproses tidak tampil sebagai hasil final.
- Mode `local`: hanya terbuka selama pengunjung di jaringan atau tunnel acara. Mode `cloud`: hasil disinkronkan ke penyimpanan online.

### F7. Pesanan cetak dan pembayaran
- Semua hasil digital gratis. Cetak 4R berbayar, harga awal Rp15.000 per lembar, diubah lewat pengaturan admin.
- Dari riwayat pengunjung, operator memilih satu atau banyak hasil, mengatur jumlah dengan kontrol minus, angka, plus. Subtotal dan total dihitung ulang langsung.
- Contoh: desain pertama 2 lembar dan desain kedua 1 lembar, total Rp45.000.
- Status pembayaran: `unpaid`, `pending_confirmation`, `paid`, `void`. Status cetak: `not_printed`, `queued`, `printing`, `succeeded`, `failed`. Keduanya terpisah.
- Pekerjaan cetak tidak boleh dikirim sebelum `paid`. Pengecualian hanya oleh admin, wajib alasan, tercatat di audit.
- Berkas cetak dibuat sesuai 4R (102 x 152 mm, 300 dpi, 1200 x 1800 piksel), orientasi dan margin sesuai profil printer yang sudah diuji.
- Bila printer tidak melaporkan status yang bisa dipercaya, operator menandai tiap lembar berhasil atau gagal. Sistem tidak menganggap sukses hanya karena perintah terkirim.

### F8. Riwayat, cetak ulang, laporan
- Setiap transaksi menyimpan pengunjung, sesi, desain, jumlah, harga saat transaksi, total, waktu, status pembayaran, hasil cetak.
- Cetak ulang membuat permintaan baru bertipe `reprint_free` (kesalahan teknis, dengan alasan) atau `reprint_paid`. Cetak ulang gratis tidak dihitung sebagai penjualan.
- Laporan: lembar berhasil dicetak (dibedakan dari lembar dipesan atau dikirim), pesanan gagal, total transaksi, pendapatan, jumlah cetak ulang.

### F9. Admin, peran, audit
- Peran `admin` (semua) dan `operator` (antrean, sesi, pembayaran, cetak). Template, harga, pengguna, retensi, dan penghapusan hanya admin.
- Log audit untuk pembatalan, perubahan status, penghapusan data, pembayaran, pengecualian, cetak ulang, perubahan pengaturan, login gagal. Tidak dapat diubah atau dihapus lewat aplikasi.

## Persyaratan non-fungsional

- Keandalan: server tahan restart di tengah sesi. Status dipulihkan dari database, bukan memori.
- Pemulihan: tablet dan dashboard yang terputus otomatis tersambung ulang dan sinkron dari snapshot, bukan hanya event.
- Kinerja: halaman daftar dan galeri ringan (kurang dari 150 KB JS awal di halaman daftar), gambar galeri memakai thumbnail dan placeholder blur.
- Aksesibilitas: kontras WCAG AA, target sentuh minimal 48 dp di tablet, `prefers-reduced-motion` dihormati.
- Bahasa: antarmuka Bahasa Indonesia, kode dan nama teknis Bahasa Inggris.
- Keamanan: lihat `SECURITY.md`. Tidak ada fitur dianggap selesai jika kriteria keamanannya belum lulus.
- Animasi: lembut dan fungsional, spesifikasi di `StyleGuide.md`.

## Keputusan yang harus dikunci sebelum Fase 2

Lihat `README.md` bagian "Konfigurasi dulu, kode kemudian". Fase 2 dan seterusnya tidak boleh dimulai bila tujuh keputusan itu belum tercatat.

## Skenario uji wajib

1. 50 pengunjung mendaftar bersamaan
2. Pengunjung dilewati, dipanggil lagi, nomornya tetap
3. Dua operator menekan "mulai sesi" bersamaan, hanya satu berhasil
4. Foto diulang tanpa mengubah foto lain
5. Kamera dicabut di tengah sesi, sesi tidak ditandai selesai
6. Video gagal dibuat, foto tetap tersedia, coba lagi berhasil
7. Tablet kehilangan Wi-Fi lalu tersambung ulang, status sinkron
8. Pembayaran belum lunas, cetak ditolak server
9. Printer gagal, pembayaran tetap tercatat, cetak ulang berhasil
10. Pengunjung yang sama melakukan tiga sesi, galeri memuat ketiganya
11. Percobaan membuka galeri atau antrean milik orang lain lewat tebak URL, ditolak
12. Server dimatikan paksa saat pengolahan, job dilanjutkan setelah hidup lagi
