
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
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  try {
    const data = request.body;

    const { nama, telepon, kelas, itemsString, totalAsli } = data;

    // Cek apakah nama terlalu pendek
    if (!nama || nama.trim().length < 3) {
      throw new Error("Nama kamu ga valid nih.");
    }
    
    // Cek apakah nomor telepon hanya angka dan minimal 8 digit
    const phoneRegex = /^[0-9]{8,}$/;
    if (!telepon || !phoneRegex.test(telepon.replace(/\D/g, ''))) { // Menghapus spasi/tanda +
      throw new Error("Nomor Telepon kelihatannya tidak valid.");
    }

    // Cek apakah kelas dipilih
    if (!kelas) {
        throw new Error("Kelas wajib dipilih.");
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    if (!GOOGLE_SCRIPT_URL) {
        throw new Error("Kesalahan Server: GOOGLE_SCRIPT_URL tidak diatur.");
    }

    // Hitung Total Final di backend
    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Buat String QRIS Dinamis di backend
    const finalQrisString = generateFinalQrisString(totalFinal);

    const sheetData = {
      nama: nama,
      telepon: telepon,
      kelas: kelas,
      itemsString: itemsString,
      totalFinal: totalFinal
    };
    

    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    });

    if (!googleResponse.ok) {
      throw new Error(`Google Script GAGAL dihubungi. Status: ${googleResponse.statusText}`);
    }
    const googleResult = await googleResponse.json();
    if (googleResult.status !== "success") {
      throw new Error(`Google Script ERROR: ${googleResult.message}`);
    }

    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {

    console.error("Error di /api/submit:", error.message);
    response.status(400).json({ status: "error", message: error.message });
  }
}