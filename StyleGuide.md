# Style Guide

Panduan ini adalah sumber kebenaran tampilan dan gerak. Jika output sebuah skill desain bertentangan dengan dokumen ini, dokumen ini menang. Skill dipakai untuk menajamkan, bukan mengganti arah.

## Arah desain

Subjek: photobooth acara, dipakai pengunjung awam di ponsel dan tablet, dan operator yang bekerja cepat di laptop.

Konsep: kamar gelap bertemu lembar kontak. Permukaan netral dan tenang, foto adalah satu-satunya hal yang berwarna penuh. Satu momen sinematik: hasil strip foto meluncur keluar dari slot, seperti photobooth sungguhan. Semua yang lain tenang dan fungsional.

Prinsip:
1. Foto adalah bintangnya. Antarmuka mundur ke belakang.
2. Boldness dihabiskan di satu tempat: angka antrean besar dan momen strip keluar dari slot. Sisanya diam.
3. Gerak menjawab tindakan. Gerak yang muncul sendiri hanya untuk menarik perhatian pada hal penting.
4. Bahasa sederhana, aktif, spesifik. Tidak ada emoji.
5. Setiap permukaan punya satu pekerjaan utama dan satu tombol utama.

Hindari ciri umum tampilan buatan AI:
- Latar krem hangat dengan serif dan aksen terakota
- Latar hitam dengan satu aksen hijau neon
- Gradien ungu atau biru sebagai dekorasi
- Semua konten dipotong jadi kartu identik dengan radius dan bayangan sama
- Label huruf kapital berjarak di atas setiap judul, string meta bertitik tengah, panah `→` di setiap tombol
- Penomoran 01, 02, 03 pada konten yang bukan urutan
- Satu kata di judul diberi warna atau miring
- Ikon emoji sebagai pengganti ikon

## Warna

Token inti (nama bermakna, bukan nama komponen):

| Token | Nilai | Pemakaian |
|---|---|---|
| `ink` | `#12151A` | Teks utama, latar tablet saat sesi foto |
| `ink-soft` | `#3A404A` | Teks sekunder |
| `film` | `#8B929E` | Teks tersier, garis halus, ikon nonaktif |
| `sheet` | `#E4E6EA` | Garis pemisah, kontrol nonaktif |
| `paper` | `#F6F6F4` | Latar utama web (netral, bukan krem) |
| `paper-raised` | `#FFFFFF` | Permukaan terangkat |
| `ultramarine` | `#2438D9` | Aksi utama, fokus, tautan |
| `ultramarine-press` | `#1B2CB0` | Keadaan ditekan |
| `ultramarine-wash` | `#E8EBFC` | Latar sorotan lembut |
| `flash` | `#FFD84D` | Hanya untuk momen jepret dan penanda "giliran sekarang". Teks di atasnya selalu `ink` |
| `signal-ok` | `#1F7A4F` | Berhasil, lunas |
| `signal-warn` | `#A86400` | Menunggu, butuh perhatian |
| `signal-bad` | `#B42318` | Gagal, bahaya |

Aturan:
- Warna penuh tersisa untuk foto. Antarmuka memakai netral, `ultramarine` hanya untuk aksi utama dan fokus.
- `flash` tidak dipakai sebagai warna tombol atau dekorasi umum.
- Mode gelap: tablet saat sesi foto memakai `ink` sebagai latar. Web mengikuti `prefers-color-scheme` dengan token gelap padanannya (`paper` menjadi `#0E1116`, `paper-raised` menjadi `#171B22`, teks `#F2F3F5`).
- Kontras teks normal minimal 4,5:1, teks besar dan komponen UI minimal 3:1. Nilai di atas harus diverifikasi dengan alat kontras sebelum dikunci. Status tidak boleh hanya dibedakan lewat warna: selalu sertakan ikon atau teks.

## Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Display | Bricolage Grotesque | Angka antrean, judul besar, sapaan di tablet |
| Teks | Figtree | UI, formulir, tabel, badan teks |

Aturan:
- Font dihosting sendiri (`next/font/local` di web, aset di Flutter). Tidak boleh memuat dari CDN karena acara bisa tanpa internet.
- Angka antrean, harga, dan tabel memakai `font-variant-numeric: tabular-nums`.
- Skala (px di web, dp di tablet): 12, 14, 16, 18, 22, 28, 36, 48, 72. Angka hitung mundur di tablet 200 dp.
- Panjang baris kurang dari 70 karakter. Tinggi baris 1,5 untuk teks, 1,1 sampai 1,2 untuk display.
- Bobot: 400 teks, 500 label dan tombol, 600 sampai 700 hanya display.
- Huruf kapital semua tidak dipakai untuk label. Kalimat dengan huruf kapital di awal saja.
- Judul tidak memakai trik satu kata berwarna.

## Bentuk, jarak, bayangan

- Basis jarak 4 px. Skala: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius bertingkat sesuai hierarki, bukan satu nilai untuk semua: 6 (chip dan badge), 12 (tombol dan input), 20 (panel), 32 (lembar besar dan modal tablet), penuh (pil status).
- Bayangan berlapis dan lembut, berbeda per tinggi:
  - `raise-1`: `0 1px 2px rgb(18 21 26 / 0.06), 0 1px 1px rgb(18 21 26 / 0.04)`
  - `raise-2`: `0 4px 12px rgb(18 21 26 / 0.08), 0 1px 3px rgb(18 21 26 / 0.05)`
  - `raise-3`: `0 16px 40px rgb(18 21 26 / 0.14), 0 4px 12px rgb(18 21 26 / 0.06)`
- Tidak semua hal perlu kartu. Gunakan jarak dan garis tipis `sheet` untuk mengelompokkan sebelum memakai wadah.
- Foto selalu berpinggiran tajam atau radius kecil (6). Strip foto tidak diberi radius.

## Sistem gerak

Tujuan: terasa lembut dan responsif, tidak pernah menghambat. Gerak yang bagus tidak disadari, gerak yang buruk membuat sistem terasa lambat.

### Token

```css
:root {
  /* Easing */
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);    /* masuk, respons terhadap tindakan */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* gerak di layar */
  --ease-sheet:  cubic-bezier(0.32, 0.72, 0, 1);    /* panel dan sheet */

  /* Durasi */
  --dur-instant: 90ms;    /* tekan tombol */
  --dur-fast:    160ms;   /* tooltip, hover, toggle */
  --dur-base:    220ms;   /* dropdown, perubahan status */
  --dur-slow:    320ms;   /* modal, sheet, pindah layar */
  --dur-scene:   520ms;   /* hanya momen sinematik */
}
```

Spring untuk Motion (web): `{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }` untuk elemen yang bergerak, `{ stiffness: 420, damping: 36 }` untuk kontrol kecil. Spring tidak dipakai untuk fade.

Flutter: `Curves` kustom dari nilai easing di atas lewat `Cubic(0.23, 1, 0.32, 1)`, durasi sama.

### Aturan

1. Hanya animasikan `transform` dan `opacity`. Jangan animasikan `width`, `height`, `top`, `left`, `margin`, atau `box-shadow` pada daftar panjang.
2. Masuk memakai `--ease-out`. Elemen tidak pernah muncul dari `scale(0)`, mulai dari `scale(0.96)` dengan `opacity: 0`.
3. Elemen yang keluar lebih cepat daripada yang masuk (sekitar 70 persen durasi masuk). Sistem harus terasa sigap.
4. Tombol: `:active { transform: scale(0.97) }` dengan `--dur-instant`. Hover hanya di bawah `@media (hover: hover) and (pointer: fine)`.
5. Popover, dropdown, dan tooltip tumbuh dari titik pemicunya (`transform-origin` sesuai posisi pemicu). Modal tetap berpusat.
6. Stagger daftar: 30 sampai 50 ms per item, maksimal 10 item. Sisanya muncul bersamaan.
7. Tindakan yang sangat sering (membuka dropdown berulang, tombol operator di antrean, pintasan keyboard) tidak dianimasikan atau hanya 100 ms. Operator bekerja cepat, animasi tidak boleh menjadi hambatan.
8. Tidak ada animasi yang menghalangi input. Pengguna bisa menekan tombol selama transisi.
9. Perubahan status di dashboard (misalnya Dalam Antrean menjadi Sedang Foto): warna latar badge cross-fade 220 ms, baris yang berpindah memakai transisi tata letak halus. Tidak ada kedipan mencolok.
10. Konten yang dimuat memakai skeleton atau placeholder blur, bukan spinner penuh layar. Gambar masuk dengan fade 220 ms setelah dimuat.
11. Gerakan tidak boleh melompat saat data real-time datang. Elemen yang bergeser memakai animasi tata letak, bukan lompatan.
12. `prefers-reduced-motion: reduce` dan `MediaQuery.disableAnimations`: ganti gerak transformasi dengan fade 100 ms atau perubahan instan. Hitung mundur tetap menampilkan angka, tanpa skala.
13. Uji di tablet sebenarnya (kemungkinan kelas menengah ke bawah) pada 60 fps. Di tablet tidak ada `backdrop-filter` atau blur real-time.

### Momen sinematik (satu-satunya animasi besar)

Urutan dari hitung mundur sampai strip keluar. Ini bagian yang boleh terasa "mahal".

| Tahap | Gerak | Durasi |
|---|---|---|
| Hitung mundur | Angka besar bergantian. Angka lama menghilang dengan opacity dan naik 8 px, angka baru masuk dari bawah 8 px. Satu angka per detik | 1000 ms per angka, transisi 220 ms |
| Jepret | Lapisan `flash` naik ke opasitas 0,85 lalu turun. Foto hasil muncul mengecil dari 1,04 ke 1 | naik 80 ms, turun 360 ms, ease-out |
| Tinjau | Thumbnail empat foto masuk berurutan dari bawah | stagger 50 ms |
| Memproses | Strip kosong dengan garis kemajuan tipis, teks status jelas. Tidak ada animasi berputar tak berujung | |
| Hasil siap | Strip meluncur keluar dari slot di tepi bawah layar ke tengah, berhenti lembut | 520 ms, `--ease-sheet`, sekali saja |
| QR Code | Muncul dengan fade dan skala 0,96 ke 1 setelah strip diam | 220 ms, tertunda 200 ms |

Momen ini hanya berjalan sekali per sesi. Tidak diulang saat pengunjung menekan tombol lain.

### Pola gerak per permukaan

Tablet (kios):
- Pindah layar: fade 220 ms dengan geser 12 px, arah sesuai alur (maju dari kanan ke kiri, mundur sebaliknya).
- Tombol utama besar, tekan memberi skala 0,97 dan sorotan lembut.
- Pesan error muncul dengan fade dan tidak menggoyang layar. Tidak ada getar atau shake.

Admin (laptop):
- Dasar tenang. Daftar antrean memakai transisi tata letak saat baris berpindah.
- Panel samping dan sheet pakai `--ease-sheet` 320 ms. Toast masuk dari bawah 220 ms, hilang 160 ms.
- Tombol aksi antrean tanpa animasi masuk. Umpan balik hanya skala 0,97 dan perubahan status.

Halaman daftar (ponsel):
- Satu urutan masuk saat halaman dibuka: judul, formulir, tombol (stagger 40 ms). Setelah berhasil, nomor antrean menggantikan formulir dengan cross-fade 320 ms.
- Nomor antrean memakai Bricolage Grotesque ukuran besar, tanpa animasi berulang.

Galeri (ponsel):
- Item grid masuk dengan fade dan geser 8 px, stagger 40 ms untuk 12 item pertama, sisanya muncul saat gulir tanpa stagger.
- Gambar memakai placeholder blur dan fade saat siap. Video tidak diputar otomatis dengan suara.
- Tombol unduh memberi umpan balik skala dan perubahan label menjadi "Mengunduh", lalu "Tersimpan".

## Komponen

- Tombol utama: latar `ultramarine`, teks putih, tinggi 48 (web) dan 64 dp (tablet). Satu tombol utama per layar.
- Tombol sekunder: kontur `sheet`, teks `ink`. Tombol bahaya memakai `signal-bad` dan selalu meminta konfirmasi dengan menyebut akibatnya.
- Input: tinggi 48, label di atas (bukan hanya placeholder), kesalahan di bawah dengan teks dan ikon, tidak hanya warna merah.
- Badge status: pil dengan titik warna, ikon, dan teks. Contoh: Dalam Antrean (netral), Menunggu (`signal-warn`), Sedang Foto (`ultramarine`), Selesai Foto (`signal-ok`), Dibatalkan (netral coret halus).
- Tabel antrean: baris tinggi 56, angka antrean di kolom pertama dengan Bricolage dan `tabular-nums`, aksi di kanan.
- Kontrol jumlah cetak: minus, angka, plus, area sentuh 44 px, subtotal berubah dengan transisi angka halus 160 ms.
- Ikon: Lucide, tebal garis 1,75, ukuran 16, 20, atau 24. Tidak ada emoji di antarmuka, kode, atau pesan.
- Fokus: cincin 2 px `ultramarine` dengan jarak 2 px, selalu terlihat saat navigasi keyboard.

## Tablet (kios)

- Landscape terkunci. Target sentuh minimal 48 dp, tombol utama 64 dp.
- Layar sesi foto: Live View mengisi sebagian besar layar, sudut bingkai tipis sebagai panduan. Latar `ink`.
- Sapaan memakai Bricolage: "Halo, Diana", nomor antrean `#020` besar di bawahnya.
- Teks pendek, satu instruksi per layar. Bahasa: "Siap? Tekan Mulai." bukan paragraf.
- Layar tidak boleh mati, status koneksi kecil dan jelas di sudut, bukan banner besar.
- Retake: tombol "Ulangi" di setiap thumbnail, bukan menu tersembunyi. Konfirmasi di bawah, satu tombol utama "Pakai foto ini".

## Admin

- Tata letak: sidebar sempit, area utama dengan antrean sebagai fokus. Ringkasan jumlah di bagian atas berupa angka sederhana, bukan kartu KPI identik.
- Antrean aktif selalu terlihat. Satu aksi utama kontekstual per baris, aksi lain di menu.
- Pembayaran dan cetak: dua badge terpisah di setiap pesanan.
- Editor template: kanvas dengan slot yang dapat ditarik, panel properti, pratinjau langsung. Perubahan geser diterapkan tanpa jeda, tanpa animasi.
- Pesan error menyebut apa yang terjadi dan apa yang bisa dilakukan, misalnya "Kamera tidak merespons. Periksa kabel USB dan pastikan EOS Utility tertutup, lalu tekan Coba lagi."

## Galeri pengunjung

- Header: nama panggilan dengan Bricolage, tanggal dan sesi dengan Figtree. Tanpa banner dekoratif.
- Strip hasil tampil sebagai elemen utama, foto individual dan video di bawahnya.
- Unduh Semua adalah tombol utama. Unduh satuan di setiap berkas.
- Catatan privasi singkat: "Siapa pun yang memiliki tautan ini bisa membuka galeri."

## Salinan teks (copywriting)

- Bahasa Indonesia, sopan dan akrab: "kamu", kalimat pendek, kata kerja aktif.
- Tombol menyebut hasilnya: "Daftar antrean", "Mulai sesi", "Pakai foto ini", "Unduh semua". Bukan "Kirim" atau "OK".
- Nama tindakan konsisten di seluruh alur. Tombol "Simpan perubahan" menghasilkan toast "Perubahan tersimpan".
- Error tidak meminta maaf dan tidak samar. Sebutkan penyebab dan langkah perbaikan.
- Layar kosong adalah ajakan bertindak: "Belum ada antrean. Tampilkan QR Code pendaftaran."
- Tidak ada emoji, tanda seru berlebihan, atau lelucon dalam pesan error.

## Aksesibilitas

- Kontras WCAG AA, fokus terlihat, urutan tab logis.
- Pembaruan antrean real-time diumumkan lewat `aria-live="polite"`.
- Semua ikon fungsional punya label teks. Formulir punya label dan pesan kesalahan terkait.
- Target sentuh: 44 px di ponsel, 48 dp di tablet.
- Gerak dikurangi sesuai preferensi sistem (lihat aturan 12).
- Zoom hingga 200 persen tanpa kehilangan fungsi.

## Daftar periksa tinjauan desain

Sebelum menyatakan UI selesai:
- [ ] Hanya memakai token di dokumen ini, tidak ada warna atau ukuran liar
- [ ] Satu tombol utama per layar, hierarki jelas saat mata dipicingkan
- [ ] Animasi hanya `transform` dan `opacity`, durasi sesuai token, ada versi reduced motion
- [ ] Diuji di ponsel kecil, tablet sebenarnya, dan layar laptop
- [ ] Keadaan kosong, memuat, error, dan terputus sudah dirancang, bukan hanya keadaan ideal
- [ ] Tidak ada ciri umum tampilan buatan AI dari daftar di atas
- [ ] Salinan teks sesuai aturan, tanpa emoji
- [ ] Diuji dengan keyboard dan pembaca layar untuk alur utama
