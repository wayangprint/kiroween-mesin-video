# Draf Isian Submit Devpost — Kiroween 2026

> Status: implementasi selesai (Wave 1–4). Tautan repo dan demo
> diisi setelah repo GitHub publik dan GitHub Pages aktif (Tugas 13).
> Video demo direkam setelah demo live diverifikasi.

## Proyek

- **Nama:** Mesin Video Otomatis (frankenstein-mesin-video)
- **Kategori:** Frankenstein
- **Tagline:** Topik jadi storyboard, narasi, dan video — di browser, tanpa backend.
- **Repo GitHub:** _(isi setelah repo publik dibuat + `.kiro/` ter-push)_
- **Demo live (GitHub Pages):** _(isi setelah Pages aktif dan diverifikasi)_
- **Video demo:** < 3 menit _(rekam dari demo live; alur: contoh → storyboard → preview → rekam WebM → unduh naskah)_

## Deskripsi

Mesin Video Otomatis mengubah satu topik menjadi paket
produksi video pendek: storyboard yang bisa diedit, narasi
per scene yang dibacakan langsung di browser (Web Speech API),
preview video yang dirender dari canvas (MediaRecorder WebM),
dan paket unduhan (naskah `.md`, subtitle `.srt`, file proyek
`.json`). Semuanya berjalan sebagai static site tanpa backend,
tanpa akun, dan tanpa biaya.

Stitch Frankenstein-nya: empat teknologi yang masing-masing
biasa berdiri sendiri, dijahit menjadi satu alur kerja:

1. **Generator teks berbasis aturan** — bukan LLM berbayar;
   deterministik, berjalan lokal, tiga gaya (Edukasi/Cerita/Promo).
2. **Web Speech API** — narasi dibacakan oleh suara sistem
   browser; suara `id-ID` bila tersedia, fallback ke default.
3. **Canvas 2D + MediaRecorder** — preview dirender dari
   `<canvas>` 1280×720 lewat `captureStream(30)`, direkam
   sebagai WebM; tanpa server render dan tanpa ffmpeg.
4. **Template gaya + ekspor paket produksi** — tiga gaya memetakan
   topik yang sama ke struktur, palet, dan tempo berbeda;
   hasilnya diekspor sebagai naskah, subtitle, dan file proyek.

## Dibangun dengan

- **Kiro** (spec-driven development) — bukti di folder `.kiro/`:
  requirements.md (EARS), design.md, tasks.md (4 wave, 13 tugas),
  steering (product/tech/structure), hooks (cek statis + pengingat spec)
- HTML5 + CSS3 + JavaScript ES Modules — tanpa framework, tanpa build step
- Web Speech API (`window.speechSynthesis + SpeechSynthesisUtterance`)
- Canvas 2D (`canvas.captureStream(30)`) + `MediaRecorder` (WebM)
- GitHub Pages (static hosting gratis)

## Keterbatasan yang diketahui (jujur)

- **Video hasil rekaman tidak bersuara.** `captureStream()` hanya
  menangkap gambar canvas, bukan audio `speechSynthesis`. Narasi
  tetap terdengar saat preview live. Audio-dalam-video adalah
  backlog pasca-MVP.
- **Suara `id-ID` tergantung perangkat.** Bila tidak ada, aplikasi
  memakai suara default dan menampilkan catatan.
- **Safari didukung sebagian.** `MediaRecorder` bisa terbatas;
  aplikasi menampilkan pesan, bukan gagal diam-diam.

## Checklist sebelum submit Devpost

- [ ] Repo GitHub publik dibuat + seluruh repo ini di-push
      (termasuk `.kiro/` — wajib)
- [ ] `git ls-files .kiro` menampilkan file (bukan kosong)
- [ ] `git check-ignore .kiro/specs/mesin-video/requirements.md`
      tidak mengembalikan apa pun (= tidak diabaikan)
- [ ] GitHub Pages aktif dan demo live diverifikasi
      (`python3 scripts/check-static.py` lolos di repo)
- [ ] Video demo < 3 menit direkam dari demo live dan diunggah
- [ ] Tautan repo + demo dimasukkan ke bagian atas file ini
- [ ] Minta kredit Kiro gratis (bila belum) sebelum
      1 Desember 2026 12:00 PT
