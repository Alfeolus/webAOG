// File: /api/submitmerch.js
// Versi ini MEMASTIKAN "referralCode" dikirim ke Google

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
  const qrisBaseLama = process.env.QRIS_BASE_STRING_MERCH; 
  if (!qrisBaseLama) { throw new Error("Kesalahan Server: QRIS_BASE_STRING_MERCH tidak ditemukan."); }
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
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  try {
    const data = request.body;
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL_MERCH; 

    if (!GOOGLE_SCRIPT_URL) {
        throw new Error("Kesalahan Server: GOOGLE_SCRIPT_URL_MERCH tidak diatur.");
    }

    // --- Validasi Sisi Server ---
    const { nama, telepon, kelas, itemsString, totalAsli, referralCode } = data; // Ambil referralCode
    const phoneRegex = /^[0-9]{8,15}$/;
    if (!nama || nama.trim().length < 3) {
      throw new Error("Nama Pemesan terlihat tidak valid.");
    }
    if (!telepon || !phoneRegex.test(telepon.replace(/\D/g,''))) { 
      throw new Error("Nomor Telepon/ID Line terlihat tidak valid.");
    }
    // --- Akhir Validasi ---

    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const finalQrisString = generateFinalQrisString(totalFinal);

    // Siapkan data untuk Google Sheet
    const sheetData = {
      nama: nama,
      telepon: telepon,
      kelas: kelas,
      itemsString: itemsString,
      totalFinal: totalFinal,
      referralCode: referralCode // <-- PASTIKAN INI ADA
    };
    
    // =======================================================
    // === KIRIM KE GOOGLE SHEET (Dengan perbaikan redirect) ===
    // =======================================================
    const initialResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: 'manual' 
    });

    let finalResponse = initialResponse;

    if (finalResponse.status === 302 || finalResponse.status === 307 || finalResponse.status === 308) {
      const redirectUrl = finalResponse.headers.get('location');
      if (redirectUrl) {
        finalResponse = await fetch(redirectUrl, {
            method: 'POST', 
            body: JSON.stringify(sheetData),
            headers: { "Content-Type": "text/plain;charset=utf-8" },
        });
      } else {
        throw new Error("Google mengirim redirect tapi tanpa URL lokasi.");
      }
    }

    if (!finalResponse.ok) {
      throw new Error(`Google Script GAGAL dihubungi. Status: ${finalResponse.statusText}`);
    }

    const googleResult = await finalResponse.json();
    if (googleResult.status !== "success") {
      throw new Error(`Google Script ERROR: ${googleResult.message}`);
    }
    // =======================================================

    // KIRIM BALASAN SUKSES KE FRONTEND (pomerch/app.js)
    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {
    console.error("Error di /api/submit-merch:", error.message);
    response.status(500).json({ status: "error", message: error.message });
  }
}