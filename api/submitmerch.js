// File: /api/submit.js
// Versi ini menggunakan "FIRE AND FORGET" (Tembak dan Lupakan)

// (Fungsi crc16 dan generateFinalQrisString Anda tetap sama di atas)
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
// --- AKHIR FUNGSI ---


export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  try {
    const data = request.body;

    // Ambil rahasia dari Vercel Environment Variables
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

    if (!GOOGLE_SCRIPT_URL) {
        throw new Error("Kesalahan Server: GOOGLE_SCRIPT_URL tidak diatur.");
    }

    // Hitung Total Final di backend
    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = data.totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Buat String QRIS Dinamis di backend
    const finalQrisString = generateFinalQrisString(totalFinal);

    // Siapkan data untuk Google Sheet (tanpa secret key)
    const sheetData = {
      nama: data.nama,
      telepon: data.telepon,
      kelas: data.kelas,
      itemsString: data.itemsString,
      totalFinal: totalFinal
    };
    
    // =======================================================
    // === INI SOLUSINYA: "FIRE AND FORGET" ===
    // (Panggilan ini terjadi di server, jadi 'mode: cors' TIDAK DIPERLUKAN)
    // =======================================================
    // Kita "tembak" data ke Google dan tidak menunggu balasan
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    }).catch(err => {
        // Jika gagal, kita tidak peduli, tapi kita catat di log Vercel
        console.error("Latar Belakang: Gagal mengirim ke Google Sheet:", err.message);
    });
    // =======================================================

    // KIRIM BALASAN SUKSES KE FRONTEND (app.js) - TANPA MENUNGGU GOOGLE
    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {
    // Ini hanya akan error jika QRIS_BASE_STRING Anda salah
    console.error("Error di /api/submit:", error.message);
    response.status(500).json({ status: "error", message: error.message });
  }
}