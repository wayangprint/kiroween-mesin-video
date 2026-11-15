// exporter.js — unduh paket produksi (naskah, subtitle, proyek).
//
// Requirement 6: unduh .md, .srt, .json dan buka kembali .json.
// Requirement 9.3: catatan pemeriksa fakta di akhir naskah.

import { validasiProyek } from "./storyboard.js";

// ── Unduh teks sebagai file ───────────────────────────────────────────────────

/**
 * Unduh string sebagai file di browser.
 * @param {string} namaFile
 * @param {string} isi
 * @param {string} mime  — tipe MIME (mis. "text/markdown", "text/plain", "application/json")
 */
export function unduhTeks(namaFile, isi, mime) {
  const blob = new Blob([isi], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Ekspor naskah Markdown ────────────────────────────────────────────────────

/**
 * Hasilkan naskah dalam format Markdown (Requirement 6.1).
 * Menyertakan catatan pemeriksa fakta di akhir (Requirement 9.3).
 *
 * @param {Object} proyek
 * @returns {string}
 */
export function keMarkdown(proyek) {
  const baris = [];

  baris.push(`# Naskah Video: ${proyek.topik}`);
  baris.push("");
  baris.push(`**Gaya:** ${judulGaya(proyek.gaya)}`);
  baris.push(`**Durasi target:** ${proyek.durasiTotal} detik`);
  baris.push(`**Jumlah scene:** ${proyek.scene.length}`);
  baris.push("");
  baris.push("---");
  baris.push("");

  proyek.scene.forEach((scene, idx) => {
    baris.push(`## Scene ${idx + 1}: ${scene.judul}`);
    baris.push("");
    baris.push(`**Durasi:** ${scene.durasi} detik`);
    baris.push("");
    baris.push(scene.narasi || "_[narasi belum diisi]_");
    baris.push("");
    baris.push("---");
    baris.push("");
  });

  baris.push(
    "> **Catatan:** Naskah ini dibuat dari template + topik yang Anda ketik. " +
    "Periksa fakta sebelum dipublikasikan."
  );
  baris.push("");

  return baris.join("\n");
}

// ── Ekspor subtitle SRT ───────────────────────────────────────────────────────

/**
 * Hasilkan subtitle dalam format SRT (Requirement 6.2).
 * Penanda waktu akumulasi per scene.
 *
 * @param {Object} proyek
 * @returns {string}
 */
export function keSRT(proyek) {
  const baris = [];
  let detikAkum = 0;

  proyek.scene.forEach((scene, idx) => {
    const mulai = detikAkum;
    const selesai = detikAkum + scene.durasi;

    baris.push(String(idx + 1));
    baris.push(`${formatWaktuSRT(mulai)} --> ${formatWaktuSRT(selesai)}`);
    baris.push(scene.narasi || "(tanpa narasi)");
    baris.push("");

    detikAkum = selesai;
  });

  return baris.join("\n");
}

/**
 * Format detik ke HH:MM:SS,mmm (format SRT).
 * @param {number} detik  — detik (desimal diperbolehkan)
 * @returns {string}
 */
function formatWaktuSRT(detik) {
  const totalMs = Math.round(detik * 1000);
  const ms = totalMs % 1000;
  const s = Math.floor(totalMs / 1000) % 60;
  const m = Math.floor(totalMs / 60000) % 60;
  const h = Math.floor(totalMs / 3600000);
  return (
    String(h).padStart(2, "0") + ":" +
    String(m).padStart(2, "0") + ":" +
    String(s).padStart(2, "0") + "," +
    String(ms).padStart(3, "0")
  );
}

// ── Ekspor / impor JSON ───────────────────────────────────────────────────────

/**
 * Serialisasi proyek ke string JSON (Requirement 6.3).
 * @param {Object} proyek
 * @returns {string}
 */
export function keJSON(proyek) {
  return JSON.stringify(proyek, null, 2);
}

/**
 * Parse dan validasi string JSON sebagai proyek (Requirement 6.5).
 * @param {string} teks
 * @returns {{ ok: boolean, proyek?: Object, pesan?: string }}
 */
export function dariJSON(teks) {
  try {
    const data = JSON.parse(teks);
    return validasiProyek(data);
  } catch {
    return { ok: false, pesan: "File ini bukan file proyek Mesin Video." };
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function judulGaya(gaya) {
  const peta = { edukasi: "Edukasi", cerita: "Cerita", promo: "Promo" };
  return peta[gaya] || gaya;
}
