// tts.js — pembungkus Web Speech API (speechSynthesis).
//
// Requirement 3: narasi per scene dibacakan lewat suara sistem browser.
// Tanggung jawab: satu SpeechSynthesisUtterance per scene, lang "id-ID",
// rate 1, fallback suara default bila id-ID tidak tersedia.

/**
 * Periksa apakah Web Speech API tersedia di browser ini.
 * @returns {boolean}
 */
export function dukunganTTS() {
  return "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/**
 * Pilih suara dengan bahasa id-* dari daftar suara tersedia.
 * Kembalikan null bila tidak ada (Requirement 3.5).
 * @returns {SpeechSynthesisVoice|null}
 */
export function pilihSuaraId() {
  if (!dukunganTTS()) return null;
  const suara = window.speechSynthesis.getVoices();
  // Cari suara yang lang-nya diawali "id" (mis. id-ID, id_ID)
  return suara.find((v) => v.lang.toLowerCase().startsWith("id")) || null;
}

/**
 * Bacakan teks menggunakan speechSynthesis.
 * Satu panggilan = satu SpeechSynthesisUtterance.
 *
 * @param {string} teks  — teks yang akan dibacakan
 * @param {{ onSelesai?: Function }} opsi
 */
export function bicarakan(teks, opsi = {}) {
  if (!dukunganTTS()) return;

  // Hentikan ucapan sebelumnya agar tidak menumpuk
  window.speechSynthesis.cancel();

  const ucapan = new SpeechSynthesisUtterance(teks);
  ucapan.lang = "id-ID";
  ucapan.rate = 1;

  // Pilih suara id-ID bila tersedia; biarkan null agar browser pakai default
  const suara = pilihSuaraId();
  if (suara) ucapan.voice = suara;

  if (opsi.onSelesai) {
    ucapan.addEventListener("end", opsi.onSelesai, { once: true });
    ucapan.addEventListener("error", opsi.onSelesai, { once: true });
  }

  window.speechSynthesis.speak(ucapan);
}

/**
 * Hentikan semua ucapan yang sedang atau akan berjalan (Requirement 3.3).
 */
export function berhenti() {
  if (dukunganTTS()) window.speechSynthesis.cancel();
}
