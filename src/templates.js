// templates.js — generator storyboard berbasis aturan (tanpa LLM/API).
//
// Aturan keras (Requirement 9.1):
//   - hanya memakai teks topik pengguna + kalimat template generik
//   - template TIDAK BOLEH menyisipkan angka, tanggal, nama orang, atau kutipan
//   - deterministik: input sama → output sama
//   - jumlah durasi scene sama dengan durasi yang dipilih

// ── Palet warna per gaya ─────────────────────────────────────────────────────

const PALET_EDUKASI = [
  { warnaLatar: "#0b5fff", warnaTeks: "#ffffff" },
  { warnaLatar: "#1a73e8", warnaTeks: "#ffffff" },
  { warnaLatar: "#0d47a1", warnaTeks: "#ffffff" },
  { warnaLatar: "#283593", warnaTeks: "#ffffff" },
  { warnaLatar: "#1565c0", warnaTeks: "#ffffff" },
];

const PALET_CERITA = [
  { warnaLatar: "#2e7d32", warnaTeks: "#ffffff" },
  { warnaLatar: "#388e3c", warnaTeks: "#ffffff" },
  { warnaLatar: "#1b5e20", warnaTeks: "#ffffff" },
  { warnaLatar: "#33691e", warnaTeks: "#ffffff" },
  { warnaLatar: "#558b2f", warnaTeks: "#ffffff" },
];

const PALET_PROMO = [
  { warnaLatar: "#c62828", warnaTeks: "#ffffff" },
  { warnaLatar: "#e53935", warnaTeks: "#ffffff" },
  { warnaLatar: "#b71c1c", warnaTeks: "#ffffff" },
  { warnaLatar: "#d50000", warnaTeks: "#ffffff" },
];

// ── Data gaya: struktur + jumlah scene per durasi + pola kalimat ─────────────
//
// Pola kalimat WAJIB generik:
//   - hanya memakai {topik} sebagai placeholder (dari input pengguna)
//   - tanpa angka, tanggal, nama orang, atau kutipan
//   - {tahapan} = nama tahapan scene (Pembuka, Penjelasan, dll.)

export const GAYA = {
  edukasi: {
    struktur: ["Pembuka", "Penjelasan", "Contoh", "Penutup"],
    palet: PALET_EDUKASI,
    // jumlahScene: { durasi_detik: jumlah_scene }
    jumlahScene: { 30: 3, 60: 4, 90: 5 },
    polaNarasi: {
      Pembuka: [
        "Video ini membahas tentang {topik}.",
        "Selamat datang. Kita akan membahas {topik} bersama.",
        "Topik kita kali ini adalah {topik}. Mari kita mulai.",
      ],
      Penjelasan: [
        "Untuk memahami {topik}, penting untuk mengetahui dasar-dasarnya terlebih dahulu.",
        "Bagian ini menjelaskan konsep utama yang perlu dipahami tentang {topik}.",
        "Ada beberapa hal penting yang perlu diketahui seputar {topik}.",
      ],
      Contoh: [
        "Sebagai contoh penerapan {topik}, perhatikan langkah-langkah berikut.",
        "Contoh nyata dari {topik} dapat dilihat dari situasi sehari-hari.",
        "Untuk memperjelas {topik}, berikut ini contoh yang bisa diikuti.",
      ],
      Penutup: [
        "Itulah gambaran singkat tentang {topik}. Semoga bermanfaat.",
        "Demikian pembahasan mengenai {topik}. Periksa kembali sebelum dipublikasikan.",
        "Terima kasih telah menyimak pembahasan tentang {topik}.",
      ],
    },
  },
  cerita: {
    struktur: ["Pembuka", "Konflik", "Perubahan", "Penutup"],
    palet: PALET_CERITA,
    jumlahScene: { 30: 3, 60: 4, 90: 5 },
    polaNarasi: {
      Pembuka: [
        "Kisah ini bermula dari {topik} yang dialami oleh tokoh utama.",
        "Semuanya berawal dari satu pertanyaan sederhana tentang {topik}.",
        "Ada sebuah cerita menarik yang berhubungan dengan {topik}.",
      ],
      Konflik: [
        "Namun, perjalanan menuju pemahaman tentang {topik} tidak selalu mudah.",
        "Tantangan pun muncul saat berhadapan dengan {topik} secara langsung.",
        "Di sinilah bagian paling sulit dari {topik} mulai terasa.",
      ],
      Perubahan: [
        "Titik balik terjadi ketika sudut pandang tentang {topik} mulai bergeser.",
        "Perlahan, cara memandang {topik} berubah menjadi lebih jelas.",
        "Setelah melalui berbagai proses, pemahaman tentang {topik} semakin mendalam.",
      ],
      Penutup: [
        "Pada akhirnya, perjalanan ini mengajarkan banyak hal tentang {topik}.",
        "Kisah tentang {topik} ini menyisakan pelajaran yang berharga.",
        "Itulah cerita yang dapat kita petik dari pengalaman berkaitan dengan {topik}.",
      ],
    },
  },
  promo: {
    struktur: ["Hook", "Manfaat", "Ajakan"],
    palet: PALET_PROMO,
    jumlahScene: { 30: 3, 60: 3, 90: 4 },
    polaNarasi: {
      Hook: [
        "Apakah Anda pernah bertanya-tanya tentang {topik}?",
        "Inilah yang perlu Anda ketahui tentang {topik}.",
        "Jangan lewatkan informasi penting tentang {topik} berikut ini.",
      ],
      Manfaat: [
        "Dengan memahami {topik}, Anda dapat membuat keputusan yang lebih baik.",
        "Mengenal {topik} membuka peluang dan wawasan baru untuk Anda.",
        "Manfaat memahami {topik} dapat dirasakan langsung dalam kehidupan sehari-hari.",
      ],
      Ajakan: [
        "Segera coba dan rasakan sendiri manfaat dari {topik}.",
        "Mulai eksplorasi Anda tentang {topik} sekarang juga.",
        "Jangan tunda lagi — pelajari lebih lanjut tentang {topik} hari ini.",
      ],
    },
  },
};

// ── Fungsi murni: hasilkan storyboard ────────────────────────────────────────

/**
 * Hasilkan array Scene dari topik, gaya, dan durasi.
 * Deterministik: input sama → output sama.
 * Jumlah total durasi scene == durasi (Requirement 1.4).
 *
 * @param {string} topik
 * @param {"edukasi"|"cerita"|"promo"} gaya
 * @param {30|60|90} durasi  — durasi total dalam detik
 * @returns {Object[]} array Scene
 */
export function hasilkanStoryboard(topik, gaya, durasi) {
  const dataGaya = GAYA[gaya];
  if (!dataGaya) throw new Error(`Gaya tidak dikenal: ${gaya}`);

  const durasiAngka = Number(durasi);
  const jumlah = dataGaya.jumlahScene[durasiAngka];
  if (!jumlah) throw new Error(`Durasi tidak dikenal: ${durasi}`);

  // Ambil tahapan struktur yang akan dipakai
  // Bila jumlah scene > panjang struktur, ulangi dari awal (hanya berlaku
  // untuk gaya Edukasi/Cerita dengan 5 scene dari 4 struktur)
  const strukturPenuh = dataGaya.struktur;
  const tahapan = [];
  for (let i = 0; i < jumlah; i++) {
    tahapan.push(strukturPenuh[i % strukturPenuh.length]);
  }

  // Bagi durasi secara merata; sisa detik ke scene pertama (Requirement 1.4)
  const durasiDasar = Math.floor(durasiAngka / jumlah);
  const sisaDetik = durasiAngka - durasiDasar * jumlah;

  const scene = tahapan.map((nama, i) => {
    const palet = dataGaya.palet[i % dataGaya.palet.length];
    const pola = dataGaya.polaNarasi[nama] || [];
    // Pilih pola narasi deterministically berdasarkan indeks scene
    const narasiTemplate = pola[i % pola.length] || `Bagian ${nama} tentang {topik}.`;
    const narasi = narasiTemplate.replace(/\{topik\}/g, topik);

    return {
      id: `scene-${i + 1}`,
      judul: nama,
      narasi,
      durasi: durasiDasar + (i === 0 ? sisaDetik : 0),
      warnaLatar: palet.warnaLatar,
      warnaTeks: palet.warnaTeks,
    };
  });

  return scene;
}
