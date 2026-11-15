---
inclusion: always
---

# Project Structure — Mesin Video Otomatis

## Tata letak repo

```
frankenstein-mesin-video/
├── README.md                  # Cara jalan, cara deploy, cara demo (3 menit)
├── LICENSE                    # MIT
├── .gitignore                 # JANGAN PERNAH mengecualikan .kiro/
├── AGENTS.md                  # Aturan kerja agen di repo ini
├── index.html                 # Satu-satunya halaman (entry point)
├── src/
│   ├── app.js                 # Orkestrasi UI: wiring event, state proyek
│   ├── templates.js           # Template gaya + generator storyboard berbasis aturan
│   ├── storyboard.js          # Model data proyek/scene + operasi edit + localStorage
│   ├── tts.js                 # Pembungkus Web Speech API (suara id-ID, antrean per scene)
│   ├── renderer.js            # Gambar scene ke canvas + rekam via MediaRecorder
│   ├── exporter.js            # Unduh naskah (.md), subtitle (.srt), proyek (.json)
│   └── styles.css             # Satu-satunya stylesheet
├── assets/
│   └── contoh-topik.json      # Topik contoh netral berlabel "Contoh" (bukan fakta)
├── docs/
│   └── SUBMISSION.md          # Draf isian submit Devpost (judul, deskripsi, demo)
├── scripts/
│   └── check-static.py        # Cek statis tanpa dependensi (dipakai hook + manual)
└── .kiro/
    ├── specs/
    │   └── mesin-video/
    │       ├── requirements.md  # User stories + acceptance criteria (EARS)
    │       ├── design.md        # Arsitektur, model data, sequence, error, testing
    │       └── tasks.md         # Tugas implementasi berurutan untuk Kiro CLI
    ├── steering/
    │   ├── product.md           # File ini (tujuan produk)
    │   ├── tech.md              # Stack + konvensi teknis
    │   └── structure.md         # File ini (tata letak + konvensi)
    └── hooks/
        ├── cek-statis-setelah-simpan.json   # PostFileSave -> scripts/check-static.py
        └── pengingat-spec.json              # SessionStart -> pengingat agen (prompt)
```

## Konvensi penamaan

- File dan folder: `kebab-case` (contoh: `check-static.py`).
- Modul JS: satu tanggung jawab per file; nama file =
  nama tanggung jawab (`tts.js` hanya TTS, `renderer.js`
  hanya canvas + rekam).
- Fungsi diekspor bernama (named export), bukan default
  export, agar impor eksplisit dan mudah dilacak.
- ID elemen HTML: `kebab-case` dengan awalan peran
  (`form-topik`, `btn-putar`, `daftar-scene`,
  `canvas-preview`).
- Kunci `localStorage`: `mesin-video:proyek-terakhir`
  (satu kunci, satu nilai JSON).

## Konvensi arsitektur

- **Satu sumber kebenaran**: objek `proyek` di
  `src/storyboard.js` (topik, gaya, durasi, daftar scene).
  UI hanya merender dari objek ini; tidak ada state ganda.
- **Alur data satu arah**: form → `templates.js`
  (hasilkan storyboard) → `storyboard.js` (simpan/edit)
  → `renderer.js` + `tts.js` (preview) → `exporter.js`
  (unduh). Modul tidak memanggil balik ke `app.js`.
- **Tanpa efek samping saat impor**: modul hanya
  mendefinisikan fungsi/konstanta; semua pekerjaan
  dimulai dari `app.js` saat `DOMContentLoaded`.
- **Template adalah data, bukan kode acak**: setiap gaya
  di `templates.js` adalah objek data (struktur scene,
  palet, pola kalimat) + satu fungsi murni
  `hasilkanStoryboard(topik, gaya, durasi)`. Fungsi ini
  deterministik: input sama → output sama.
- **Gagal dengan pesan, bukan diam**: setiap kegagalan
  fitur browser (TTS tidak ada, `MediaRecorder` tidak
  didukung, suara `id-ID` tidak ada) menampilkan pesan
  Bahasa Indonesia di area status (`#status`) dan tetap
  membiarkan fitur lain jalan.

## Konvensi spec (Kiro, format resmi kiro.dev/docs)

- Spec tinggal di `.kiro/specs/mesin-video/` dengan tiga
  file: `requirements.md`, `design.md`, `tasks.md`
  (alur Requirements-First).
- `requirements.md`: tiap requirement = `### Requirement N`
  + `**User Story:** As a ..., I want ..., so that ...`
  + `#### Acceptance Criteria` bernomor dengan notasi EARS
  (`WHEN ... THEN THE SYSTEM SHALL ...` /
  `IF ... THEN THE SYSTEM SHALL ...` /
  `WHILE ... THE SYSTEM SHALL ...`).
  Kriteria dirujuk sebagai `<requirement>.<kriteria>`
  (mis. `1.2`) dari `design.md` dan `tasks.md`.
- `design.md`: Overview, Architecture, Components,
  Data Models, Sequence, Error Handling, Testing Strategy.
- `tasks.md`: daftar centang `- [ ]` bernomor, tiap tugas
  mencantumkan `_Requirements: ..._` yang dipenuhinya,
  dikelompokkan dalam gelombang (wave) sesuai dependensi.
- Steering: tiga file fondasi di `.kiro/steering/`
  (`product.md`, `tech.md`, `structure.md`) dengan
  front matter `inclusion: always`.
- Hooks: file JSON v1 di `.kiro/hooks/` — satu file per
  topik, skema `{"version": "v1", "hooks": [...]}`,
  trigger PascalCase sesuai
  `kiro.dev/docs/hooks/` dan `kiro.dev/docs/hooks/types/`
  (yang dipakai di sini: `PostFileSave`, `SessionStart`).
- **`.kiro/` WAJIB ter-commit ke GitHub** (syarat
  Kiroween: bukti pembangunan memakai Kiro). `.gitignore`
  tidak boleh memuat `.kiro`, `*.md` di `.kiro`, atau
  pola apa pun yang mengecualikannya.

## Yang tidak boleh dilakukan agen implementasi

- Jangan menambah build step, framework, dependensi
  runtime, atau panggilan API eksternal tanpa mengubah
  dulu `design.md` + `tech.md` dan mendapat persetujuan
  pemilik proyek.
- Jangan menyisipkan fakta/angka/tanggal/nama ke dalam
  template naskah. Slot faktual hanya dari input pengguna.
- Jangan menulis seluruh logika aplikasi dalam satu file;
  patuhi pemisahan modul di atas.
- Jangan mengubah `requirements.md` diam-diam saat
  implementasi menemui kesulitan — catat sebagai
  temuan di laporan dan minta keputusan pemilik.
