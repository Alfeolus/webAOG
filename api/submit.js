// File: public/api/submit.js
// Versi ini MENGHAPUS secretKey

// (Fungsi crc16 dan generateFinalQrisString Anda tetap sama di atas)
function crc16(str) { /* ... kode sama ... */ }
function generateFinalQrisString(nominal) { /* ... kode sama ... */ }


export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  try {
    const data = request.body;

    // Ambil rahasia dari Vercel Environment Variables
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    // const MY_SECRET_KEY = process.env.MY_SECRET_KEY; // <-- HAPUS INI

    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = data.totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const finalQrisString = generateFinalQrisString(totalFinal);

    // Siapkan data untuk Google Sheet
    const sheetData = {
      nama: data.nama,
      telepon: data.telepon,
      kelas: data.kelas,
      itemsString: data.itemsString,
      totalFinal: totalFinal
      // secretKey: MY_SECRET_KEY // <-- HAPUS INI
    };
    
    // KIRIM KE GOOGLE SHEET
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    }).catch(err => {
        console.error("Gagal mengirim ke Google Sheet:", err.message);
    });

    // KIRIM BALASAN SUKSES KE FRONTEND (app.js)
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