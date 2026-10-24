# SKILLS

Dokumen ini punya dua fungsi: menentukan skill apa dipakai kapan, dan menyimpan daftar tugas yang sering diminta beserta aturan mainnya, sehingga instruksi yang sama tidak perlu diketik ulang.

## Prinsip

1. Skill adalah alat, bukan pengambil keputusan. Dokumen proyek tetap menang: `SECURITY.md`, `PRD.md`, `TECHSTACK.md`, `StyleGuide.md`.
2. Pakai skill proses (superpowers) untuk cara kerja, skill desain untuk kualitas tampilan dan gerak. Keduanya dipakai bersamaan, bukan salah satu.
3. Skill desain cenderung punya selera sendiri. Hasilnya harus diterjemahkan ke token di `StyleGuide.md`, bukan menggantikannya.
4. Jangan memanggil semua skill di setiap tugas. Pilih sesuai tabel di bawah.

## Skill yang dipakai

### Proses kerja: superpowers

Kumpulan skill untuk disiplin rekayasa. Skill yang dipakai di proyek ini:

| Skill | Dipakai saat | Aturan di proyek ini |
|---|---|---|
| `brainstorming` | Sebelum fitur baru, komponen baru, atau perubahan perilaku | Satu pertanyaan sekali tanya. Hasilnya dicocokkan ke `PRD.md`, bukan dibuat dari nol |
| `writing-plans` | Tugas bertahap lebih dari satu berkas | Setiap langkah punya cara verifikasi |
| `executing-plans` dan `subagent-driven-development` | Menjalankan rencana | Satu fase satu cabang. Subagen tidak boleh menyentuh `.env`, `secrets/`, atau migrasi lama |
| `test-driven-development` | Setiap fitur dan perbaikan bug | Tes gagal dulu. Untuk keamanan, tes harus gagal bila kontrol dilepas |
| `systematic-debugging` | Tes gagal, kamera atau printer berperilaku aneh | Cari akar masalah dulu, jangan menebak. Uji kamera dengan alat driver di luar aplikasi untuk memisahkan penyebab |
| `verification-before-completion` | Sebelum menyatakan selesai | Wajib menjalankan lint, typecheck, test, security:scan dan melaporkan hasil nyata |
| `requesting-code-review` dan `receiving-code-review` | Akhir tugas besar | Tinjauan wajib memeriksa checklist A12 `SECURITY.md` |
| `using-git-worktrees` | Pekerjaan paralel yang perlu isolasi | Satu worktree per fase atau fitur |
| `dispatching-parallel-agents` | Tugas independen tanpa state bersama | Misalnya tes UI dan tes server tidak saling bergantung |
| `finishing-a-development-branch` | Fase selesai | Hanya setelah kriteria "Selesai bila" di `Task.md` terbukti |

### Kualitas desain dan gerak

Tujuh skill desain, masing-masing dengan perannya. Sebelum dipakai, baca README skill tersebut untuk perintah dan cakupan persisnya, karena nama perintah dapat berubah antarversi.

| Skill | Peran di proyek | Dipakai pada |
|---|---|---|
| `ui-ux-pro-max-skill` | Pencarian pola desain: gaya, palet, pasangan font, tata letak per jenis produk, aturan UX | Tahap awal layar baru, untuk membandingkan opsi. Hasil dipilih lalu dicocokkan ke `StyleGuide.md` |
| `taste-skill` | Penyetel selera agar hasil tidak generik: variasi tata letak, kepadatan, gerak | Saat hasil terasa seperti template. Diberi `StyleGuide.md` sebagai batas |
| `ux-ui-agent-skills` | Heuristik UX dan alur: hierarki, keadaan kosong atau error, aksesibilitas | Merancang alur (daftar, sesi tablet, pembayaran) dan tinjauan UX |
| `ui-craft` | Detail eksekusi: jarak, penyelarasan, tipografi, keadaan antarmuka | Tahap penyelesaian komponen |
| `emil-skills` | Prinsip design engineering dan animasi halus: easing, durasi, interaksi mikro, rasa responsif | Semua gerak: transisi, tombol, daftar, momen strip. Selaras dengan bagian "Sistem gerak" di `StyleGuide.md` |
| `impeccable` | Perintah tinjau dan poles: audit, kritik, polish, normalisasi, animasi, pengerasan | Penutup setiap layar: audit lalu poles, kemudian normalisasi ke token |
| `frontend-design` (bawaan) | Arah desain khas, hindari ciri generik | Sudah tercermin di `StyleGuide.md`. Dipakai saat merancang layar baru |

Cara pasang: ikuti README resmi tiap repositori skill, dan catat versi atau commit yang dipasang di tabel di bawah. Jangan menjalankan skrip pemasangan yang tidak dipahami. Skill adalah instruksi yang akan dipercaya AI, jadi periksa isinya seperti memeriksa dependensi (lihat `SECURITY.md` A11 dan B4).

| Skill | Sumber (repo) | Versi atau commit | Tanggal pasang | Diperiksa oleh |
|---|---|---|---|---|
| superpowers | | | | |
| ui-ux-pro-max-skill | | | | |
| taste-skill | | | | |
| ux-ui-agent-skills | | | | |
| ui-craft | | | | |
| emil-skills | | | | |
| impeccable | | | | |

## Alur desain untuk setiap layar atau komponen

Urutan wajib. Lewati langkah hanya bila perubahan sangat kecil (misalnya mengganti teks).

1. **Brief**: `brainstorming`. Tentukan satu pekerjaan utama layar, siapa penggunanya (pengunjung, operator, admin), perangkatnya, dan keadaan yang harus ada (kosong, memuat, error, terputus).
2. **Alur dan hierarki**: `ux-ui-agent-skills`. Tentukan urutan tindakan dan satu tombol utama.
3. **Eksplorasi**: `ui-ux-pro-max-skill` untuk opsi tata letak. Pilih satu. Terjemahkan ke token `StyleGuide.md`. Jika memerlukan token baru, usulkan penambahannya ke pengguna, jangan membuat nilai liar.
4. **Bangun**: ikuti `StyleGuide.md`. Tes dulu untuk perilaku (TDD), lalu komponen.
5. **Selera**: `taste-skill` bila hasil terlihat generik. Batasi dengan `StyleGuide.md`, terutama daftar ciri umum tampilan buatan AI.
6. **Gerak**: `emil-skills`. Periksa: hanya `transform` dan `opacity`, durasi dan easing dari token, tindakan sering tidak dianimasikan, ada reduced motion.
7. **Detail**: `ui-craft`. Jarak, penyelarasan, tipografi, keadaan fokus dan tekan.
8. **Tinjau dan poles**: `impeccable` (audit, kritik, polish, normalisasi). Terapkan temuan yang selaras dengan `StyleGuide.md`. Temuan yang bertentangan dicatat dan ditanyakan, tidak diterapkan diam-diam.
9. **Verifikasi**: `verification-before-completion`. Buka di ponsel kecil, tablet sebenarnya, dan laptop. Uji keyboard dan reduced motion. Laporkan.

## Konflik antar skill

| Situasi | Putusan |
|---|---|
| Skill menyarankan gradien, warna baru, atau font lain | Tolak. Gunakan token `StyleGuide.md` |
| Skill menyarankan animasi masuk untuk setiap bagian | Tolak. Hanya satu momen sinematik, sisanya fungsional |
| Skill menyarankan animasi pada tindakan operator yang sering | Tolak. Operator harus cepat |
| Skill menyarankan melonggarkan CSP, CORS, atau validasi demi kemudahan | Tolak mutlak. `SECURITY.md` B3 |
| Skill menyarankan paket atau pustaka baru | Hentikan dan minta persetujuan (`TECHSTACK.md`) |
| Dua skill desain bertentangan | Pilih yang selaras dengan `StyleGuide.md`, catat alasannya |

---

# Daftar tugas berulang

Setiap tugas punya aturan main dan definisi selesai. Cukup menulis "lakukan tugas: nama tugas" tanpa mengulang instruksinya.

## T1. Tambah endpoint API

Skill: `brainstorming` (bila ambigu), `test-driven-development`, `verification-before-completion`.

Aturan:
1. Tentukan kelompok rute: `/public`, `/tablet`, atau `/admin`.
2. Tulis skema zod di `packages/shared` untuk request dan response (`strict`).
3. Tulis tes dulu: kasus sah, input tidak sah, tidak terautentikasi, peran salah, dan IDOR (sumber daya milik orang lain).
4. Implementasi di `domain`, handler tipis.
5. Tambah rate limit sesuai kelompok. Tindakan penting menulis audit.
6. Perubahan status hanya lewat mesin status.

Selesai bila: tes lulus, checklist A12 `SECURITY.md` terpenuhi, `pnpm lint`, `pnpm typecheck`, `pnpm security:scan` bersih.

## T2. Ubah skema database

Skill: `writing-plans`, `test-driven-development`.

Aturan:
1. Buat migrasi baru lewat drizzle-kit. Jangan edit migrasi yang sudah digabung.
2. Pikirkan data yang sudah ada: migrasi harus aman dijalankan pada database berisi data.
3. Tambahkan constraint di database (unique, check, foreign key, partial index), bukan hanya validasi di kode.
4. Peran `booth_app` hanya diberi hak yang dibutuhkan. Tabel audit tidak boleh diberi `UPDATE` dan `DELETE`.
5. Perbarui bagian "Entitas dan hubungan" di `PRD.md` bila relasi berubah.
6. Uji migrasi maju pada salinan database dan pastikan tes integrasi lulus.

Selesai bila: migrasi berjalan bersih dari nol dan dari kondisi sebelumnya, tes integrasi lulus.

## T3. Tambah atau ubah status (mesin status)

Aturan:
1. Perbarui tabel status dan transisi di `PRD.md` terlebih dahulu.
2. Tambahkan ke `packages/shared` sebagai konstanta tunggal.
3. Tulis tes untuk setiap transisi sah dan setidaknya satu transisi tidak sah per status.
4. Tampilkan di UI sebagai badge sesuai `StyleGuide.md` (ikon, teks, bukan hanya warna).
5. Pastikan WebSocket menyiarkan perubahan dan snapshot menyertakannya.

## T4. Layar atau komponen UI baru (web)

Skill: alur desain di atas, `test-driven-development`.

Aturan:
1. Jalankan alur desain langkah 1 sampai 9.
2. Rancang keadaan kosong, memuat, error, dan terputus.
3. Teks mengikuti aturan salinan di `StyleGuide.md`. Tanpa emoji.
4. Aksesibilitas: label, fokus, `aria-live` untuk pembaruan real-time.
5. Tes komponen atau Playwright untuk alur utama, termasuk dengan `prefers-reduced-motion`.

Selesai bila: checklist tinjauan desain di `StyleGuide.md` terpenuhi dan tangkapan layar ponsel dan desktop diperiksa.

## T5. Layar tablet baru (Flutter)

Aturan:
1. Landscape, target sentuh minimal 48 dp, satu instruksi per layar.
2. Gerak dari token yang sama dengan web. Hormati `MediaQuery.disableAnimations`.
3. Tanpa blur real-time. Uji 60 fps di tablet sebenarnya.
4. Tidak ada rahasia di aplikasi. Hanya token perangkat di `flutter_secure_storage`.
5. Tangani terputus dan tersambung ulang tanpa kehilangan sesi.
6. `flutter analyze` dan `flutter test` bersih.

## T6. Animasi atau gerak baru

Skill: `emil-skills`, `impeccable` (animasi dan poles).

Aturan:
1. Tanyakan dulu: apakah gerak ini menjawab tindakan atau menjelaskan perubahan? Jika tidak, jangan ditambahkan.
2. Hanya `transform` dan `opacity`. Durasi dan easing dari token. Tidak dari `scale(0)`.
3. Tindakan yang sangat sering tidak dianimasikan.
4. Sediakan versi reduced motion.
5. Ukur di perangkat sebenarnya. Bila turun di bawah 60 fps, sederhanakan.
6. Pembaruan real-time tidak boleh membuat elemen melompat.

## T7. Template baru atau perubahan engine template

Aturan:
1. Template adalah data, bukan kode. Jangan menanam tata letak tertentu di program.
2. Koordinat relatif 0 sampai 1. Jumlah foto sumber dari `source_index` unik.
3. Perubahan membuat `template_version` baru. Sesi lama tidak berubah.
4. Tambahkan tes render dengan keluaran referensi untuk kasus: 4 slot, 3 slot, 2 slot, 8 slot dengan 4 foto.
5. Validasi unggahan sesuai `SECURITY.md` A5.

## T8. Kamera atau printer bermasalah

Skill: `systematic-debugging`.

Aturan:
1. Pisahkan penyebab: uji kamera atau printer dengan alat driver di luar aplikasi. Bila gagal di luar aplikasi, ini masalah perangkat atau konfigurasi, bukan kode.
2. Periksa daftar di `README.md` bagian pemecahan masalah dan `pnpm doctor`.
3. Jangan mengubah konfigurasi kamera, printer, driver, atau jaringan tanpa konfirmasi pengguna.
4. Tangkap kegagalan sebagai kasus uji di driver `mock` agar penanganannya teruji.
5. Catat temuan di `docs/adr/` bila memengaruhi keputusan.

## T9. Tinjauan keamanan

Skill: `requesting-code-review`.

Aturan:
1. Telusuri setiap rute baru atau berubah: kelompok, autentikasi, otorisasi, rate limit, validasi.
2. Cari IDOR: bisakah ID atau token milik orang lain dipakai?
3. Cari kebocoran: log, pesan error, URL, nama berkas, galeri.
4. Periksa dependensi baru: perlu, terpelihara, ukuran, skrip pasang.
5. Jalankan `pnpm security:scan` dan `pnpm audit`.
6. Laporkan temuan berurut tingkat risiko dengan langkah perbaikan.

## T10. Tambah dependensi

Aturan:
1. Hentikan dan minta persetujuan pengguna terlebih dahulu.
2. Jelaskan kebutuhan, alternatif tanpa dependensi, pemelihara, aktivitas, ukuran, lisensi.
3. Pasang versi tepat, perbarui lockfile, tinjau skrip pasangnya.
4. Catat di `TECHSTACK.md` bila menjadi bagian stack.

## T11. Persiapan acara

Aturan:
1. Jalankan checklist di `README.md` bagian "Checklist hari acara".
2. `pnpm doctor` harus lulus di laptop yang akan dibawa.
3. Uji pemulihan dari cadangan terbaru.
4. Sesi uji end to end penuh: daftar, foto, galeri, bayar, cetak.
5. Pastikan versi dan lockfile sama dengan yang dibekukan di Fase 10.

## T12. Tambah konfigurasi baru

Aturan:
1. Tentukan: rahasia, konfigurasi lingkungan, atau pengaturan runtime yang boleh diubah saat acara.
2. Rahasia dan konfigurasi lingkungan masuk `.env.example` (kosong atau placeholder), skema zod, dan `pnpm doctor`. Pengaturan runtime masuk tabel `settings`.
3. Dokumentasikan di `TECHSTACK.md` dan beri tahu pengguna langkah mengaturnya sebelum kode yang membutuhkannya dikerjakan.
4. Jangan pernah mengisi nilai rahasia sendiri.

## T13. Perbaiki bug

Skill: `systematic-debugging`, `test-driven-development`.

Aturan:
1. Reproduksi dulu dengan tes yang gagal.
2. Temukan akar masalah, jangan menutup gejala.
3. Perbaiki seminimal mungkin. Tes lulus, tes lain tetap lulus.
4. Bila bug menyangkut status, uang, atau data pengunjung, tambah tes regresi dan catatan audit bila relevan.
