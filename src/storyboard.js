// storyboard.js — model data Proyek/Scene + operasi edit + penyimpanan.
//
// Tanggung jawab: satu sumber kebenaran untuk state proyek.
// Tidak menyentuh DOM — semua efek samping DOM ada di app.js.
//
// Model data:
//   Proyek { topik, gaya: "edukasi"|"cerita"|"promo",
//            durasiTotal: 30|60|90, scene: Scene[] }
//   Scene  { id, judul, narasi, durasi, warnaLatar, warnaTeks }
//
// Kunci localStorage: "mesin-video:proyek-terakhir".

const KUNCI_LOKAL = "mesin-video:proyek-terakhir";

// ── Pembuat ID unik ──────────────────────────────────────────────────────────

let _idCounter = 0;
function buatId() {
  _idCounter += 1;
  return `scene-${Date.now()}-${_idCounter}`;
}

// ── Pabrik objek ─────────────────────────────────────────────────────────────

/**
 * Buat proyek baru dari hasil hasilkanStoryboard.
 * @param {string} topik
 * @param {"edukasi"|"cerita"|"promo"} gaya
 * @param {30|60|90} durasiTotal
 * @param {Object[]} scene  — array scene dari templates.hasilkanStoryboard
 * @returns {Object} Proyek
 */
export function buatProyek(topik, gaya, durasiTotal, scene) {
  return { topik, gaya, durasiTotal, scene: scene.slice() };
}

/**
 * Buat scene kosong baru (Requirement 2.4).
 * @returns {Object} Scene
 */
export function buatSceneBaru() {
  return {
    id: buatId(),
    judul: "Scene baru",
    narasi: "",
    durasi: 5,
    warnaLatar: "#0b5fff",
    warnaTeks: "#ffffff",
  };
}

// ── Operasi mutasi ───────────────────────────────────────────────────────────

/**
 * Tambah satu scene kosong di akhir daftar (Requirement 2.4).
 * Mengembalikan proyek yang dimutasi dan menjalankan autosave.
 */
export function tambahScene(proyek) {
  proyek.scene.push(buatSceneBaru());
  simpanLokal(proyek);
  return proyek;
}

/**
 * Hapus scene berdasarkan id.
 * Tolak bila tersisa 1 scene — kembalikan pesan error (Requirement 2.6).
 * @returns {{ ok: boolean, pesan?: string }}
 */
export function hapusScene(proyek, id) {
  if (proyek.scene.length <= 1) {
    return { ok: false, pesan: "Minimal harus ada 1 scene." };
  }
  proyek.scene = proyek.scene.filter((s) => s.id !== id);
  simpanLokal(proyek);
  return { ok: true };
}

/**
 * Pindahkan scene ke atas ("naik") atau ke bawah ("turun").
 * Tidak melakukan apa-apa bila sudah di ujung.
 * @param {"naik"|"turun"} arah
 */
export function pindahScene(proyek, id, arah) {
  const idx = proyek.scene.findIndex((s) => s.id === id);
  if (idx === -1) return proyek;
  const target = arah === "naik" ? idx - 1 : idx + 1;
  if (target < 0 || target >= proyek.scene.length) return proyek;
  // Tukar posisi
  const tmp = proyek.scene[idx];
  proyek.scene[idx] = proyek.scene[target];
  proyek.scene[target] = tmp;
  simpanLokal(proyek);
  return proyek;
}

/**
 * Hitung total durasi semua scene dalam detik (Requirement 2.3).
 * @returns {number}
 */
export function totalDurasi(proyek) {
  return proyek.scene.reduce((acc, s) => acc + (Number(s.durasi) || 0), 0);
}

/**
 * Perbarui satu field scene (judul, narasi, atau durasi).
 * Autosave setelah perubahan (Requirement 2.8).
 */
export function ubahScene(proyek, id, field, nilai) {
  const scene = proyek.scene.find((s) => s.id === id);
  if (!scene) return proyek;
  if (field === "durasi") {
    const angka = parseInt(nilai, 10);
    scene.durasi = isNaN(angka) || angka < 1 ? 1 : angka;
  } else {
    scene[field] = nilai;
  }
  simpanLokal(proyek);
  return proyek;
}

// ── Penyimpanan lokal ────────────────────────────────────────────────────────

/**
 * Simpan proyek ke localStorage (autosave, Requirement 2.8 + 6.6).
 * Tangkap error bila storage diblokir/penuh — aplikasi tetap jalan.
 */
export function simpanLokal(proyek) {
  try {
    localStorage.setItem(KUNCI_LOKAL, JSON.stringify(proyek));
  } catch (e) {
    // localStorage diblokir atau penuh — dilaporkan via app.js
    console.warn("simpanLokal: gagal menyimpan ke localStorage.", e);
  }
}

/**
 * Muat proyek terakhir dari localStorage (Requirement 6.6).
 * Kembalikan null bila tidak ada atau data korup.
 * @returns {Object|null}
 */
export function muatLokal() {
  try {
    const teks = localStorage.getItem(KUNCI_LOKAL);
    if (!teks) return null;
    const data = JSON.parse(teks);
    const hasil = validasiProyek(data);
    return hasil.ok ? hasil.proyek : null;
  } catch (e) {
    return null;
  }
}

// ── Validasi proyek dari file JSON ───────────────────────────────────────────

/**
 * Validasi apakah `data` adalah proyek Mesin Video yang sah (Requirement 6.5).
 * @returns {{ ok: boolean, proyek?: Object, pesan?: string }}
 */
export function validasiProyek(data) {
  if (!data || typeof data !== "object") {
    return { ok: false, pesan: "File ini bukan file proyek Mesin Video." };
  }
  if (typeof data.topik !== "string" || !data.topik.trim()) {
    return { ok: false, pesan: "File ini bukan file proyek Mesin Video." };
  }
  if (!["edukasi", "cerita", "promo"].includes(data.gaya)) {
    return { ok: false, pesan: "File ini bukan file proyek Mesin Video." };
  }
  if (![30, 60, 90].includes(Number(data.durasiTotal))) {
    return { ok: false, pesan: "File ini bukan file proyek Mesin Video." };
  }
  if (!Array.isArray(data.scene) || data.scene.length === 0) {
    return { ok: false, pesan: "File ini bukan file proyek Mesin Video." };
  }
  for (const s of data.scene) {
    if (
      typeof s.id !== "string" ||
      typeof s.judul !== "string" ||
      typeof s.narasi !== "string" ||
      typeof s.durasi !== "number" ||
      s.durasi < 1
    ) {
      return { ok: false, pesan: "File ini bukan file proyek Mesin Video." };
    }
  }
  // Pastikan warna ada (isi default bila tidak ada — kompatibilitas mundur)
  const scene = data.scene.map((s) => ({
    id: s.id,
    judul: s.judul,
    narasi: s.narasi,
    durasi: s.durasi,
    warnaLatar: s.warnaLatar || "#0b5fff",
    warnaTeks: s.warnaTeks || "#ffffff",
  }));
  return {
    ok: true,
    proyek: {
      topik: data.topik,
      gaya: data.gaya,
      durasiTotal: Number(data.durasiTotal),
      scene,
    },
  };
}
