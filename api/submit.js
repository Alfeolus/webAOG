// File: public/api/submit.js
// Ini adalah BACKEND BARU Anda yang berjalan di Vercel

// Fungsi CRC16 (Aman di backend)
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

// Fungsi Generator QRIS (Aman di backend)
function generateFinalQrisString(nominal) {
  // Ambil string QRIS rahasia dari Environment Variable
  const qrisBaseLama = process.env.QRIS_BASE_STRING;
  if (!qrisBaseLama) {
    throw new Error("QRIS_BASE_STRING tidak ditemukan di server.");
  }
  
  const nominalStr = String(Math.round(nominal));
  const amountTag = "54" + String(nominalStr.length).padStart(2, "0") + nominalStr;
  const qrisBaseTanpaCRC = qrisBaseLama.substring(0, qrisBaseLama.length - 8);
  const titikSisip = "5802ID";
  const indexSisip = qrisBaseTanpaCRC.indexOf(titikSisip);
  if (indexSisip === -1) {
    throw new Error("String qrisBase tidak valid");
  }
  const part1 = qrisBaseTanpaCRC.substring(0, indexSisip);
  const part2 = qrisBaseTanpaCRC.substring(indexSisip);
  let qrisNoCRC = part1 + amountTag + part2 + "6304";
  const crc = crc16(qrisNoCRC);
  return qrisNoCRC + crc;
}

// Ini adalah fungsi utama yang akan dijalankan Vercel
export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  try {
    // 1. Ambil data dari frontend (app.js)
    const data = request.body;

    // 2. Ambil rahasia dari Vercel Environment Variables
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    const MY_SECRET_KEY = process.env.MY_SECRET_KEY;

    // 3. Hitung Total Final di backend
    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = data.totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 4. Buat String QRIS Dinamis di backend
    const finalQrisString = generateFinalQrisString(totalFinal);

    // 5. Siapkan data untuk Google Sheet
    const sheetData = {
      nama: data.nama,
      telepon: data.telepon,
      kelas: data.kelas,
      itemsString: data.itemsString,
      totalFinal: totalFinal,
      secretKey: MY_SECRET_KEY 
    };
    
    // 6. KIRIM KE GOOGLE SHEET (Server-ke-Server, TIDAK AKAN GAGAL CORS)
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    }).catch(err => {
        console.error("Gagal mengirim ke Google Sheet:", err.message);
    });

    // 7. KIRIM BALASAN SUKSES KE FRONTEND (app.js)
    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {
    console.error("Error di /api/submit:", error.message);
    response.status(500).json({ status: "error", message: error.message });
  }
}