# Aturan Kerja Agen — Mesin Video Otomatis

Repo ini dibangun dengan **spec-driven development (Kiro)**.
Sebelum menulis kode apa pun, baca:

1. `.kiro/specs/mesin-video/tasks.md` — kerjakan hanya tugas
   berikutnya dalam wave yang aktif.
2. `.kiro/specs/mesin-video/requirements.md` — kriteria EARS
   yang harus dipenuhi; jangan diubah diam-diam.
3. `.kiro/specs/mesin-video/design.md` — arsitektur dan
   pemisahan modul yang dikunci.
4. `.kiro/steering/product.md`, `tech.md`, `structure.md` —
   konteks produk, stack, dan tata letak.

## Aturan keras

- Tanpa build step, tanpa framework, tanpa dependensi runtime,
  tanpa API berbayar, tanpa backend.
- Bahasa UI: Bahasa Indonesia.
- Template naskah tidak boleh menyisipkan angka, tanggal, nama
  orang, atau kutipan. Slot faktual hanya dari input pengguna.
- `.kiro/` wajib tetap ter-commit; jangan tambahkan ke `.gitignore`.
- Bila sebuah requirement tidak bisa dipenuhi, laporkan sebagai
  temuan — jangan ubah `requirements.md` diam-diam.
- Setelah selesai satu tugas, jalankan
  `python3 scripts/check-static.py` dan laporkan hasilnya.
