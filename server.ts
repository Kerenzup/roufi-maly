import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory database matching the Pinky POS schema
let db = {
  settings: {
    namaToko: "PINKY SHOP",
    alamat: "Jl. Pink Utama No. 88 Jakarta",
    logoUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300",
    pajakPersen: 11,
    diskonMemberPersen: 10,
    footerStruk: "Terima kasih telah berbelanja di Pinky Shop 🌸",
    rekeningOwner: [
      { id: "bca", bank: "BCA", nomor: "1234567890", atasNama: "Ibu Boss Owner", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BCA-1234567890" },
      { id: "mandiri", bank: "Mandiri", nomor: "0987654321", atasNama: "Ibu Boss Owner", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Mandiri-0987654321" }
    ]
  },
  users: [
    { email: "owner@usaha.com", sandi: "123456", nama: "Ibu Boss Owner", role: "Owner", cabang: "Semua Cabang" },
    { email: "admin.pst@usaha.com", sandi: "123456", nama: "Admin Pusat", role: "Admin Cabang", cabang: "Cabang Pusat" },
    { email: "admin.jkt@usaha.com", sandi: "123456", nama: "Admin JKT", role: "Admin Cabang", cabang: "Cabang Jakarta Selatan" },
    { email: "admin.bdg@usaha.com", sandi: "123456", nama: "Admin BDG", role: "Admin Cabang", cabang: "Cabang Bandung" },
    { email: "kasir.pst@usaha.com", sandi: "123456", nama: "Kasir Pusat", role: "Kasir", cabang: "Cabang Pusat" },
    { email: "kasir.jkt@usaha.com", sandi: "123456", nama: "Kasir JKT", role: "Kasir", cabang: "Cabang Jakarta Selatan" },
    { email: "kasir.bdg@usaha.com", sandi: "123456", nama: "Kasir BDG", role: "Kasir", cabang: "Cabang Bandung" }
  ],
  cabang: [
    ["PST", "Cabang Pusat", "Jl. Merdeka No. 1 Jakarta"],
    ["JKT", "Cabang Jakarta Selatan", "Jl. Senopati No. 45"],
    ["BDG", "Cabang Bandung", "Jl. Riau No. 12"]
  ],
  barang: [
    [1, "BRG001", "Blouse Pink Pastel", 75000, 70000, 120000, 25, "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=150", "Cabang Pusat"],
    [2, "BRG002", "Skater Skirt Denim", 90000, 85000, 149000, 18, "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=150", "Cabang Pusat"],
    [3, "BRG003", "Kemeja Oversized Lilac", 80000, 75000, 135000, 30, "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=150", "Cabang Jakarta Selatan"],
    [4, "BRG004", "Tas Selempang Kulit Pink", 120000, 110000, 199000, 12, "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=150", "Cabang Pusat"],
    [5, "BRG005", "Sneakers Kanvas Putih-Pink", 175000, 160000, 275000, 10, "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=150", "Cabang Bandung"]
  ],
  transaksi: [
    // [timestamp, nota, email, kasir, cabang, total, metode, item, subtotal, diskon, pajak, bayar, kembalian]
    [Date.now() - 3600000 * 2, "TXT-17180001", "kasir.pst@usaha.com", "Kasir Pusat", "Cabang Pusat", 266400, "Cash", [
      { kode: "BRG001", nama: "Blouse Pink Pastel", harga: 120000, hpp: 70000, qty: 2 }
    ], 240000, 0, 26400, 300000, 33600],
    [Date.now() - 3600000, "TXT-17180002", "kasir.jkt@usaha.com", "Kasir JKT", "Cabang Jakarta Selatan", 135000, "QRIS", [
      { kode: "BRG003", nama: "Kemeja Oversized Lilac", harga: 135000, hpp: 75000, qty: 1 }
    ], 135000, 0, 0, 135000, 0]
  ],
  opname: [
    { timestamp: Date.now() - 86400000, cabang: "Cabang Pusat", kode: "BRG001", nama: "Blouse Pink Pastel", sistem: 26, fisik: 25, selisih: -1, ket: "Barang sample display" }
  ]
};

function syncMasterBarang() {
  const masterMap = new Map();
  db.barang.forEach((b: any) => {
    if (!masterMap.has(b[1])) {
      masterMap.set(b[1], {
        nama: b[2],
        beli: b[3],
        hpp: b[4],
        jual: b[5],
        foto: b[7]
      });
    }
  });

  db.cabang.forEach((c) => {
    const branchName = c[1];
    masterMap.forEach((info, code) => {
      const exists = db.barang.find((b: any) => b[1] === code && b[8] === branchName);
      if (!exists) {
        db.barang.push([
          db.barang.length + 1,
          code,
          info.nama,
          info.beli,
          info.hpp,
          info.jual,
          10, // default stock for branch
          info.foto,
          branchName
        ]);
      }
    });
  });
}

syncMasterBarang();

// API Routes
app.post("/api/login", (req, res) => {
  const { email, sandi, shift } = req.body;
  const user = db.users.find(u => u.email === email && u.sandi === sandi);
  if (user) {
    res.json({
      s: 1,
      m: "Login Berhasil",
      email: user.email,
      nama: user.nama,
      role: user.role,
      cabang: user.cabang,
      shift: shift || "Pagi"
    });
  } else {
    // If not found in registered users, allow dynamic fallback for demo convenience or error
    res.json({ s: 0, m: "Email atau kata sandi salah. Silakan periksa kembali." });
  }
});

app.get("/api/getAwal", (req, res) => {
  syncMasterBarang();
  res.json({
    barang: db.barang,
    cabang: db.cabang,
    transaksi: db.transaksi,
    opname: db.opname,
    settings: db.settings,
    users: db.users
  });
});

app.post("/api/updateSettings", (req, res) => {
  const { namaToko, alamat, logoUrl, pajakPersen, diskonMemberPersen, footerStruk, rekeningOwner } = req.body;
  db.settings = {
    namaToko: namaToko || db.settings.namaToko,
    alamat: alamat || db.settings.alamat,
    logoUrl: logoUrl || db.settings.logoUrl,
    pajakPersen: Number(pajakPersen) || 0,
    diskonMemberPersen: Number(diskonMemberPersen) || 0,
    footerStruk: footerStruk || db.settings.footerStruk,
    rekeningOwner: rekeningOwner || db.settings.rekeningOwner
  };
  res.json({ s: 1, m: "Pengaturan toko & rekening berhasil diperbarui!" });
});

app.post("/api/simpanUser", (req, res) => {
  const { email, sandi, nama, role, cabang } = req.body;
  const existing = db.users.find(u => u.email === email);
  if (existing) {
    existing.sandi = sandi || existing.sandi;
    existing.nama = nama || existing.nama;
    existing.role = role || existing.role;
    existing.cabang = cabang || existing.cabang;
    res.json({ s: 1, m: "Data staff berhasil diperbarui!" });
  } else {
    db.users.push({ email, sandi: sandi || "123456", nama: nama || "Staff Baru", role: role || "Kasir", cabang: cabang || "Cabang Pusat" });
    res.json({ s: 1, m: "Staff baru berhasil ditambahkan!" });
  }
});

app.post("/api/hapusUser", (req, res) => {
  const { email } = req.body;
  db.users = db.users.filter(u => u.email !== email);
  res.json({ s: 1, m: "Staff berhasil dihapus dari sistem." });
});

app.post("/api/simpanBarang", (req, res) => {
  const { kode, nama, beli, hpp, jual, stok, foto, cabang, oldKode, branchStokMap } = req.body;
  const baseKode = kode || `BRG${Date.now().toString().slice(-4)}`;

  if (oldKode && oldKode !== baseKode) {
    db.barang = db.barang.filter((b: any) => b[1] !== oldKode);
  }

  db.cabang.forEach((c) => {
    const branchName = c[1];
    const existing = db.barang.find((b: any) => b[1] === baseKode && b[8] === branchName);
    const branchStokVal = branchStokMap && branchStokMap[branchName] !== undefined 
      ? Number(branchStokMap[branchName]) 
      : (branchName === (cabang || "Cabang Pusat") && stok !== undefined && stok !== "" ? Number(stok) : (existing ? existing[6] : 10));

    if (existing) {
      existing[1] = baseKode;
      existing[2] = nama || existing[2];
      existing[3] = Number(beli) || existing[3];
      existing[4] = Number(hpp) || Number(beli) || existing[4];
      existing[5] = Number(jual) || existing[5];
      existing[6] = branchStokVal;
      existing[7] = foto || existing[7];
    } else {
      db.barang.push([
        db.barang.length + 1,
        baseKode,
        nama || "Produk Baru",
        Number(beli) || 0,
        Number(hpp) || Number(beli) || 0,
        Number(jual) || 0,
        branchStokVal,
        foto || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150",
        branchName
      ]);
    }
  });

  res.json({ s: 1, m: "Barang berhasil disimpan & disesuaikan di setiap cabang!" });
});

app.post("/api/hapusBarang", (req, res) => {
  const { kode } = req.body;
  db.barang = db.barang.filter((b: any) => b[1] !== kode);
  res.json({ s: 1, m: "Barang berhasil dihapus dari semua cabang." });
});

app.post("/api/simpanCabang", (req, res) => {
  const { id, nama, alamat, oldId } = req.body;
  if (oldId) {
    const idx = db.cabang.findIndex(c => c[0] === oldId);
    if (idx !== -1) {
      db.cabang[idx] = [id || oldId, nama, alamat];
      res.json({ s: 1, m: "Data cabang berhasil diperbarui!" });
      return;
    }
  }
  db.cabang.push([id || `CBR${db.cabang.length + 1}`, nama, alamat]);
  res.json({ s: 1, m: "Cabang baru berhasil didaftarkan!" });
});

app.post("/api/hapusCabang", (req, res) => {
  const { id } = req.body;
  db.cabang = db.cabang.filter(c => c[0] !== id);
  res.json({ s: 1, m: "Cabang berhasil dihapus." });
});

app.post("/api/simpanTransaksi", (req, res) => {
  const { nota, email, kasir, cabang, total, metode, shift, item, subtotal, diskon, pajak, bayar, kembalian } = req.body;
  const timestamp = Date.now();
  db.transaksi.unshift([timestamp, nota, email, kasir, cabang, total, metode, item, subtotal, diskon, pajak, bayar, kembalian]);

  // Update stock quantities
  if (Array.isArray(item)) {
    item.forEach((cartItem: any) => {
      let found = db.barang.find((b: any) => b[1] === cartItem.kode && b[8] === cabang);
      if (!found) {
        found = db.barang.find((b: any) => b[1] === cartItem.kode);
      }
      if (found) {
        found[6] = Math.max(0, Number(found[6]) - Number(cartItem.qty));
      }
    });
  }

  res.json({ s: 1, m: "Transaksi berhasil diproses & dicatat!" });
});

app.post("/api/simpanOpname", (req, res) => {
  const { cabang, kode, nama, sistem, fisik, selisih, ket } = req.body;
  db.opname.unshift({ timestamp: Date.now(), cabang, kode, nama, sistem, fisik, selisih, ket });
  
  // Adjust stock in db.barang
  const found = db.barang.find((b: any) => b[1] === kode && b[8] === cabang);
  if (found) {
    found[6] = Number(fisik);
  }

  res.json({ s: 1, m: "Stok Opname berhasil dikirim & stok disesuaikan!" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pinky POS Server running on http://localhost:${PORT}`);
  });
}

startServer();
