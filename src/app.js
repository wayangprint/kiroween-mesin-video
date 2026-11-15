// app.js — orkestrasi UI Mesin Video Otomatis.
//
// Tanggung jawab: wiring semua event, render DOM, tampilkan status.
// DILARANG: menaruh logika generator, TTS, render canvas, atau ekspor
// di file ini — itu milik modul masing-masing (lihat design.md).

import { hasilkanStoryboard } from "./templates.js";
import {
  buatProyek,
  tambahScene,
  hapusScene,
  pindahScene,
  ubahScene,
  totalDurasi,
  muatLokal,
  simpanLokal,
  validasiProyek,
} from "./storyboard.js";
import { dukunganTTS, pilihSuaraId, bicarakan, berhenti } from "./tts.js";
import { putarPreview, hentikanPreview, mulaiRekam } from "./renderer.js";
import { unduhTeks, keMarkdown, keSRT, keJSON } from "./exporter.js";

// ── State global aplikasi ────────────────────────────────────────────────────

let proyek = null;           // Objek Proyek aktif
let previewBerjalan = false;
let sceneNarasi = null;      // id scene yang sedang diputar narasinya
let jedaPreview = () => {};
let lanjutkanPreview = () => {};

// ── Fungsi tampil status ─────────────────────────────────────────────────────
// Didefinisikan di luar DOMContentLoaded agar bisa dipanggil kapan pun.
// Elemen #status dijamin ada karena index.html selalu memuatnya.

function tampilkanStatus(pesan) {
  const el = document.getElementById("status");
  if (el) el.textContent = pesan;
}

// ── Render daftar scene ──────────────────────────────────────────────────────

function renderDaftarScene() {
  const elDaftarScene = document.getElementById("daftar-scene");
  const elTotalDurasi = document.getElementById("total-durasi");

  if (!proyek) {
    elDaftarScene.innerHTML = "";
    elTotalDurasi.textContent = "Total durasi: —";
    return;
  }

  elTotalDurasi.textContent = `Total durasi: ${totalDurasi(proyek)} detik`;

  const fragment = document.createDocumentFragment();

  // Nonaktifkan tombol narasi bila TTS tidak didukung
  const ttsDidukung = dukunganTTS();

  proyek.scene.forEach((scene, idx) => {
    const li = document.createElement("li");
    li.dataset.id = scene.id;
    if (scene.id === sceneNarasi) li.classList.add("scene-aktif-tts");

    li.innerHTML = `
      <div class="scene-header">
        <span class="scene-nomor">${idx + 1}.</span>
        <input class="scene-judul-input" type="text"
               aria-label="Judul scene ${idx + 1}"
               value="${escapaAtribut(scene.judul)}">
      </div>
      <label class="scene-narasi-label">Narasi</label>
      <textarea class="scene-narasi-input" rows="2"
                aria-label="Narasi scene ${idx + 1}">${escapaTeks(scene.narasi)}</textarea>
      <div class="scene-footer">
        <label class="scene-durasi-label">
          Durasi (detik):&nbsp;
          <input class="scene-durasi-input" type="number" min="1" max="300"
                 value="${scene.durasi}" aria-label="Durasi scene ${idx + 1} dalam detik">
        </label>
        <button class="scene-tombol-narasi sekunder" data-aksi="narasi"
                type="button"
                ${!ttsDidukung ? "disabled" : ""}
                title="Putar narasi scene ini">
          ${scene.id === sceneNarasi ? "⏹ Berhenti" : "▶ Narasi"}
        </button>
        <button class="scene-tombol-naik sekunder" data-aksi="naik"
                type="button" aria-label="Pindah scene ke atas"
                ${idx === 0 ? "disabled" : ""}>↑</button>
        <button class="scene-tombol-turun sekunder" data-aksi="turun"
                type="button" aria-label="Pindah scene ke bawah"
                ${idx === proyek.scene.length - 1 ? "disabled" : ""}>↓</button>
        <button class="scene-tombol-hapus berbahaya" data-aksi="hapus"
                type="button" aria-label="Hapus scene ${idx + 1}">Hapus</button>
      </div>
    `;

    // Event: judul
    li.querySelector(".scene-judul-input").addEventListener("change", (e) => {
      if (previewBerjalan) hentikanPreviewAktif();
      ubahScene(proyek, scene.id, "judul", e.target.value);
      renderDaftarScene();
    });

    // Event: narasi
    li.querySelector(".scene-narasi-input").addEventListener("change", (e) => {
      if (previewBerjalan) hentikanPreviewAktif();
      ubahScene(proyek, scene.id, "narasi", e.target.value);
    });

    // Event: durasi
    li.querySelector(".scene-durasi-input").addEventListener("change", (e) => {
      if (previewBerjalan) hentikanPreviewAktif();
      ubahScene(proyek, scene.id, "durasi", e.target.value);
      elTotalDurasi.textContent = `Total durasi: ${totalDurasi(proyek)} detik`;
    });

    // Event: tombol aksi (narasi/naik/turun/hapus)
    li.querySelectorAll("[data-aksi]").forEach((btn) => {
      btn.addEventListener("click", () => aksiScene(scene.id, btn.dataset.aksi));
    });

    fragment.appendChild(li);
  });

  elDaftarScene.innerHTML = "";
  elDaftarScene.appendChild(fragment);
}

// ── Aksi scene ───────────────────────────────────────────────────────────────

function aksiScene(id, aksi) {
  if (aksi === "hapus") {
    if (previewBerjalan) hentikanPreviewAktif();
    const hasil = hapusScene(proyek, id);
    if (!hasil.ok) {
      tampilkanStatus(hasil.pesan);
      return;
    }
    if (sceneNarasi === id) {
      berhenti();
      sceneNarasi = null;
    }
    renderDaftarScene();
    tampilkanStatus("Scene dihapus.");

  } else if (aksi === "naik" || aksi === "turun") {
    if (previewBerjalan) hentikanPreviewAktif();
    pindahScene(proyek, id, aksi);
    renderDaftarScene();

  } else if (aksi === "narasi") {
    if (!dukunganTTS()) return;
    if (sceneNarasi === id) {
      // Hentikan narasi yang sedang berjalan
      berhenti();
      sceneNarasi = null;
      renderDaftarScene();
    } else {
      // Hentikan narasi sebelumnya jika ada
      berhenti();
      const scene = proyek.scene.find((s) => s.id === id);
      if (!scene) return;
      sceneNarasi = id;
      renderDaftarScene();
      bicarakan(scene.narasi, {
        onSelesai: () => {
          sceneNarasi = null;
          renderDaftarScene();
        },
      });
    }
  }
}

// ── Preview ──────────────────────────────────────────────────────────────────

function hentikanPreviewAktif() {
  hentikanPreview();
  previewBerjalan = false;
  jedaPreview = () => {};
  lanjutkanPreview = () => {};

  const elBtnPutar    = document.getElementById("btn-putar");
  const elBtnJeda     = document.getElementById("btn-jeda");
  const elBtnBerhenti = document.getElementById("btn-berhenti");
  const elIndikator   = document.getElementById("indikator-scene");
  const elProgres     = document.getElementById("progres-preview");

  elBtnPutar.textContent = "Putar Preview";
  elBtnPutar.disabled = false;
  elBtnJeda.disabled = true;
  elBtnBerhenti.disabled = true;
  elIndikator.textContent = "Preview dihentikan.";
  elProgres.textContent = "";
}

// ── DOMContentLoaded ─────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Ambil referensi DOM (harus setelah DOMContentLoaded)
  const elForm             = document.getElementById("form-topik");
  const elInputTopik       = document.getElementById("input-topik");
  const elBtnContoh        = document.getElementById("btn-contoh");
  const elBtnTambah        = document.getElementById("btn-tambah-scene");
  const elCanvas           = document.getElementById("canvas-preview");
  const elIndikator        = document.getElementById("indikator-scene");
  const elProgres          = document.getElementById("progres-preview");
  const elBtnPutar         = document.getElementById("btn-putar");
  const elBtnJeda          = document.getElementById("btn-jeda");
  const elBtnBerhenti      = document.getElementById("btn-berhenti");
  const elBtnRekam         = document.getElementById("btn-rekam");
  const elBtnUnduhNaskah   = document.getElementById("btn-unduh-naskah");
  const elBtnUnduhSubtitle = document.getElementById("btn-unduh-subtitle");
  const elBtnUnduhProyek   = document.getElementById("btn-unduh-proyek");
  const elBtnBukaProyek    = document.getElementById("btn-buka-proyek");
  const elInputFile        = document.getElementById("input-file-proyek");

  // Nonaktifkan tombol preview awal
  elBtnJeda.disabled = true;
  elBtnBerhenti.disabled = true;

  // ── Periksa dukungan TTS ───────────────────────────────────────────────────
  if (!dukunganTTS()) {
    tampilkanStatus(
      "Browser ini tidak mendukung pembacaan suara. Narasi tetap bisa dibaca sebagai teks."
    );
  } else {
    // Cek suara id-ID secara async (voices bisa belum dimuat saat halaman pertama buka)
    const periksaSuara = () => {
      const suara = pilihSuaraId();
      if (suara === null) {
        tampilkanStatus(
          "Suara Bahasa Indonesia tidak ditemukan di perangkat ini; memakai suara default."
        );
      }
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      periksaSuara();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", periksaSuara, { once: true });
    }
  }

  // ── Periksa dukungan MediaRecorder ────────────────────────────────────────
  if (typeof MediaRecorder === "undefined") {
    elBtnRekam.disabled = true;
    // Jangan timpa pesan TTS — tampilkan saat tombol diklik saja
  }

  // ── Muat proyek terakhir atau tampilkan form kosong ────────────────────────
  const proyekLokal = muatLokal();
  if (proyekLokal) {
    proyek = proyekLokal;
    // Sinkronisasi form dengan proyek yang dimuat
    elInputTopik.value = proyek.topik;
    const radioGaya = document.querySelector(`input[name="gaya"][value="${proyek.gaya}"]`);
    if (radioGaya) radioGaya.checked = true;
    document.getElementById("pilih-durasi").value = String(proyek.durasiTotal);
    renderDaftarScene();
    if (!dukunganTTS()) {
      // Pesan TTS sudah ditampilkan di atas — jangan timpa
    } else {
      tampilkanStatus("Proyek terakhir dimuat. Edit atau klik \"Putar Preview\".");
    }
  } else {
    tampilkanStatus("Ketik topik lalu klik \"Buat Storyboard\" untuk memulai.");
  }

  // ── Form: Coba contoh ──────────────────────────────────────────────────────
  elBtnContoh.addEventListener("click", () => {
    elInputTopik.value = "Cara Menyeduh Teh";
    document.querySelector('input[name="gaya"][value="edukasi"]').checked = true;
    document.getElementById("pilih-durasi").value = "60";
    elInputTopik.focus();
    tampilkanStatus("[Contoh] Topik contoh diisi. Klik \"Buat Storyboard\" untuk melanjutkan.");
  });

  // ── Form: Buat Storyboard ──────────────────────────────────────────────────
  elForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const topik = elInputTopik.value.trim();

    if (!topik) {
      tampilkanStatus("Tulis dulu topik videonya.");
      elInputTopik.focus();
      return;
    }
    if (topik.length > 120) {
      tampilkanStatus("Topik maksimal 120 karakter. Perpendek topiknya.");
      elInputTopik.focus();
      return;
    }

    const gaya = document.querySelector('input[name="gaya"]:checked')?.value || "edukasi";
    const durasi = Number(document.getElementById("pilih-durasi").value) || 60;

    if (previewBerjalan) hentikanPreviewAktif();
    berhenti();
    sceneNarasi = null;

    try {
      const scene = hasilkanStoryboard(topik, gaya, durasi);
      proyek = buatProyek(topik, gaya, durasi, scene);
      simpanLokal(proyek);
      renderDaftarScene();
      elIndikator.textContent = "Belum ada preview.";
      elProgres.textContent = "";
      tampilkanStatus("Storyboard dibuat. Edit scene lalu klik \"Putar Preview\".");
    } catch (err) {
      tampilkanStatus("Gagal membuat storyboard. Coba lagi.");
      console.error(err);
    }
  });

  // ── Editor: Tambah scene ───────────────────────────────────────────────────
  elBtnTambah.addEventListener("click", () => {
    if (!proyek) {
      tampilkanStatus("Buat storyboard dulu sebelum menambah scene.");
      return;
    }
    if (previewBerjalan) hentikanPreviewAktif();
    tambahScene(proyek);
    renderDaftarScene();
    tampilkanStatus("Scene baru ditambahkan.");
    document.getElementById("daftar-scene").lastElementChild?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  });

  // ── Preview: Putar ─────────────────────────────────────────────────────────
  elBtnPutar.addEventListener("click", () => {
    if (!proyek || proyek.scene.length === 0) {
      tampilkanStatus("Buat storyboard dulu sebelum memutar preview.");
      return;
    }

    if (previewBerjalan) {
      // Tombol putar = lanjutkan dari jeda
      lanjutkanPreview();
      elBtnPutar.disabled = true;
      elBtnJeda.disabled = false;
      return;
    }

    // Hentikan narasi per-scene yang mungkin sedang berjalan
    berhenti();
    sceneNarasi = null;

    previewBerjalan = true;
    elBtnPutar.textContent = "▶ Lanjut";
    elBtnPutar.disabled = true;
    elBtnJeda.disabled = false;
    elBtnBerhenti.disabled = false;

    putarPreview(elCanvas, proyek, {
      onSiap: (fnJeda, fnLanjut) => {
        jedaPreview = fnJeda;
        lanjutkanPreview = fnLanjut;
      },
      onSceneAktif: (idx) => {
        const scene = proyek.scene[idx];
        elIndikator.textContent = `Scene ${idx + 1} / ${proyek.scene.length}: ${scene.judul}`;
      },
      onProgres: (detikSisa, durasiScene) => {
        elProgres.textContent = `${detikSisa}s / ${durasiScene}s`;
      },
      onSelesai: () => {
        previewBerjalan = false;
        jedaPreview = () => {};
        lanjutkanPreview = () => {};
        elBtnPutar.textContent = "Putar Preview";
        elBtnPutar.disabled = false;
        elBtnJeda.disabled = true;
        elBtnBerhenti.disabled = true;
        elIndikator.textContent = "Preview selesai.";
        elProgres.textContent = "";
        tampilkanStatus("Preview selesai.");
      },
    });
  });

  // ── Preview: Jeda ──────────────────────────────────────────────────────────
  elBtnJeda.addEventListener("click", () => {
    if (!previewBerjalan) return;
    jedaPreview();
    elBtnPutar.disabled = false;
    elBtnPutar.textContent = "▶ Lanjut";
    elBtnJeda.disabled = true;
  });

  // ── Preview: Berhenti ──────────────────────────────────────────────────────
  elBtnBerhenti.addEventListener("click", () => {
    hentikanPreviewAktif();
    tampilkanStatus("Preview dihentikan.");
  });

  // ── Rekam & Unduh Video ────────────────────────────────────────────────────
  elBtnRekam.addEventListener("click", () => {
    if (!proyek || proyek.scene.length === 0) {
      tampilkanStatus("Buat storyboard dulu sebelum merekam video.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      tampilkanStatus(
        "Browser ini tidak mendukung perekaman video. Coba Chrome atau Edge terbaru."
      );
      return;
    }

    if (previewBerjalan) hentikanPreviewAktif();
    berhenti();
    sceneNarasi = null;

    elBtnRekam.disabled = true;
    tampilkanStatus(
      "Merekam… Catatan: suara narasi tidak terekam dalam video (keterbatasan captureStream). Tunggu hingga selesai."
    );

    mulaiRekam(elCanvas, proyek, {
      onSceneAktif: (idx) => {
        const scene = proyek.scene[idx];
        elIndikator.textContent = `Merekam scene ${idx + 1} / ${proyek.scene.length}: ${scene.judul}`;
      },
      onSelesai: () => {
        elBtnRekam.disabled = false;
        elIndikator.textContent = "Rekaman selesai.";
        elProgres.textContent = "";
        tampilkanStatus("Video selesai direkam.");
      },
      onError: (pesan) => {
        elBtnRekam.disabled = false;
        tampilkanStatus(pesan || "Gagal merekam video. Coba lagi.");
      },
    });
  });

  // ── Unduh Naskah ───────────────────────────────────────────────────────────
  elBtnUnduhNaskah.addEventListener("click", () => {
    if (!proyek) { tampilkanStatus("Buat storyboard dulu."); return; }
    try {
      const isi = keMarkdown(proyek);
      unduhTeks(`naskah-${slugTopik(proyek.topik)}.md`, isi, "text/markdown");
      tampilkanStatus("Naskah diunduh.");
    } catch {
      tampilkanStatus("Gagal mengunduh file. Coba lagi.");
    }
  });

  // ── Unduh Subtitle ─────────────────────────────────────────────────────────
  elBtnUnduhSubtitle.addEventListener("click", () => {
    if (!proyek) { tampilkanStatus("Buat storyboard dulu."); return; }
    try {
      const isi = keSRT(proyek);
      unduhTeks(`subtitle-${slugTopik(proyek.topik)}.srt`, isi, "text/plain");
      tampilkanStatus("Subtitle diunduh.");
    } catch {
      tampilkanStatus("Gagal mengunduh file. Coba lagi.");
    }
  });

  // ── Unduh Proyek ───────────────────────────────────────────────────────────
  elBtnUnduhProyek.addEventListener("click", () => {
    if (!proyek) { tampilkanStatus("Buat storyboard dulu."); return; }
    try {
      const isi = keJSON(proyek);
      unduhTeks(`proyek-${slugTopik(proyek.topik)}.json`, isi, "application/json");
      tampilkanStatus("File proyek diunduh.");
    } catch {
      tampilkanStatus("Gagal mengunduh file. Coba lagi.");
    }
  });

  // ── Buka Proyek ────────────────────────────────────────────────────────────
  elBtnBukaProyek.addEventListener("click", () => {
    elInputFile.value = "";
    elInputFile.click();
  });

  elInputFile.addEventListener("change", () => {
    const file = elInputFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const hasil = validasiProyek(data);
        if (!hasil.ok) {
          tampilkanStatus(hasil.pesan || "File ini bukan file proyek Mesin Video.");
          return;
        }
        if (previewBerjalan) hentikanPreviewAktif();
        berhenti();
        sceneNarasi = null;
        proyek = hasil.proyek;
        simpanLokal(proyek);
        // Sinkronisasi form dengan proyek yang dimuat
        elInputTopik.value = proyek.topik;
        const radioGaya = document.querySelector(`input[name="gaya"][value="${proyek.gaya}"]`);
        if (radioGaya) radioGaya.checked = true;
        document.getElementById("pilih-durasi").value = String(proyek.durasiTotal);
        renderDaftarScene();
        elIndikator.textContent = "Belum ada preview.";
        elProgres.textContent = "";
        tampilkanStatus(`Proyek "${proyek.topik}" berhasil dimuat.`);
      } catch {
        tampilkanStatus("File ini bukan file proyek Mesin Video.");
      }
    };
    reader.onerror = () => tampilkanStatus("Gagal membaca file. Coba lagi.");
    reader.readAsText(file);
  });
});

// ── Helper ────────────────────────────────────────────────────────────────────

function escapaAtribut(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapaTeks(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function slugTopik(topik) {
  return topik
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .slice(0, 40) || "proyek";
}
