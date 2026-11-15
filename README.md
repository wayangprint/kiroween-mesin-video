# Mesin Video Otomatis — frankenstein-mesin-video

> **Kiroween 2026 — Kategori Frankenstein.**
> Stitch yang dijual: generator teks berbasis aturan + TTS
> (Web Speech API) + render video (Canvas + MediaRecorder) +
> template gaya — empat teknologi yang tidak biasa digabung,
> dalam satu aplikasi browser tanpa backend.
>
> Deadline submit: **Jumat, 4 Desember 2026, 14:00 PT**
> (Sabtu, 5 Desember 2026, 05:00 WIB).
> Status repo ini: **spec + scaffold**. Spec lengkap ada di
> `.kiro/specs/mesin-video/`; implementasi substansial
> dikerjakan Kiro CLI mengikuti `tasks.md` (lihat
> "Status implementasi" di bawah).

## Apa ini

Pengguna memasukkan satu topik → aplikasi menghasilkan
storyboard (daftar scene) → narasi per scene dibacakan
(TTS di browser) → preview video diputar di canvas →
paket produksi diunduh (naskah + subtitle + file proyek).
Tanpa akun, tanpa instalasi, tanpa biaya, tanpa backend.

Alur (demo < 3 menit):

1. Ketik topik (atau klik **Coba contoh: Cara Menyeduh Teh**).
2. Pilih gaya (**Edukasi / Cerita / Promo**) dan durasi (**30 / 60 / 90 detik**).
3. Klik **Buat Storyboard**, lalu edit scene bila perlu
   (judul, narasi, durasi, tambah/hapus, ubah urutan).
4. Klik **Putar Preview** — canvas menampilkan scene aktif
   sambil narasi dibacakan.
5. Klik **Rekam & Unduh Video** untuk file video WebM, dan
   unduh **Naskah (.md)**, **Subtitle (.srt)**, **Proyek (.json)**.

## Cara jalan (lokal)

ES Modules membutuhkan server HTTP (bukan `file://` langsung).
Tidak ada instalasi dan tidak ada build step:

```bash
# dari folder repo ini
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

Atau pakai server statis apa saja (mis. `npx serve`, ekstensi
Live Server). Tidak ada `npm install` yang wajib.

## Cara deploy (GitHub Pages)

1. Buat repo GitHub publik, push seluruh isi folder ini
   (termasuk `.kiro/` — wajib, lihat di bawah).
2. Di repo: **Settings → Pages → Build and deployment →
   Deploy from a branch** → branch utama, folder **/(root)**.
3. Buka `https://<user>.github.io/<repo>/`.
   Semua path di aplikasi ini relatif, jadi subpath Pages
   langsung jalan. Tidak ada variabel lingkungan dan
   tidak ada secret.

## Cara demo (3 menit, untuk juri)

1. Buka demo live → klik **Coba contoh** → **Buat Storyboard**.
2. Putar narasi satu scene, lalu **Putar Preview** penuh.
3. **Rekam & Unduh Video** (tunjukkan file WebM terputar),
   lalu **Unduh Naskah** dan tunjukkan isinya.
4. Sebutkan stitch Frankenstein-nya: template berbasis
   aturan (tanpa LLM berbayar) + suara sistem via Web
   Speech API + video dari Canvas/MediaRecorder.

## Stack

| Lapisan | Pilihan |
| --- | --- |
| Bahasa | HTML5 + CSS3 + JavaScript (ES Modules) |
| Framework / build | Tidak ada — static site murni |
| Dependensi runtime | Nol |
| TTS | Web Speech API (`speechSynthesis`, suara `id-ID` bila tersedia) |
| Render video | Canvas 2D 1280×720 + `captureStream(30)` + `MediaRecorder` (WebM) |
| Penyimpanan | `localStorage` + unduh file (Blob) |
| Hosting | GitHub Pages |

Keputusan ini dikunci di `.kiro/steering/tech.md`.
Jangan menambah framework, dependensi, atau API berbayar
tanpa mengubah spec dan mendapat persetujuan pemilik proyek.

## Struktur repo

```
├── index.html                 # Satu-satunya halaman
├── src/
│   ├── app.js                 # Orkestrasi UI
│   ├── templates.js           # Generator storyboard berbasis aturan
│   ├── storyboard.js          # Model proyek/scene + localStorage
│   ├── tts.js                 # Web Speech API
│   ├── renderer.js            # Canvas + preview + rekam MediaRecorder
│   ├── exporter.js            # Unduh .md / .srt / .json
│   └── styles.css
├── assets/contoh-topik.json   # Topik contoh netral berlabel "Contoh"
├── docs/SUBMISSION.md         # Draf isian submit Devpost
├── scripts/check-static.py    # Cek statis tanpa dependensi
└── .kiro/
    ├── specs/mesin-video/     # requirements.md, design.md, tasks.md
    ├── steering/              # product.md, tech.md, structure.md
    └── hooks/                 # Hook JSON v1 (cek statis + pengingat spec)
```

## Status implementasi

**Implementasi penuh.** Semua 4 wave (13 tugas) dari
`tasks.md` telah diselesaikan. Aplikasi berjalan lengkap:
form topik → storyboard → edit scene → preview canvas +
TTS → rekam WebM → unduh naskah/subtitle/proyek → buka
kembali proyek.

## Keterbatasan yang diketahui (jujur, bukan disembunyikan)

- **Video hasil rekaman tidak bersuara.** `canvas.captureStream()`
  hanya menangkap gambar canvas, bukan audio `speechSynthesis`.
  Narasi tetap terdengar saat preview live; file WebM yang
  diunduh berisi gambar saja. Audio-dalam-video adalah
  backlog pasca-MVP (lihat `design.md`).
- **Suara `id-ID` tergantung perangkat.** Bila perangkat tidak
  punya suara Bahasa Indonesia, aplikasi memakai suara default
  browser dan menampilkan catatan.
- **Safari didukung sebagian.** `MediaRecorder` dan suara
  `id-ID` bisa terbatas; aplikasi menampilkan pesan yang
  jelas, bukan gagal diam-diam.
- **Aplikasi tidak memverifikasi fakta.** Naskah dibuat dari
  template + topik yang Anda ketik; template tidak menyisipkan
  angka/tanggal/nama/kutipan. Periksa fakta sebelum
  memublikasikan (catatan ini juga ada di akhir file naskah).

## Cek statis

```bash
python3 scripts/check-static.py
```

Memeriksa tag wajib di `index.html`, keberadaan modul,
tidak ada URL localhost/kunci API, dan `.gitignore` tidak
mengecualikan `.kiro/`. Hook Kiro
(`.kiro/hooks/cek-statis-setelah-simpan.json`) menjalankan
skrip ini otomatis setiap kali file disimpan.

## .kiro/ wajib ter-commit

Folder `.kiro/` (spec + steering + hooks) adalah bukti
pembangunan memakai Kiro dan syarat Kiroween. `.gitignore`
di repo ini TIDAK mengecualikannya — dan
`scripts/check-static.py` memverifikasi hal itu.

## Lisensi

MIT — lihat `LICENSE`.
