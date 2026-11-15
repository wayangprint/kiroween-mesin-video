---
inclusion: always
---

# Product Overview — Mesin Video Otomatis

## Apa ini

Mesin Video Otomatis adalah aplikasi web statis (tanpa backend, tanpa akun,
tanpa server) yang mengubah **satu topik** menjadi **paket produksi video
pendek**: storyboard (daftar scene), narasi per scene, preview video yang
bisa diputar, dan paket unduhan (naskah + subtitle + file proyek).

Nama proyek hackathon: **frankenstein-mesin-video**.
Hackathon: **Kiroween 2026** (Kiro/AWS, Devpost).
Kategori: **Frankenstein** — menjahit teknologi yang tidak biasa digabung
menjadi satu aplikasi.
Deadline submit: **Jumat, 4 Desember 2026, 14:00 PT**
(22:00 UTC; = Sabtu, 5 Desember 2026, 05:00 WIB).
Sumber tanggal: halaman resmi Kiroween 2026 di Devpost
(kiroween.devpost.com/rules) — dicek 15 November 2026.

## Stitch Frankenstein yang dijual

Empat teknologi yang masing-masing biasa berdiri sendiri, dijahit dalam
satu aplikasi browser tanpa backend:

1. **Generator teks berbasis aturan (rule-based template engine)** —
   mengubah topik + gaya + durasi menjadi storyboard dan naskah.
   Bukan panggilan LLM dan bukan API berbayar: semua berjalan lokal di
   browser, deterministik, dan bisa diedit pengguna.
2. **Web Speech API (`window.speechSynthesis`)** — narasi per scene
   dibacakan langsung oleh suara sistem di browser pengguna
   (suara `id-ID` bila tersedia di perangkat; bila tidak, suara
   bawaan browser sebagai fallback).
3. **Canvas 2D + `MediaRecorder`** — preview video dirender dari
   `<canvas>` 1280×720 lewat `canvas.captureStream()` dan direkam
   menjadi file video WebM, tanpa server render dan tanpa ffmpeg.
4. **Template gaya + ekspor paket produksi** — tiga gaya (Edukasi,
   Cerita, Promo) memetakan topik yang sama ke struktur, palet,
   dan tempo berbeda; hasilnya diekspor sebagai naskah, subtitle,
   dan file proyek yang bisa dibuka lagi.

## Pengguna

- Kreator konten pemula yang butuh draf video pendek cepat, tanpa
  instalasi dan tanpa biaya.
- Guru / penyaji yang butuh storyboard + naskah terstruktur dari
  satu topik.
- Peserta hackathon / juri yang menilai dari demo live di
  GitHub Pages dalam waktu kurang dari 3 menit.

## Alur utama (happy path, < 3 menit untuk demo)

1. Pengguna mengetik topik (contoh netral: "Cara Menyeduh Teh").
2. Pengguna memilih gaya (Edukasi / Cerita / Promo) dan durasi
   (30 / 60 / 90 detik).
3. Aplikasi menghasilkan storyboard: daftar scene, masing-masing
   berisi judul, visual (teks + warna + bentuk sederhana),
   narasi 1–2 kalimat, dan durasi.
4. Pengguna mengedit scene bila perlu (ubah judul/narasi/durasi,
   tambah/hapus scene, ubah urutan).
5. Pengguna memutar preview: canvas menampilkan scene aktif
   sambil narasi dibacakan (TTS), dengan tombol putar/jeda/berhenti.
6. Pengguna mengunduh paket produksi: naskah (`.md`), subtitle
   (`.srt`), dan file proyek (`.json`) untuk dibuka lagi.

## Yang BUKAN produk ini (di luar MVP)

- Bukan editor video timeline profesional (tanpa trimming frame,
  tanpa transisi kompleks, tanpa layer).
- Bukan generator video AI (tanpa model difusi, tanpa API LLM
  berbayar, tanpa unggah ke server).
- Bukan penghasil fakta: aplikasi TIDAK mengklaim kebenaran isi
  topik. Teks yang dihasilkan adalah **kerangka naskah dari
  template + topik yang diketik pengguna**; pengguna bertanggung
  jawab memverifikasi fakta sebelum memublikasikan. Topik contoh
  di aplikasi selalu diberi label "Contoh".
- Bukan aplikasi multi-pengguna: tidak ada akun, tidak ada
  penyimpanan server. Data proyek hanya tersimpan di
  `localStorage` browser pengguna.

## Prinsip produk

- **Jalan offline setelah halaman dimuat**: tanpa panggilan
  jaringan saat membuat storyboard, memutar narasi, atau
  merender preview (TTS memakai suara sistem lokal).
- **Bahasa Indonesia dulu**: seluruh UI, label, pesan error,
  dan naskah contoh berbahasa Indonesia.
- **Tidak ada klaim fakta yang dikarang**: template tidak
  menyisipkan angka, tanggal, nama orang, atau kutipan.
  Semua slot faktual hanya berasal dari teks yang diketik
  pengguna sendiri.
- **Demo-able dalam 3 menit**: halaman pertama langsung
  menampilkan form topik + satu topik contoh sekali klik,
  tanpa onboarding.
- **Aksesibel**: semua kontrol bisa dipakai lewat keyboard,
  tombol punya label teks, dan preview punya teks narasi
  yang terlihat (bukan hanya suara).

## Kriteria sukses MVP (untuk juri/demo)

- Dari halaman kosong ke preview video yang berbunyi dalam
  waktu < 60 detik, tanpa login dan tanpa instalasi.
- Preview video (WebM) berhasil diunduh dan bisa diputar
  di pemutar video standar.
- Paket produksi (naskah + subtitle + proyek) berhasil
  diunduh dan file proyek bisa dimuat kembali.
- Aplikasi jalan penuh dari GitHub Pages (static hosting),
  tanpa error konsol pada alur utama.
