# Design Document — Mesin Video Otomatis

## Overview

Aplikasi satu halaman (SPA tanpa router) yang berjalan penuh
di browser sebagai static site. Pengguna mengetik topik →
`templates.js` menghasilkan storyboard (fungsi murni,
deterministik) → `storyboard.js` memegang state proyek →
`renderer.js` menggambar scene ke canvas dan `tts.js`
membacakan narasi → `exporter.js` mengunduh paket produksi.

Tidak ada backend, tidak ada database server, tidak ada
panggilan jaringan saat aplikasi dipakai. Satu-satunya
jaringan adalah pemuatan awal file statis dari GitHub Pages.

Dokumen ini adalah jawaban atas `requirements.md` (spec
`mesin-video`). Setiap bagian komponen menautkan requirement
yang dipenuhinya.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  index.html  (satu halaman, Bahasa Indonesia)       │
│  ├── form topik / gaya / durasi                     │
│  ├── daftar scene (editor)                          │
│  ├── <canvas id="canvas-preview"> 1280×720         │
│  ├── kontrol preview + rekam + unduh                │
│  └── area status #status (pesan Bahasa Indonesia)   │
└─────────────────────────────────────────────────────┘
        │  ES Modules (path relatif)
        ▼
┌──────────┐  ┌──────────────┐  ┌───────────┐
│ app.js   │─▶│ templates.js │  │ storyboard│
│ (wiring  │  │ (generator   │  │ .js       │
│  UI +    │  │  storyboard) │  │ (state +  │
│  state)  │  └──────────────┘  │  storage) │
└────┬─────┘        ▲           └────┬──────┘
     │              │                │
     ▼              │                ▼
┌───────────┐ ┌────────────┐  ┌────────────┐
│ tts.js    │ │ renderer.js│  │ exporter.js│
│ (Web      │ │ (canvas +  │  │ (.md/.srt/ │
│  Speech)  │ │ MediaRec.) │  │  .json)    │
└───────────┘ └────────────┘  └────────────┘
```

Prinsip: **satu sumber kebenaran** (objek `proyek` di
`storyboard.js`), **alur data satu arah**
(form → generator → state → preview/ekspor), dan
**tanpa efek samping saat impor modul**
(semua pekerjaan dimulai dari `app.js`).

## Components

### 1. `index.html` — struktur halaman

- Satu halaman dengan 4 wilayah: (a) form pembuat
  (`#form-topik`: input topik, radio gaya, select durasi,
  tombol "Buat Storyboard", tombol "Coba contoh");
  (b) editor scene (`#daftar-scene`); (c) preview
  (`#canvas-preview`, tombol putar/jeda/berhenti/rekam,
  indikator scene aktif + progres); (d) ekspor
  (tombol Unduh Naskah / Subtitle / Proyek / Buka Proyek)
  dan area status (`#status`, `role="status"`).
- Memuat `<script type="module" src="src/app.js">`
  dan `<link rel="stylesheet" href="src/styles.css">`
  dengan path relatif.
- `<noscript>` berisi pesan "Aplikasi ini membutuhkan
  JavaScript." (Requirement 7.5).
- Memenuhi: Req 1, 4, 5, 6, 7.

### 2. `src/app.js` — orkestrasi UI

- Mendaftarkan semua event listener setelah
  `DOMContentLoaded`; memuat proyek terakhir dari
  `localStorage` (Req 6.6) atau menampilkan form kosong.
- Meneruskan aksi pengguna ke modul yang tepat; tidak
  berisi logika generator, TTS, render, atau ekspor.
- Menampilkan pesan status lewat satu fungsi
  `tampilkanStatus(pesan)`.
- Memenuhi: Req 1–8 (wiring).

### 3. `src/templates.js` — generator storyboard berbasis aturan

- Data: objek `GAYA` dengan tiga gaya. Tiap gaya berisi:
  `struktur` (nama tahapan), `jumlahScene` per durasi,
  `palet` (warna latar/teks per tahapan), dan pola kalimat
  pembuka/isi/penutup yang generik (tanpa angka, tanggal,
  nama, atau kutipan — Req 9.1).
- Fungsi murni `hasilkanStoryboard(topik, gaya, durasi)`:
  memotong topik menjadi scene sesuai struktur gaya,
  membagi durasi total secara merata (sisa detik ke scene
  pertama), mengembalikan array scene. Deterministik:
  input sama → output sama.
- Struktur per gaya (Req 1.5–1.7):

  | Gaya | Struktur | Scene (30/60/90 dtk) |
  | --- | --- | --- |
  | Edukasi | Pembuka — Penjelasan — Contoh — Penutup | 3 / 4 / 5 |
  | Cerita | Pembuka — Konflik — Perubahan — Penutup | 3 / 4 / 5 |
  | Promo | Hook — Manfaat — Ajakan | 3 / 3 / 4 |

- Contoh netral yang dipakai di UI dan `assets/contoh-topik.json`:
  topik "Cara Menyeduh Teh", jelas berlabel "Contoh".
- Memenuhi: Req 1, 9.

### 4. `src/storyboard.js` — model data + operasi edit + penyimpanan

Model data:

```js
// Proyek
{
  topik: string,            // 1–120 karakter
  gaya: "edukasi" | "cerita" | "promo",
  durasiTotal: 30 | 60 | 90, // detik (target awal; bisa berubah lewat edit)
  scene: Scene[]
}
// Scene
{
  id: string,               // unik, mis. "scene-1"
  judul: string,
  narasi: string,           // 1–2 kalimat
  durasi: number,           // detik, >= 1
  warnaLatar: string,       // dari palet gaya
  warnaTeks: string
}
```

- Fungsi: `buatProyek()`, `tambahScene()`, `hapusScene(id)`
  (tolak bila tersisa 1 — Req 2.6), `pindahScene(id, arah)`,
  `totalDurasi(proyek)`, `simpanLokal(proyek)`,
  `muatLokal()`, `validasiProyek(data)` (untuk file `.json`
  yang dibuka — Req 6.5).
- Setiap mutasi memanggil `simpanLokal()` (autosave,
  Req 2.8).
- Memenuhi: Req 2, 6.3–6.6.

### 5. `src/tts.js` — Web Speech API

- Fungsi: `dukunganTTS()` (cek `window.speechSynthesis`),
  `pilihSuaraId()` (cari suara `lang` diawali `id`,
  fallback `null` + catatan), `bicarakan(teks, {onSelesai})`,
  `berhenti()`.
- Satu ucapan (`SpeechSynthesisUtterance`) per scene;
  `lang = "id-ID"`, `rate = 1`.
- Bila `speechSynthesis` tidak ada: kembalikan status
  tidak didukung; `app.js` menonaktifkan tombol putar
  narasi (Req 3.6).
- Memenuhi: Req 3.

### 6. `src/renderer.js` — canvas + preview + rekam

- `gambarScene(ctx, scene, proyek)`: latar warna gaya,
  judul besar di tengah, nomor scene, dan bilah progres
  scene. Tanpa gambar eksternal (tanpa aset berhak cipta).
- Preview: timer berbasis `setTimeout` per scene
  (bukan `requestAnimationFrame` penuh — cukup karena
  visual scene statis + bilah progres); saat scene
  berganti, panggil `tts.bicarakan(narasi scene)`.
  Jeda/berhenti menghentikan timer dan `tts.berhenti()`.
- Rekam: `mulaiRekam(canvas)` → `canvas.captureStream(30)`
  → `new MediaRecorder(stream, {mimeType: "video/webm"})`
  → kumpulkan `dataavailable` → `Blob` WebM → unduh.
  Rekaman memutar preview dari awal sampai selesai
  secara otomatis.
- **Keterbatasan yang didokumentasikan (Req 5.5)**:
  `captureStream()` hanya menangkap gambar canvas,
  bukan audio `speechSynthesis`; video hasil rekaman
  tidak bersuara. Ini dijelaskan di README, di area
  status saat rekam, dan di catatan file naskah.
  Solusi suara-dalam-video (mere kam audio lewat
  `AudioContext`) dicatat sebagai backlog pasca-MVP,
  bukan janji MVP.
- Memenuhi: Req 4, 5.

### 7. `src/exporter.js` — unduh paket produksi

- `unduhTeks(namaFile, isi, mime)`: `Blob` +
  `URL.createObjectURL` + klik `<a download>` terprogram.
- `keMarkdown(proyek)`: judul, topik, gaya, durasi,
  daftar scene (judul + durasi + narasi), ditambah
  catatan pemeriksa fakta (Req 9.3).
- `keSRT(proyek)`: entri berurutan `HH:MM:SS,mmm`
  dari akumulasi durasi scene.
- `keJSON(proyek)` / `dariJSON(teks)`: serialisasi
  + validasi lewat `storyboard.validasiProyek()`.
- Memenuhi: Req 6.

### 8. `src/styles.css` — stylesheet

- Satu file; layout kolom tunggal, lebar maks 960px,
  tombol besar, fokus keyboard terlihat
  (`:focus-visible` outline), area status mudah dilihat.
- Tanpa framework CSS; tanpa font eksternal (font sistem).

### 9. `assets/contoh-topik.json` — data contoh

- Satu objek proyek contoh (topik "Cara Menyeduh Teh",
  gaya Edukasi, 60 detik) dengan label `"contoh": true`.
  Bukan klaim fakta — hanya contoh pengisi form.

### 10. `scripts/check-static.py` — cek statis

- Python stdlib saja; memeriksa: `index.html` ada dan
  memuat tag wajib (`canvas-preview`, `form-topik`,
  `daftar-scene`, `status`); semua `src/*.js` yang
  diimpor ada; tidak ada URL absolut `http://localhost`
  atau kunci API di file; `.gitignore` tidak memuat
  `.kiro`. Keluar kode 0 bila lolos, 1 bila gagal.
  Dipakai hook `PostFileSave` dan pengecekan manual.

## Sequence Diagrams

### Membuat storyboard

```
Pengguna -> app.js: isi topik, pilih gaya/durasi, klik "Buat Storyboard"
app.js -> templates.js: hasilkanStoryboard(topik, gaya, durasi)
templates.js -> app.js: Scene[]
app.js -> storyboard.js: buatProyek(...) + simpanLokal()
app.js -> UI: render daftar scene + tampilkan status "Storyboard dibuat."
```

### Preview

```
Pengguna -> app.js: klik "Putar Preview"
app.js -> renderer.js: putarPreview(proyek, {onSceneAktif})
renderer.js -> renderer.js: gambarScene(scene ke-n) ke canvas
renderer.js -> tts.js: bicarakan(narasi scene ke-n)
tts.js -> renderer.js: onSelesai -> lanjut scene berikut
renderer.js -> app.js: selesai -> status "Preview selesai."
```

### Rekam video

```
Pengguna -> app.js: klik "Rekam & Unduh Video"
app.js -> renderer.js: mulaiRekam(canvas, proyek)
renderer.js -> MediaRecorder: captureStream(30) + start()
renderer.js -> renderer.js: putar preview dari awal (gambar + TTS)
renderer.js -> app.js: onstop -> Blob WebM -> unduh file
```

## Error Handling

| Situasi | Perilaku |
| --- | --- |
| Topik kosong / > 120 karakter | Pesan di `#status`; storyboard tidak dibuat (Req 1.2–1.3) |
| Hapus scene terakhir | Ditolak + pesan "Minimal harus ada 1 scene." (Req 2.6) |
| `speechSynthesis` tidak ada | Tombol narasi nonaktif + pesan (Req 3.6) |
| Suara `id-ID` tidak ada | Pakai suara default + catatan (Req 3.5) |
| `MediaRecorder` tidak ada | Tombol rekam nonaktif + pesan (Req 5.4) |
| File `.json` bukan proyek | Pesan + proyek aktif tidak berubah (Req 6.5) |
| Gagal unduh | Pesan "Gagal mengunduh file. Coba lagi." (Req 8.3) |
| `localStorage` penuh/diblokir | Tangkap error, tampilkan pesan, aplikasi tetap jalan tanpa autosave |

Semua pesan berbahasa Indonesia, tampil di `#status`,
dan hanya menonaktifkan fitur yang gagal (Req 8.2).

## Testing Strategy

Tanpa test runner (nol dependensi). Verifikasi dilakukan
dengan daftar periksa manual + skrip cek statis:

1. **Cek statis** — `python3 scripts/check-static.py`
   (dijalankan hook `PostFileSave` dan sebelum submit).
2. **Daftar periksa alur utama** (di `tasks.md`, tugas 12):
   buka halaman → topik contoh → buat storyboard →
   edit 1 scene → putar narasi 1 scene → putar preview
   penuh → rekam & unduh WebM (putar di pemutar video) →
   unduh naskah/subtitle/proyek → buka lagi file proyek.
   Semua langkah harus lolos tanpa error konsol.
3. **Matriks browser** — Chrome/Edge terbaru (wajib lolos
   penuh); Firefox terbaru (wajib lolos kecuali suara
   `id-ID` bila tidak tersedia); Safari (dicatat
   keterbatasannya, pesan fallback wajib muncul).
4. **Uji regresi EARS** — setiap kriteria `requirements.md`
   dicentang terhadap perilaku nyata sebelum submit;
   kriteria yang gagal dicatat di laporan, bukan dihapus.

## Deployment

- Repo GitHub publik; GitHub Pages dari branch utama,
  folder root (`/`). Semua path relatif agar jalan di
  subpath `https://<user>.github.io/<repo>/`.
- Tidak ada variabel lingkungan, tidak ada secret,
  tidak ada langkah build. Push = deploy.
- `.kiro/` ter-commit (syarat Kiroween); `.gitignore`
  tidak mengecualikannya — diverifikasi oleh
  `scripts/check-static.py`.

## Backlog Pasca-MVP (bukan janji MVP)

- Ekspor ZIP (satu file berisi naskah + subtitle +
  proyek + video) — kandidat pustaka: JSZip via file
  lokal (bukan CDN) atau penulisan ZIP manual.
- Audio narasi di dalam video rekaman (rute suara TTS
  lewat `AudioContext` + `MediaStreamDestination`).
- Unggah gambar latar per scene (FileReader, lokal saja).
- Lebih banyak gaya/template dan durasi bebas.
- Mode gelap; ekspor naskah ke clipboard.
