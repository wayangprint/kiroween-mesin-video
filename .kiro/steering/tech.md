---
inclusion: always
---

# Technology Stack — Mesin Video Otomatis

## Stack (dipilih dan dikunci)

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Bahasa | HTML5 + CSS3 + JavaScript (ES Modules, ES2020) | Nol build step; langsung jalan sebagai static site di GitHub Pages |
| Framework | **Tanpa framework** (vanilla JS) | Menghindari rantai build; ukuran kecil; juri bisa membaca kode tanpa tooling |
| Build step | **Tidak ada** | Tidak ada `npm run build`; `package.json` hanya berisi metadata + skrip cek statis (bila ada) |
| Dependensi runtime | **Nol** | Tanpa CDN wajib; aplikasi tetap jalan offline setelah halaman dimuat |
| TTS | Web Speech API — `window.speechSynthesis` + `SpeechSynthesisUtterance` | API bawaan browser; suara `id-ID` bila tersedia di perangkat, fallback ke suara default |
| Render video | Canvas 2D (`<canvas>` 1280×720) + `canvas.captureStream(30)` + `MediaRecorder` (WebM) | Render video murni di browser, tanpa backend dan tanpa ffmpeg |
| Penyimpanan lokal | `localStorage` (satu kunci: proyek terakhir) + unduh file via `Blob` + `URL.createObjectURL` | Tanpa server; proyek bisa disimpan/dibuka sebagai file `.json` |
| Hosting | GitHub Pages (static) | Gratis, sesuai syarat hackathon (repo publik + demo live) |
| Pengujian | Pemeriksaan manual di browser + skrip cek statis `scripts/check-static.py` (Python stdlib saja) | Tanpa test runner berbayar; cek: file ada, HTML punya tag wajib, tidak ada URL absolut localhost |

## Yang SENGAJA tidak dipakai (dan alasannya)

- **React / Vue / Svelte / bundler (Vite, webpack)**: menambah build
  step dan risiko gagal deploy di GitHub Pages; tidak dibutuhkan
  untuk 1 halaman + 5 modul JS.
- **API LLM / API TTS berbayar (OpenAI, ElevenLabs, dsb.)**:
  butuh kunci API dan backend penyimpan kunci; melanggar prinsip
  "tanpa backend, tanpa biaya, jalan offline". Generator teks
  adalah **template berbasis aturan** di `src/templates.js`.
- **JSZip / pustaka ZIP**: menambah dependensi demi satu fitur.
  MVP mengekspor file satu per satu (naskah, subtitle, proyek)
  plus satu file `.json` proyek; ZIP adalah stretch goal
  pasca-MVP (lihat `design.md`).
- **Tailwind / pustaka CSS**: satu file `src/styles.css`
  sudah cukup; menghindari build CSS.
- **Backend / database / autentikasi**: tidak ada; dilarang
  oleh desain static site.

## Browser yang ditargetkan

- Chrome / Edge terbaru (target utama — dukungan
  `speechSynthesis` suara `id-ID`, `MediaRecorder` WebM,
  dan `captureStream` paling lengkap).
- Firefox terbaru (target kedua — `MediaRecorder` WebM
  didukung; ketersediaan suara `id-ID` tergantung sistem).
- Safari: dukungan parsial — `MediaRecorder` dan suara
  `id-ID` mungkin terbatas; aplikasi WAJIB menampilkan
  pesan yang jelas bila sebuah fitur tidak didukung,
  bukan gagal diam-diam (lihat Requirement 8 di
  `requirements.md`).

## Konvensi teknis

- ES Modules: `index.html` memuat `<script type="module"
  src="src/app.js">`; modul lain diimpor relatif
  (`./storyboard.js`, `./tts.js`, `./renderer.js`,
  `./exporter.js`, `./templates.js`).
- Semua path relatif (tanpa `/` absolut di awal) agar
  aplikasi jalan di subpath GitHub Pages
  (`<user>.github.io/<repo>/`).
- Bahasa kode: pengenal (variabel/fungsi) boleh bahasa
  Inggris (konvensi JS); semua string yang tampil ke
  pengguna berbahasa Indonesia.
- Tidak ada rahasia/kunci API di repo. Tidak ada `.env`.
- `localStorage` hanya menyimpan proyek pengguna; tidak
  ada pelacakan/analytics pihak ketiga.

## Perintah yang dipakai

```bash
# Menjalankan lokal (server statis apa saja; contoh Python stdlib)
python3 -m http.server 8000
# lalu buka http://localhost:8000

# Cek statis (tanpa instalasi)
python3 scripts/check-static.py

# Deploy: push ke branch utama repo GitHub ->
# Settings > Pages > Deploy from a branch (root, /)
```

Catatan: `python3 -m http.server` hanya untuk pengembangan
lokal. File `index.html` juga bisa dibuka langsung, tetapi
ES Modules membutuhkan server HTTP di sebagian browser —
karena itu README memerintahkan server lokal, bukan
`file://`.
