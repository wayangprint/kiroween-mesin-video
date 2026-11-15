# Implementation Tasks — Mesin Video Otomatis

> Cara pakai: jalankan tugas berurutan per gelombang (wave).
> Tugas dalam satu wave tidak saling bergantung dan boleh
> dikerjakan paralel oleh Kiro; wave berikutnya baru dimulai
> setelah wave sebelumnya selesai. Setiap tugas mencantumkan
> `_Requirements:` (kriteria EARS dari `requirements.md`
> yang dipenuhinya). Jangan menulis implementasi di luar
> tugas yang sedang dikerjakan; jangan menambah dependensi
> atau build step tanpa persetujuan pemilik proyek.
>
> Perintah Kiro CLI yang dipakai: buka folder proyek di
> Kiro (IDE/CLI/Web), pilih spec `mesin-video`, lalu
> jalankan tugas satu per satu dari panel Tasks.
> Semua file mengikuti `.kiro/steering/` (product, tech,
> structure). Bahasa UI: Bahasa Indonesia.

## Wave 1 — Fondasi (tanpa dependensi antar tugas)

- [ ] 1. Buat kerangka halaman `index.html` + `src/styles.css`
  - Buat struktur 4 wilayah: form topik/gaya/durasi
    (`#form-topik`), editor scene (`#daftar-scene`),
    preview (`#canvas-preview` 1280×720 + kontrol
    putar/jeda/berhenti/rekam), ekspor + area status
    (`#status`, `role="status"`).
  - Tambahkan `<noscript>` berisi pesan butuh JavaScript.
  - `styles.css`: layout kolom tunggal (maks 960px),
    tombol besar, `:focus-visible` terlihat.
  - Semua path relatif; belum ada logika JS.
  - _Requirements: 7.1, 7.3, 7.5, 8.1_

- [ ] 2. Buat modul data `src/storyboard.js` (model + operasi + storage)
  - Implementasikan model `Proyek`/`Scene` sesuai
    `design.md` (bagian Components 4).
  - Fungsi: `buatProyek()`, `tambahScene()`,
    `hapusScene(id)` (tolak bila tersisa 1),
    `pindahScene(id, arah)`, `totalDurasi(proyek)`,
    `simpanLokal()`, `muatLokal()`,
    `validasiProyek(data)`.
  - Autosave ke `localStorage` kunci
    `mesin-video:proyek-terakhir` pada setiap mutasi;
    tangkap error bila storage diblokir/penuh.
  - _Requirements: 2.1, 2.3–2.8, 6.6_

- [ ] 3. Buat modul template `src/templates.js` (generator berbasis aturan)
  - Data `GAYA` untuk Edukasi / Cerita / Promo:
    struktur tahapan, jumlah scene per durasi
    (lihat `design.md`), palet warna, pola kalimat
    generik tanpa angka/tanggal/nama/kutipan.
  - Fungsi murni `hasilkanStoryboard(topik, gaya, durasi)`
    yang deterministik dan membagi durasi total
    hingga jumlahnya sama dengan durasi dipilih.
  - Topik contoh "Cara Menyeduh Teh" (berlabel Contoh).
  - _Requirements: 1.1, 1.4–1.8, 9.1, 9.2_

- [ ] 4. Buat `assets/contoh-topik.json` + `scripts/check-static.py`
  - `contoh-topik.json`: satu proyek contoh (topik
    "Cara Menyeduh Teh", gaya Edukasi, 60 detik,
    `"contoh": true`).
  - `check-static.py` (Python stdlib saja): periksa
    `index.html` memuat tag wajib, semua modul
    `src/*.js` yang diimpor ada, tidak ada URL
    `http://localhost` atau kunci API, dan `.gitignore`
    tidak mengecualikan `.kiro`. Keluar 0/1.
  - _Requirements: 1.8, 7.3, 8.4_

## Wave 2 — Fitur inti (bergantung pada Wave 1)

- [ ] 5. Implementasikan `src/app.js` + wiring form dan editor scene
  - Daftarkan event setelah `DOMContentLoaded`; muat
    proyek terakhir dari `localStorage` atau tampilkan
    form kosong + topik contoh.
  - Validasi topik (kosong → "Tulis dulu topik videonya.";
    > 120 karakter → pesan batas) sebelum memanggil
    generator.
  - Render daftar scene dari state; edit judul/narasi/
    durasi, tambah/hapus/pindah scene; semua perubahan
    lewat `storyboard.js` dan langsung tersimpan.
  - Satu fungsi `tampilkanStatus(pesan)` untuk semua pesan.
  - _Requirements: 1.1–1.3, 2.1–2.8, 6.6, 7.1, 7.4_

- [ ] 6. Implementasikan `src/tts.js` (Web Speech API)
  - Fungsi: `dukunganTTS()`, `pilihSuaraId()`,
    `bicarakan(teks, {onSelesai})`, `berhenti()`.
  - Pilih suara `id-ID` bila ada; bila tidak ada, pakai
    suara default + catatan di status.
  - Bila API tidak didukung: kembalikan status tidak
    didukung agar `app.js` menonaktifkan tombol narasi.
  - Tombol putar narasi per scene + tombol berhenti;
    tandai scene yang sedang dibacakan.
  - _Requirements: 3.1–3.6_

- [ ] 7. Implementasikan `src/renderer.js` bagian gambar + preview
  - `gambarScene(ctx, scene, proyek)`: latar warna gaya,
    judul besar, nomor scene, bilah progres.
  - `putarPreview()` berurutan per durasi scene,
    memanggil `tts.bicarakan()` tiap scene, menampilkan
    indikator scene aktif + progres, mendukung
    jeda/lanjut dari posisi sama dan berhenti
    (kembali ke scene pertama).
  - Mengedit scene saat preview berjalan menghentikan
    preview dulu.
  - _Requirements: 4.1–4.6_

- [ ] 8. Implementasikan `src/exporter.js` (naskah, subtitle, proyek)
  - `unduhTeks()`, `keMarkdown()` (termasuk catatan
    pemeriksa fakta di akhir file), `keSRT()`
    (penanda waktu akumulasi per scene),
    `keJSON()` / `dariJSON()` + validasi.
  - Tombol: Unduh Naskah, Unduh Subtitle, Unduh Proyek,
    Buka Proyek (pilih file `.json`; file bukan proyek
    ditolak dengan pesan, proyek aktif tidak berubah).
  - _Requirements: 6.1–6.5, 9.3_

## Wave 3 — Rekam video + penanganan error (bergantung pada Wave 2)

- [ ] 9. Implementasikan perekaman video di `src/renderer.js`
  - `mulaiRekam(canvas, proyek)`: `canvas.captureStream(30)`
    + `MediaRecorder` (WebM) → kumpulkan `dataavailable`
    → unduh Blob WebM; status "Merekam…" selama rekam,
    tombol rekam nonaktif sampai selesai.
  - Bila `MediaRecorder` tidak didukung: tombol rekam
    nonaktif + pesan "Browser ini tidak mendukung
    perekaman video. Coba Chrome atau Edge terbaru."
  - Tampilkan penjelasan di status bahwa suara TTS
    tidak terekam dalam video (keterbatasan
    `captureStream`).
  - _Requirements: 5.1–5.5_

- [ ] 10. Rapikan penanganan error + pesan status di seluruh aplikasi
  - Pastikan setiap kegagalan (Req 8) menampilkan pesan
    Bahasa Indonesia di `#status` dan hanya menonaktifkan
    tombol fitur yang gagal.
  - Pastikan tidak ada error konsol pada alur utama.
  - _Requirements: 8.1–8.4_

## Wave 4 — Verifikasi, dokumen submit, dan rilis (bergantung pada Wave 3)

- [ ] 11. Lengkapi `README.md` + `docs/SUBMISSION.md` dari perilaku nyata
  - README: cara jalan lokal, cara deploy GitHub Pages,
    cara demo 3 menit, keterbatasan yang diketahui
    (video rekaman tanpa suara TTS; suara `id-ID`
    tergantung perangkat; Safari parsial).
  - `docs/SUBMISSION.md`: draf isian Devpost (judul,
    deskripsi, kategori Frankenstein, tautan repo/demo).
  - Jangan menulis klaim yang belum diverifikasi
    lewat uji nyata.
  - _Requirements: 5.5, 7.1_

- [ ] 12. Uji alur utama end-to-end + matriks browser (daftar periksa)
  - Jalankan `python3 scripts/check-static.py` (harus lolos).
  - Alur: topik contoh → buat storyboard → edit 1 scene →
    putar narasi 1 scene → putar preview penuh → rekam &
    unduh WebM (putar di pemutar video) → unduh naskah/
    subtitle/proyek → buka lagi file proyek.
  - Browser: Chrome/Edge terbaru (wajib lolos penuh);
    Firefox terbaru (catat bila suara `id-ID` tidak ada);
    Safari (catat keterbatasan + pastikan pesan fallback
    muncul). Tanpa error konsol pada alur utama.
  - Centang setiap kriteria EARS `requirements.md`
    terhadap perilaku nyata; yang gagal dicatat
    sebagai temuan, bukan dihapus dari spec.
  - _Requirements: 1–9 (verifikasi akhir)_

- [ ] 13. Verifikasi akhir sebelum submit Devpost
  - Pastikan `.kiro/` ter-commit (cek `git status` /
    `git ls-files .kiro` dan `git check-ignore .kiro/
    specs/mesin-video/requirements.md` harus TIDAK
    terabaikan).
  - Pastikan repo publik, GitHub Pages aktif, demo live
    bisa dibuka, dan video demo < 3 menit sudah direkam.
  - Perbarui `docs/SUBMISSION.md` dengan tautan final.
  - _Requirements: 7.1, 7.3_
