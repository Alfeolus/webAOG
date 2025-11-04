// File: /api/submit.js
// VERSI FINAL v3 (Paling Stabil: "Tunggu, tapi Abaikan Balasan")

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
// === FUNGSI HANDLER ===
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
    
    // Buat QRIS
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
    // === KIRIM DATA KE GOOGLE & TUNGGU (INI KUNCINYA) ===
    // =======================================================
    console.log("Mengirim data ke Google Sheet dan menunggu...");
    
    // Kita 'await' fetch, memaksa Vercel tetap hidup
    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    });

    // Kita log statusnya untuk debug di Vercel
    console.log(`Fetch ke Google selesai. Status: ${googleResponse.status}`);
    
    // !! PENTING !!
    // Kita TIDAK lagi 'await googleResponse.json()'
    // Kita TIDAK peduli balasannya HTML atau JSON,
    // karena kita tahu datanya sudah masuk.
    // Kita langsung lanjut ke langkah berikutnya.
    
    // =======================================================
    // === KIRIM BALASAN SUKSES KE FRONTEND ===
    // =======================================================
    // Kode ini HANYA akan berjalan SETELAH fetch di atas selesai.
    
    console.log("Mengirim balasan sukses (QRIS) ke frontend.");
    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {
    // Menangkap error jika QRIS_BASE_STRING hilang, 
    // atau jika fetch-nya sendiri gagal (misal Google down)
    console.error("Error Kritis di /api/submit:", error.message);
    response.status(500).json({ status: "error", message: error.message });
  }
}