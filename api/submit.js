// File: /api/submit.js
// VERSI DEBUG (LENGKAP - dengan fungsi QRIS)

// ===================================================================
// === FUNGSI HELPER (JANGAN DIHAPUS) ===
// ===================================================================
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function generateFinalQrisString(nominal) {
  // Fungsi ini bisa error jika QRIS_BASE_STRING tidak ada
  const qrisBaseLama = process.env.QRIS_BASE_STRING;
  if (!qrisBaseLama) { throw new Error("Kesalahan Server: QRIS_BASE_STRING tidak ditemukan."); }
  
  const nominalStr = String(Math.round(nominal));
  const amountTag = "54" + String(nominalStr.length).padStart(2, "0") + nominalStr;
  const qrisBaseTanpaCRC = qrisBaseLama.substring(0, qrisBaseLama.length - 8);
  const titikSisip = "5802ID";
  const indexSisip = qrisBaseTanpaCRC.indexOf(titikSisip);
  if (indexSisip === -1) { throw new Error("Kesalahan Server: String qrisBase tidak valid"); }
  const part1 = qrisBaseTanpaCRC.substring(0, indexSisip);
  const part2 = qrisBaseTanpaCRC.substring(indexSisip);
  let qrisNoCRC = part1 + amountTag + part2 + "6304";
  const crc = crc16(qrisNoCRC);
  return qrisNoCRC + crc;
}
// --- AKHIR FUNGSI HELPER ---


// ===================================================================
// === FUNGSI HANDLER (MODE DEBUG) ===
// ===================================================================
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

  try {
    const data = request.body;
    if (!GOOGLE_SCRIPT_URL) {
      throw new Error("Kesalahan Server: GOOGLE_SCRIPT_URL tidak diatur.");
    }
    
    // Hitung Total Final
    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = data.totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Buat QRIS (Sekarang fungsi ini sudah ada di atas)
    const finalQrisString = generateFinalQrisString(totalFinal);

    // Siapkan data sheet
    const sheetData = {
      nama: data.nama,
      telepon: data.telepon,
      kelas: data.kelas,
      itemsString: data.itemsString,
      totalFinal: totalFinal
    };
    
    // =======================================================
    // === INI BAGIAN DEBUG ===
    // Kita 'await' Google SEBELUM membalas ke frontend
    // =======================================================
    console.log("Mencoba fetch ke Google Script..."); // Log tambahan
    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    });
    console.log("Fetch selesai. Status OK:", googleResponse.ok); // Log tambahan

    if (!googleResponse.ok) {
      // Jika Google error, lempar error LENGKAP
      throw new Error(`Google Script GAGAL dihubungi. Status: ${googleResponse.status} ${googleResponse.statusText}`);
    }

    const googleResult = await googleResponse.json();
    console.log("Google Result JSON:", googleResult.status); // Log tambahan

    if (googleResult.status !== "success") {
      throw new Error(`Google Script ERROR: ${googleResult.message}`);
    }
    // =======================================================
    // === AKHIR BAGIAN DEBUG ===
    // =======================================================

    // Jika sampai sini, berarti Google SUKSES.
    // Baru kita kirim balasan ke frontend.
    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {
    // Jika Vercel error ATAU Google error, errornya akan dikirim ke frontend
    console.error("Error di /api/submit (MODE DEBUG):", error.message);
    response.status(500).json({ status: "error", message: error.message });
  }
}