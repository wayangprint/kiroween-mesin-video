// renderer.js — gambar scene ke canvas + preview + rekam video.
//
// Requirement 4: preview canvas 1280×720, berurutan per scene, TTS per scene.
// Requirement 5: rekam via MediaRecorder (WebM); video tanpa suara (didokumentasikan).
//
// KETERBATASAN (Req 5.5):
//   captureStream() hanya menangkap gambar canvas, bukan audio speechSynthesis.
//   Video hasil rekaman tidak bersuara — dijelaskan di README dan di area status.

import { bicarakan, berhenti, dukunganTTS } from "./tts.js";

// ── Gambar scene ke canvas ────────────────────────────────────────────────────

/**
 * Gambar satu scene ke konteks canvas 2D.
 * Tanpa gambar/aset eksternal.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} scene  — { judul, narasi, warnaLatar, warnaTeks }
 * @param {Object} proyek — { topik, scene: Scene[] }
 * @param {number} nomorScene  — nomor urut (1-based)
 * @param {number} totalScene
 * @param {number} progres   — 0.0–1.0 untuk bilah progres
 */
export function gambarScene(ctx, scene, proyek, nomorScene, totalScene, progres = 0) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  // Latar belakang
  ctx.fillStyle = scene.warnaLatar || "#0b5fff";
  ctx.fillRect(0, 0, W, H);

  // Overlay gelap di bagian bawah untuk kontras teks
  const gradien = ctx.createLinearGradient(0, H * 0.6, 0, H);
  gradien.addColorStop(0, "rgba(0,0,0,0)");
  gradien.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = gradien;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  const warnaTeks = scene.warnaTeks || "#ffffff";

  // Topik proyek (kecil, atas kiri)
  ctx.fillStyle = warnaTeks;
  ctx.globalAlpha = 0.7;
  ctx.font = `bold ${Math.round(H * 0.028)}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(potongTeks(ctx, proyek.topik, W * 0.85), W * 0.04, H * 0.04);
  ctx.globalAlpha = 1;

  // Nomor scene (atas kanan)
  ctx.fillStyle = warnaTeks;
  ctx.globalAlpha = 0.7;
  ctx.font = `${Math.round(H * 0.03)}px system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText(`${nomorScene} / ${totalScene}`, W * 0.96, H * 0.04);
  ctx.globalAlpha = 1;

  // Judul scene (besar, tengah)
  ctx.fillStyle = warnaTeks;
  ctx.font = `bold ${Math.round(H * 0.09)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(potongTeks(ctx, scene.judul, W * 0.9), W / 2, H * 0.42);

  // Narasi (lebih kecil, bawah tengah, multi-baris)
  ctx.fillStyle = warnaTeks;
  ctx.globalAlpha = 0.9;
  ctx.font = `${Math.round(H * 0.038)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const baris = bungkusTeks(ctx, scene.narasi, W * 0.82);
  const yNarasi = H * 0.6;
  const tinggiNarasi = Math.round(H * 0.045);
  baris.forEach((b, i) => {
    ctx.fillText(b, W / 2, yNarasi + i * tinggiNarasi);
  });
  ctx.globalAlpha = 1;

  // Bilah progres (bawah)
  const tinggiBar = Math.round(H * 0.012);
  const yBar = H - tinggiBar;
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(0, yBar, W, tinggiBar);
  ctx.fillStyle = warnaTeks;
  ctx.fillRect(0, yBar, W * Math.min(1, Math.max(0, progres)), tinggiBar);
}

// ── Helper teks canvas ────────────────────────────────────────────────────────

function potongTeks(ctx, teks, maxLebar) {
  if (ctx.measureText(teks).width <= maxLebar) return teks;
  let hasil = teks;
  while (hasil.length > 1 && ctx.measureText(hasil + "…").width > maxLebar) {
    hasil = hasil.slice(0, -1);
  }
  return hasil + "…";
}

function bungkusTeks(ctx, teks, maxLebar) {
  const kata = teks.split(" ");
  const baris = [];
  let barisKini = "";
  for (const k of kata) {
    const kandidat = barisKini ? `${barisKini} ${k}` : k;
    if (ctx.measureText(kandidat).width <= maxLebar) {
      barisKini = kandidat;
    } else {
      if (barisKini) baris.push(barisKini);
      barisKini = k;
    }
  }
  if (barisKini) baris.push(barisKini);
  return baris.slice(0, 3); // Maksimal 3 baris narasi di canvas
}

// ── State preview ─────────────────────────────────────────────────────────────

let _jeda = false;
let _berhentiFlag = false;
let _timeoutId = null;

function resetStatePreview() {
  _jeda = false;
  _berhentiFlag = false;
  if (_timeoutId !== null) {
    clearTimeout(_timeoutId);
    _timeoutId = null;
  }
}

/**
 * Hentikan preview (dari luar — dipanggil app.js lewat hentikanPreview()).
 */
export function hentikanPreview() {
  _berhentiFlag = true;
  _jeda = false;
  if (_timeoutId !== null) {
    clearTimeout(_timeoutId);
    _timeoutId = null;
  }
  berhenti();
}

// ── Preview berurutan ─────────────────────────────────────────────────────────

/**
 * Putar preview semua scene berurutan.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} proyek
 * @param {{
 *   onSceneAktif: (idx: number) => void,
 *   onProgres: (detikSisa: number, durasiScene: number) => void,
 *   onSelesai: () => void,
 *   onStatusTTS: (pesan: string) => void,
 *   onSiap: (fnJeda: Function, fnLanjut: Function) => void,
 * }} callbacks
 */
export function putarPreview(canvas, proyek, callbacks = {}) {
  resetStatePreview();

  const ctx = canvas.getContext("2d");
  const { onSceneAktif, onProgres, onSelesai, onStatusTTS } = callbacks;

  // Daftar jeda/lanjut yang bisa dipanggil dari app.js lewat callbacks
  let _resolveJeda = null;

  function jedaPreview() {
    _jeda = true;
    berhenti();
    if (_timeoutId !== null) {
      clearTimeout(_timeoutId);
      _timeoutId = null;
    }
  }

  function lanjutkanPreview() {
    if (!_jeda) return;
    _jeda = false;
    if (_resolveJeda) {
      _resolveJeda();
      _resolveJeda = null;
    }
  }

  // Ekspos fungsi jeda/lanjut ke app.js lewat callback onSiap
  if (callbacks.onSiap) callbacks.onSiap(jedaPreview, lanjutkanPreview);

  async function putarScene(idx) {
    if (_berhentiFlag) return;
    if (idx >= proyek.scene.length) {
      if (onSelesai) onSelesai();
      return;
    }

    const scene = proyek.scene[idx];
    const durasiMs = (scene.durasi || 5) * 1000;

    if (onSceneAktif) onSceneAktif(idx);

    // Gambar frame awal scene
    gambarScene(ctx, scene, proyek, idx + 1, proyek.scene.length, 0);

    // Mulai TTS untuk scene ini (non-blocking)
    if (dukunganTTS()) {
      bicarakan(scene.narasi, {});
    }

    // Animasi bilah progres lewat polling setiap 100ms
    const mulai = performance.now();
    await new Promise((resolve) => {
      function tick() {
        if (_berhentiFlag) {
          resolve();
          return;
        }
        if (_jeda) {
          // Simpan resolver agar lanjutkan() bisa melepasnya
          _resolveJeda = () => tick();
          return;
        }
        const lewat = performance.now() - mulai;
        const fraksi = Math.min(1, lewat / durasiMs);
        const detikSisa = Math.round(scene.durasi * (1 - fraksi));

        gambarScene(ctx, scene, proyek, idx + 1, proyek.scene.length, fraksi);
        if (onProgres) onProgres(detikSisa, scene.durasi);

        if (lewat >= durasiMs) {
          resolve();
        } else {
          _timeoutId = setTimeout(tick, 100);
        }
      }
      tick();
    });

    if (_berhentiFlag) {
      berhenti();
      // Gambar ulang scene pertama saat berhenti
      gambarScene(ctx, proyek.scene[0], proyek, 1, proyek.scene.length, 0);
      return;
    }

    berhenti(); // Hentikan TTS scene sebelumnya sebelum lanjut
    putarScene(idx + 1);
  }

  putarScene(0);
}

// ── Rekam video ────────────────────────────────────────────────────────────────

/**
 * Rekam seluruh proyek sebagai file WebM.
 * Memutar preview (gambar saja, TTS tidak terekam) lalu unduh Blob.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} proyek
 * @param {{
 *   onSceneAktif: (idx: number) => void,
 *   onSelesai: () => void,
 *   onError: (pesan: string) => void,
 * }} callbacks
 */
export function mulaiRekam(canvas, proyek, callbacks = {}) {
  const { onSceneAktif, onSelesai, onError } = callbacks;

  if (typeof MediaRecorder === "undefined") {
    if (onError) onError("Browser ini tidak mendukung perekaman video. Coba Chrome atau Edge terbaru.");
    return;
  }

  // Pilih mimeType yang didukung
  const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";

  let stream;
  try {
    stream = canvas.captureStream(30);
  } catch (e) {
    if (onError) onError("Gagal memulai perekaman canvas. Coba lagi.");
    return;
  }

  let recorder;
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
  } catch (e) {
    if (onError) onError("Gagal memulai MediaRecorder. Coba Chrome atau Edge terbaru.");
    return;
  }

  const potongan = [];
  recorder.addEventListener("dataavailable", (e) => {
    if (e.data && e.data.size > 0) potongan.push(e.data);
  });

  recorder.addEventListener("stop", () => {
    try {
      const blob = new Blob(potongan, { type: mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      if (onError) onError("Gagal mengunduh file video. Coba lagi.");
      return;
    }
    if (onSelesai) onSelesai();
  });

  recorder.start();

  // Putar semua scene tanpa TTS (hanya gambar — TTS tidak terekam)
  const ctx = canvas.getContext("2d");

  async function rekaScene(idx) {
    if (idx >= proyek.scene.length) {
      recorder.stop();
      return;
    }

    const scene = proyek.scene[idx];
    const durasiMs = (scene.durasi || 5) * 1000;

    if (onSceneAktif) onSceneAktif(idx);

    const mulai = performance.now();
    await new Promise((resolve) => {
      function tick() {
        const lewat = performance.now() - mulai;
        const fraksi = Math.min(1, lewat / durasiMs);
        gambarScene(ctx, scene, proyek, idx + 1, proyek.scene.length, fraksi);
        if (lewat >= durasiMs) {
          resolve();
        } else {
          setTimeout(tick, 50); // 20fps update visual
        }
      }
      tick();
    });

    rekaScene(idx + 1);
  }

  rekaScene(0);
}
