#!/usr/bin/env python3
"""Cek statis Mesin Video Otomatis — Python stdlib saja, tanpa instalasi.

Memeriksa:
  1. index.html ada dan memuat tag/ID wajib.
  2. Semua modul src/*.js yang diimpor dari index.html / app.js ada.
  3. Tidak ada URL http://localhost atau kunci API di file sumber.
  4. .gitignore TIDAK mengecualikan .kiro/ (syarat Kiroween).

Keluar 0 bila semua lolos, 1 bila ada yang gagal.
Dipakai oleh hook .kiro/hooks/cek-statis-setelah-simpan.json
dan secara manual:  python3 scripts/check-static.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAGAL = []


def cek(kondisi, pesan):
    if kondisi:
        print(f"  OK   {pesan}")
    else:
        print(f"  GAGAL {pesan}")
        GAGAL.append(pesan)


def main():
    print("Cek statis Mesin Video Otomatis")
    index = ROOT / "index.html"
    cek(index.is_file(), "index.html ada")
    html = index.read_text(encoding="utf-8") if index.is_file() else ""
    for wajib in ("form-topik", "daftar-scene", "canvas-preview", "status"):
        cek(f'id="{wajib}"' in html, f'index.html memuat id="{wajib}"')
    cek('src/app.js' in html, "index.html memuat src/app.js")
    cek('src/styles.css' in html, "index.html memuat src/styles.css")

    for modul in ("app.js", "storyboard.js", "templates.js",
                  "tts.js", "renderer.js", "exporter.js", "styles.css"):
        cek((ROOT / "src" / modul).is_file(), f"src/{modul} ada")

    isi = ""
    # Hanya file kode yang dicek untuk URL localhost/kunci API:
    # file .md (README/docs) boleh menyebut http://localhost:8000
    # sebagai contoh perintah menjalankan server lokal.
    for path in list(ROOT.rglob("*.html")) + list(ROOT.rglob("*.js")) \
            + list(ROOT.rglob("*.css")):
        if ".kiro" in path.parts:
            continue
        try:
            isi += path.read_text(encoding="utf-8", errors="ignore") + "\n"
        except OSError:
            pass
    cek("http://localhost" not in isi and "https://localhost" not in isi,
        "tidak ada URL localhost di file sumber")
    cek(not re.search(r"(?i)(api[_-]?key|api[_-]?secret)\s*[:=]\s*['\"][^'\"]{8,}",
                      isi), "tidak ada kunci API di file sumber")

    gitignore = ROOT / ".gitignore"
    cek(gitignore.is_file(), ".gitignore ada")
    pola = gitignore.read_text(encoding="utf-8") if gitignore.is_file() else ""
    baris = [b.strip() for b in pola.splitlines()
             if b.strip() and not b.strip().startswith("#")]
    cek(not any(".kiro" in b for b in baris),
        ".gitignore TIDAK mengecualikan .kiro/")
    cek((ROOT / ".kiro" / "specs" / "mesin-video" / "requirements.md").is_file(),
        ".kiro/specs/mesin-video/requirements.md ada")
    cek((ROOT / ".kiro" / "specs" / "mesin-video" / "design.md").is_file(),
        ".kiro/specs/mesin-video/design.md ada")
    cek((ROOT / ".kiro" / "specs" / "mesin-video" / "tasks.md").is_file(),
        ".kiro/specs/mesin-video/tasks.md ada")

    print(f"\n{'LOLOS' if not GAGAL else f'GAGAL ({len(GAGAL)} temuan)'}")
    return 0 if not GAGAL else 1


if __name__ == "__main__":
    sys.exit(main())
