# Requirements Document — Mesin Video Otomatis

## Introduction

Dokumen ini mendefinisikan MVP **Mesin Video Otomatis**
(proyek `frankenstein-mesin-video`, kategori Frankenstein,
Kiroween 2026). Aplikasi web statis satu halaman: pengguna
memasukkan topik, memilih gaya dan durasi, mendapatkan
storyboard yang bisa diedit, memutar preview video dengan
narasi suara (TTS di browser), lalu mengunduh paket produksi.

Format dokumen ini mengikuti dokumentasi resmi Kiro
(kiro.dev/docs/specs/ dan kiro.dev/docs/specs/feature-specs/):
user story + acceptance criteria dalam notasi EARS
(Easy Approach to Requirements Syntax):
`WHEN [kondisi/peristiwa] THEN THE SYSTEM SHALL [perilaku]`,
`IF [prasyarat] THEN THE SYSTEM SHALL [perilaku]`,
`WHILE [keadaan] THE SYSTEM SHALL [perilaku]`.
Setiap kriteria dirujuk sebagai `<requirement>.<kriteria>`
(mis. `1.2`) dari `design.md` dan `tasks.md`.

Bahasa UI aplikasi: Bahasa Indonesia. Semua contoh topik
di dokumen ini adalah contoh netral berlabel "Contoh",
bukan klaim fakta.

## Glossary

- **Topik**: teks bebas yang diketik pengguna (mis. contoh:
  "Cara Menyeduh Teh").
- **Gaya**: template penyajian — Edukasi, Cerita, atau Promo.
- **Scene**: satu unit storyboard (judul, visual, narasi,
  durasi dalam detik).
- **Storyboard**: daftar scene berurutan untuk satu proyek.
- **Proyek**: topik + gaya + durasi + daftar scene.
- **Preview**: pemutaran scene di `<canvas>` disertai narasi
  TTS per scene.
- **Paket produksi**: naskah (`.md`), subtitle (`.srt`),
  dan file proyek (`.json`).

## Requirements

### Requirement 1

**User Story:** As a kreator konten, I want memasukkan topik dan memilih gaya serta durasi, so that aplikasi menghasilkan storyboard awal untuk video saya.

#### Acceptance Criteria

1. WHEN pengguna mengetik topik (1–120 karakter) dan memilih gaya (Edukasi / Cerita / Promo) dan durasi (30 / 60 / 90 detik) lalu menekan tombol "Buat Storyboard" THEN THE SYSTEM SHALL menghasilkan storyboard dan menampilkannya sebagai daftar scene.
2. WHEN pengguna menekan tombol "Buat Storyboard" dengan kolom topik kosong THEN THE SYSTEM SHALL menampilkan pesan "Tulis dulu topik videonya." dan tidak menghasilkan storyboard.
3. WHEN pengguna menekan tombol "Buat Storyboard" dengan topik lebih dari 120 karakter THEN THE SYSTEM SHALL menampilkan pesan bahwa topik maksimal 120 karakter dan tidak menghasilkan storyboard.
4. WHEN storyboard dihasilkan THEN THE SYSTEM SHALL membagi total durasi ke scene-scene sehingga jumlah durasi scene sama dengan durasi yang dipilih (30, 60, atau 90 detik).
5. WHEN gaya Edukasi dipilih THEN THE SYSTEM SHALL memakai struktur Pembuka — Penjelasan — Contoh — Penutup, minimal 3 scene.
6. WHEN gaya Cerita dipilih THEN THE SYSTEM SHALL memakai struktur Pembuka — Konflik — Perubahan — Penutup, minimal 3 scene.
7. WHEN gaya Promo dipilih THEN THE SYSTEM SHALL memakai struktur Hook — Manfaat — Ajakan, minimal 3 scene.
8. WHEN storyboard dihasilkan THEN THE SYSTEM SHALL menampilkan topik contoh sekali klik ("Coba contoh: Cara Menyeduh Teh") yang mengisi form dengan topik berlabel Contoh.

### Requirement 2

**User Story:** As a kreator konten, I want mengedit setiap scene (judul, narasi, durasi) serta menambah, menghapus, dan mengubah urutan scene, so that storyboard sesuai dengan yang saya mau sebelum diputar.

#### Acceptance Criteria

1. WHEN pengguna mengubah judul scene THEN THE SYSTEM SHALL menyimpan perubahan itu ke proyek dan menampilkannya di daftar scene.
2. WHEN pengguna mengubah narasi scene THEN THE SYSTEM SHALL menyimpan perubahan itu ke proyek dan memakai narasi baru saat preview dan ekspor.
3. WHEN pengguna mengubah durasi satu scene THEN THE SYSTEM SHALL menampilkan total durasi proyek yang diperbarui.
4. WHEN pengguna menambah scene THEN THE SYSTEM SHALL menambahkan satu scene kosong (judul "Scene baru", narasi kosong, durasi 5 detik) di akhir daftar.
5. WHEN pengguna menghapus scene dan masih tersisa minimal 1 scene THEN THE SYSTEM SHALL menghapus scene itu dari proyek dan daftar.
6. WHEN pengguna mencoba menghapus scene terakhir yang tersisa THEN THE SYSTEM SHALL menolak penghapusan dan menampilkan pesan "Minimal harus ada 1 scene."
7. WHEN pengguna memindahkan scene ke atas atau ke bawah THEN THE SYSTEM SHALL mengubah urutan scene di proyek, daftar, preview, dan ekspor secara konsisten.
8. WHEN pengguna mengedit scene THEN THE SYSTEM SHALL menyimpan proyek otomatis ke `localStorage` (kunci `mesin-video:proyek-terakhir`) tanpa perlu menekan tombol simpan.

### Requirement 3

**User Story:** As a kreator konten, I want memutar narasi setiap scene dengan suara, so that saya bisa mendengar naskah sebelum merender video.

#### Acceptance Criteria

1. WHEN pengguna menekan tombol putar narasi pada satu scene THEN THE SYSTEM SHALL membacakan narasi scene itu memakai Web Speech API (`speechSynthesis`).
2. WHEN narasi sedang dibacakan THEN THE SYSTEM SHALL menandai scene yang sedang dibacakan dan menyediakan tombol berhenti.
3. WHEN pengguna menekan tombol berhenti saat narasi dibacakan THEN THE SYSTEM SHALL menghentikan pembacaan (`speechSynthesis.cancel()`).
4. IF suara `id-ID` tersedia di perangkat THEN THE SYSTEM SHALL memilih suara `id-ID` sebagai suara narasi.
5. IF suara `id-ID` tidak tersedia di perangkat THEN THE SYSTEM SHALL memakai suara default browser dan menampilkan catatan "Suara Bahasa Indonesia tidak ditemukan di perangkat ini; memakai suara default."
6. IF Web Speech API tidak didukung browser THEN THE SYSTEM SHALL menampilkan pesan "Browser ini tidak mendukung pembacaan suara. Narasi tetap bisa dibaca sebagai teks." dan tombol putar narasi dinonaktifkan.

### Requirement 4

**User Story:** As a kreator konten, I want memutar preview video (gambar scene + narasi) di dalam aplikasi, so that saya bisa melihat hasil video sebelum mengunduhnya.

#### Acceptance Criteria

1. WHEN pengguna menekan tombol "Putar Preview" THEN THE SYSTEM SHALL menampilkan setiap scene di `<canvas>` 1280×720 sesuai durasinya, berurutan, disertai narasi TTS scene yang sedang tampil.
2. WHEN preview sedang berjalan THEN THE SYSTEM SHALL menampilkan indikator scene aktif (nomor scene dan judulnya) dan progres waktu.
3. WHEN pengguna menekan tombol jeda saat preview berjalan THEN THE SYSTEM SHALL menjeda gambar dan narasi; saat tombol putar ditekan lagi, preview berlanjut dari posisi yang sama.
4. WHEN preview mencapai scene terakhir dan durasinya habis THEN THE SYSTEM SHALL berhenti dan menampilkan status "Preview selesai."
5. WHEN pengguna menekan tombol berhenti saat preview berjalan THEN THE SYSTEM SHALL menghentikan gambar dan narasi serta mengembalikan preview ke scene pertama.
6. WHEN pengguna mengedit scene saat preview sedang berjalan THEN THE SYSTEM SHALL menghentikan preview terlebih dahulu, lalu menerapkan perubahan.

### Requirement 5

**User Story:** As a kreator konten, I want merekam preview menjadi file video yang bisa diunduh, so that saya punya hasil video yang bisa diputar di luar aplikasi.

#### Acceptance Criteria

1. WHEN pengguna menekan tombol "Rekam & Unduh Video" THEN THE SYSTEM SHALL merekam aliran canvas (`canvas.captureStream(30)`) memakai `MediaRecorder` dan mengunduh hasilnya sebagai file video WebM.
2. WHEN perekaman dimulai THEN THE SYSTEM SHALL menampilkan status "Merekam…" dan menonaktifkan tombol rekam sampai perekaman selesai.
3. WHEN perekaman selesai THEN THE SYSTEM SHALL menampilkan status "Video selesai direkam." dan mengaktifkan kembali tombol rekam.
4. IF `MediaRecorder` tidak didukung browser THEN THE SYSTEM SHALL menampilkan pesan "Browser ini tidak mendukung perekaman video. Coba Chrome atau Edge terbaru." dan tombol rekam dinonaktifkan.
5. WHEN pengguna merekam video THEN THE SYSTEM SHALL menyertakan gambar scene (teks judul + visual scene) dalam rekaman; suara TTS tidak wajib terekam (keterbatasan `captureStream` yang tidak menangkap audio `speechSynthesis`), dan hal ini dijelaskan di README dan di area status.

### Requirement 6

**User Story:** As a kreator konten, I want mengunduh paket produksi (naskah, subtitle, file proyek), so that saya bisa melanjutkan produksi di luar aplikasi dan membuka lagi proyek saya nanti.

#### Acceptance Criteria

1. WHEN pengguna menekan "Unduh Naskah" THEN THE SYSTEM SHALL mengunduh file `.md` berisi topik, gaya, durasi, dan untuk setiap scene: judul, durasi, dan narasi.
2. WHEN pengguna menekan "Unduh Subtitle" THEN THE SYSTEM SHALL mengunduh file `.srt` dengan penanda waktu tiap scene yang berurutan dan sesuai durasi scene.
3. WHEN pengguna menekan "Unduh Proyek" THEN THE SYSTEM SHALL mengunduh file `.json` berisi seluruh proyek (topik, gaya, durasi, daftar scene).
4. WHEN pengguna memilih file proyek `.json` yang valid lewat tombol "Buka Proyek" THEN THE SYSTEM SHALL memuat proyek itu ke editor dan menampilkan storyboard-nya.
5. WHEN pengguna memilih file `.json` yang bukan proyek aplikasi ini THEN THE SYSTEM SHALL menampilkan pesan "File ini bukan file proyek Mesin Video." dan tidak mengubah proyek yang sedang dibuka.
6. WHEN pengguna membuka aplikasi THEN THE SYSTEM SHALL memuat proyek terakhir dari `localStorage` bila ada, dan bila tidak ada menampilkan form kosong beserta topik contoh.

### Requirement 7

**User Story:** As a pengguna baru, I want aplikasi langsung bisa dipakai tanpa instalasi, akun, atau biaya, so that saya bisa mencoba dalam waktu kurang dari satu menit.

#### Acceptance Criteria

1. WHEN aplikasi dibuka dari GitHub Pages THEN THE SYSTEM SHALL menampilkan halaman utama lengkap (form topik, pilihan gaya, pilihan durasi) tanpa meminta login.
2. WHEN aplikasi dibuka THEN THE SYSTEM SHALL tidak melakukan panggilan jaringan apa pun untuk menghasilkan storyboard, memutar narasi, atau merender preview.
3. WHEN pengguna membuka aplikasi di subpath GitHub Pages (`<user>.github.io/<repo>/`) THEN THE SYSTEM SHALL memuat semua file lokal (CSS, JS, aset) dengan path relatif yang benar.
4. WHEN pengguna memakai keyboard saja THEN THE SYSTEM SHALL memungkinkan semua aksi utama (isi topik, buat storyboard, edit scene, putar preview, unduh) tanpa mouse.
5. WHEN JavaScript dimatikan THEN THE SYSTEM SHALL menampilkan pesan "Aplikasi ini membutuhkan JavaScript. Aktifkan JavaScript lalu muat ulang halaman."

### Requirement 8

**User Story:** As a pengguna, I want pesan error yang jelas dalam Bahasa Indonesia saat sebuah fitur tidak didukung perangkat saya, so that saya tahu apa yang terjadi dan apa alternatifnya.

#### Acceptance Criteria

1. WHEN sebuah fitur tidak didukung (TTS, MediaRecorder, atau suara `id-ID`) THEN THE SYSTEM SHALL menampilkan pesan Bahasa Indonesia di area status yang menjelaskan fitur yang tidak jalan dan alternatifnya.
2. WHEN sebuah fitur tidak didukung THEN THE SYSTEM SHALL menonaktifkan hanya tombol fitur itu; fitur lain tetap bisa dipakai.
3. WHEN terjadi error saat mengunduh file THEN THE SYSTEM SHALL menampilkan pesan "Gagal mengunduh file. Coba lagi." dan tidak mengubah proyek.
4. WHILE aplikasi berjalan THEN THE SYSTEM SHALL tidak menampilkan error di konsol browser pada alur utama (buat storyboard → edit → preview → unduh).

### Requirement 9

**User Story:** As a pemilik proyek, I want isi naskah yang dihasilkan tidak mengarang fakta, so that aplikasi tidak menyebarkan informasi yang salah atas nama saya.

#### Acceptance Criteria

1. WHEN storyboard dihasilkan THEN THE SYSTEM SHALL hanya memakai teks topik yang diketik pengguna dan kalimat template generik; template tidak boleh menyisipkan angka, tanggal, nama orang, atau kutipan.
2. WHEN topik contoh dipakai THEN THE SYSTEM SHALL memberi label yang terlihat bahwa itu "Contoh".
3. WHEN naskah diunduh THEN THE SYSTEM SHALL menyertakan catatan di akhir file: "Naskah ini dibuat dari template + topik yang Anda ketik. Periksa fakta sebelum dipublikasikan."

## Non-Functional Requirements

- **Kinerja**: halaman utama selesai dimuat dan bisa dipakai dalam
  waktu < 3 detik di koneksi biasa; pembuatan storyboard < 1 detik
  untuk topik apa pun (fungsi murni, tanpa jaringan).
- **Ukuran**: total aset lokal (HTML + CSS + JS) < 500 KB
  (tanpa dependensi runtime).
- **Kompatibilitas**: target utama Chrome/Edge terbaru;
  Firefox terbaru sebagai target kedua; Safari didukung
  sebagian dengan pesan yang jelas (Requirement 8).
- **Aksesibilitas**: semua tombol punya label teks; kontras
  teks minimal mengikuti panduan umum (teks isi terbaca di
  atas latar); fokus keyboard terlihat.
- **Privasi**: tidak ada analytics, tidak ada pelacakan,
  tidak ada data yang dikirim ke server mana pun.

## Out of Scope (MVP)

- Panggilan API LLM / TTS berbayar; ekspor ZIP; transisi
  video kompleks; unggah gambar/video pengguna; akun dan
  sinkronisasi cloud; mode gelap; multi-bahasa UI.
  Semua ini dicatat sebagai backlog di `design.md`,
  bukan bagian dari acceptance criteria di atas.

## Referensi (sumber yang diverifikasi 15 November 2026)

- Format spec & EARS: https://kiro.dev/docs/specs/
  dan https://kiro.dev/docs/specs/feature-specs/
  (tiga file: `requirements.md`, `design.md`, `tasks.md`;
  alur Requirements-First; EARS `WHEN ... THE SYSTEM SHALL ...`).
- Steering: https://kiro.dev/docs/steering/ (tiga file
  fondasi `product.md`, `tech.md`, `structure.md` di
  `.kiro/steering/`; front matter `inclusion`).
- Hooks: https://kiro.dev/docs/hooks/ (format JSON v1 di
  `.kiro/hooks/*.json`; trigger PascalCase; aksi
  `command` atau `agent`).
- Kiroween 2026: https://kiroween.devpost.com/rules
  (deadline 4 Desember 2026 14:00 PT; kategori Frankenstein:
  "Stitch together a chimera of technologies into one app").
