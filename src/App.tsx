import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Scale, 
  BarChart3, 
  Building2, 
  LogOut, 
  Printer, 
  Plus, 
  Trash2, 
  Store,
  RefreshCw,
  Settings,
  HelpCircle,
  ShieldCheck,
  Users,
  TrendingUp,
  PieChart,
  CheckCircle,
  AlertCircle,
  Edit3,
  Download,
  CreditCard,
  Clock,
  UserCheck
} from 'lucide-react';

interface User {
  email: string;
  nama: string;
  role: string; // 'Owner', 'Admin Cabang', 'Kasir'
  cabang: string; // 'Semua Cabang' or specific branch name
  shift: string;
  loginTime: string;
}

interface CartItem {
  kode: string;
  nama: string;
  harga: number;
  hpp: number;
  qty: number;
}

interface Rekening {
  id: string;
  bank: string;
  nomor: string;
  atasNama: string;
  qrisUrl: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'barang' | 'opname' | 'laporan' | 'audit' | 'cabang' | 'staff' | 'settings' | 'panduan'>('pos');
  
  // Login form state
  const [emailInput, setEmailInput] = useState('owner@usaha.com');
  const [sandiInput, setSandiInput] = useState('123456');
  const [shiftInput, setShiftInput] = useState('Pagi');

  // Database state
  const [barangList, setBarangList] = useState<any[]>([]);
  const [cabangList, setCabangList] = useState<any[]>([]);
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [opnameList, setOpnameList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    namaToko: "PINKY SHOP",
    alamat: "Jl. Pink Utama No. 88 Jakarta",
    logoUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300",
    pajakPersen: 11,
    diskonMemberPersen: 10,
    footerStruk: "Terima kasih telah berbelanja di Pinky Shop 🌸",
    rekeningOwner: [
      { id: "bca", bank: "BCA", nomor: "1234567890", atasNama: "Ibu Boss Owner", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BCA-1234567890" },
      { id: "mandiri", bank: "Mandiri", nomor: "0987654321", atasNama: "Ibu Boss Owner", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Mandiri-0987654321" }
    ] as Rekening[]
  });

  // Settings form state
  const [setNamaToko, setSetNamaToko] = useState('');
  const [setAlamat, setSetAlamat] = useState('');
  const [setLogoUrl, setSetLogoUrl] = useState('');
  const [setPajak, setSetPajak] = useState('');
  const [setDiskonMember, setSetDiskonMember] = useState('');
  const [setFooter, setSetFooter] = useState('');
  const [rekeningList, setRekeningList] = useState<Rekening[]>([]);

  // New Bank Account Form
  const [newBank, setNewBank] = useState('');
  const [newNoRek, setNewNoRek] = useState('');
  const [newAtasNama, setNewAtasNama] = useState('');

  // Staff form state & edit state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffSandi, setStaffSandi] = useState('');
  const [staffNama, setStaffNama] = useState('');
  const [staffRole, setStaffRole] = useState('Kasir');
  const [staffCabang, setStaffCabang] = useState('Cabang Pusat');
  const [editingStaffEmail, setEditingStaffEmail] = useState<string | null>(null);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodeBayar, setMetodeBayar] = useState('Cash');
  const [uangBayar, setUangBayar] = useState<number>(0);
  const [selectedRekeningId, setSelectedRekeningId] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [useTax, setUseTax] = useState(true);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showStrukModal, setShowStrukModal] = useState(false);

  // New Item Form state
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newBeli, setNewBeli] = useState('');
  const [newHpp, setNewHpp] = useState('');
  const [newJual, setNewJual] = useState('');
  const [newStok, setNewStok] = useState('');
  const [newFoto, setNewFoto] = useState('');
  const [editingItemKode, setEditingItemKode] = useState<string | null>(null);
  const [branchStokMap, setBranchStokMap] = useState<{ [cabang: string]: number }>({});

  // Opname state
  const [opKode, setOpKode] = useState('');
  const [opSistem, setOpSistem] = useState(0);
  const [opFisik, setOpFisik] = useState(0);
  const [opKet, setOpKet] = useState('');

  // Branch Form & edit state
  const [cId, setCId] = useState('');
  const [cNama, setCNama] = useState('');
  const [cAlamat, setCAlamat] = useState('');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  // Report filters
  const [reportBranchFilter, setReportBranchFilter] = useState('ALL');
  const [reportPeriodFilter, setReportPeriodFilter] = useState('ALL'); // ALL, daily, monthly, yearly

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/getAwal');
      const data = await res.json();
      setBarangList(data.barang || []);
      setCabangList(data.cabang || []);
      setTransaksiList(data.transaksi || []);
      setOpnameList(data.opname || []);
      setUsersList(data.users || []);
      if (data.settings) {
        setSettings(data.settings);
        setSetNamaToko(data.settings.namaToko);
        setSetAlamat(data.settings.alamat);
        setSetLogoUrl(data.settings.logoUrl);
        setSetPajak(String(data.settings.pajakPersen));
        setSetDiskonMember(String(data.settings.diskonMemberPersen));
        setSetFooter(data.settings.footerStruk);
        if (data.settings.rekeningOwner) {
          setRekeningList(data.settings.rekeningOwner);
        }
      }
    } catch (e) {
      console.error("Gagal memuat data", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, sandi: sandiInput, shift: shiftInput })
      });
      const data = await res.json();
      if (data.s === 1) {
        const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        setUser({
          email: data.email,
          nama: data.nama,
          role: data.role,
          cabang: data.cabang,
          shift: data.shift || shiftInput,
          loginTime
        });
      } else {
        alert(data.m || "Gagal Autentikasi");
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi server.");
    } finally {
      setLoading(false);
    }
  };

  const tambahKeKeranjang = (kode: string, nama: string, harga: number, hpp: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.kode === kode);
      if (existing) {
        return prev.map(item => item.kode === kode ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { kode, nama, harga, hpp, qty: 1 }];
    });
  };

  // Calculations
  const subtotal = cart.reduce((acc, curr) => acc + (curr.harga * curr.qty), 0);
  const diskonAmount = isMember ? Math.round(subtotal * (settings.diskonMemberPersen / 100)) : 0;
  const afterDiscount = Math.max(0, subtotal - diskonAmount);
  const pajakAmount = useTax ? Math.round(afterDiscount * (settings.pajakPersen / 100)) : 0;
  const grandTotal = afterDiscount + pajakAmount;
  const kembalian = uangBayar - grandTotal >= 0 ? uangBayar - grandTotal : 0;

  const prosesBayar = async () => {
    if (cart.length === 0) return alert("Keranjang belanja masih kosong!");
    const finalUangBayar = metodeBayar === 'Cash' ? (uangBayar || grandTotal) : grandTotal;
    if (metodeBayar === 'Cash' && finalUangBayar < grandTotal) {
      return alert("Uang tunai kurang dari total belanja!");
    }

    const selectedRekeningObj = rekeningList.find(r => `${r.bank} - ${r.nomor} a.n ${r.atasNama}` === selectedRekeningId || r.id === selectedRekeningId) || rekeningList[0];
    const metodeText = metodeBayar === 'QRIS' && selectedRekeningObj 
      ? `QRIS - ${selectedRekeningObj.bank} (${selectedRekeningObj.nomor} a.n ${selectedRekeningObj.atasNama})` 
      : metodeBayar;

    const nota = "TXT-" + Date.now();
    const payload = {
      nota,
      email: user?.email,
      kasir: user?.nama,
      cabang: user?.cabang,
      total: grandTotal,
      subtotal,
      diskon: diskonAmount,
      pajak: pajakAmount,
      metode: metodeText,
      shift: user?.shift,
      item: cart,
      bayar: metodeBayar === 'Cash' ? finalUangBayar : grandTotal,
      kembalian: metodeBayar === 'Cash' ? (finalUangBayar - grandTotal) : 0,
      rekeningOwnerInfo: selectedRekeningObj || null
    };

    try {
      const res = await fetch('/api/simpanTransaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.s === 1) {
        setLastReceipt({ ...payload, timestamp: Date.now() });
        setShowStrukModal(true);
        setCart([]);
        setUangBayar(0);
        setIsMember(false);
        fetchData();
      } else {
        alert("Gagal memproses transaksi");
      }
    } catch (e) {
      alert("Error saat menyimpan transaksi");
    }
  };

  const simpanBarang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newJual) return alert("Nama dan Harga Jual wajib diisi!");
    
    try {
      const res = await fetch('/api/simpanBarang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: newKode || `BRG${Date.now().toString().slice(-4)}`,
          nama: newNama,
          beli: newBeli,
          hpp: newHpp || newBeli,
          jual: newJual,
          stok: newStok || 10,
          foto: newFoto || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150',
          cabang: user?.cabang,
          oldKode: editingItemKode,
          branchStokMap
        })
      });
      const data = await res.json();
      alert(data.m);
      setNewKode('');
      setNewNama('');
      setNewBeli('');
      setNewHpp('');
      setNewJual('');
      setNewStok('');
      setNewFoto('');
      setEditingItemKode(null);
      setBranchStokMap({});
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan barang");
    }
  };

  const handleEditBarang = (b: any) => {
    setNewKode(b[1]);
    setNewNama(b[2]);
    setNewBeli(String(b[3]));
    setNewHpp(String(b[4]));
    setNewJual(String(b[5]));
    setNewFoto(b[7]);
    setEditingItemKode(b[1]);

    const stockMap: any = {};
    cabangList.forEach(c => {
      const found = barangList.find(item => item[1] === b[1] && item[8] === c[1]);
      stockMap[c[1]] = found ? found[6] : 10;
    });
    setBranchStokMap(stockMap);
  };

  const handleHapusBarang = async (kode: string) => {
    if (!confirm(`Hapus barang ${kode} dari semua cabang?`)) return;
    try {
      const res = await fetch('/api/hapusBarang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (e) {
      alert("Gagal menghapus barang");
    }
  };

  const simpanCabang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNama) return alert("Nama cabang wajib diisi!");
    try {
      const res = await fetch('/api/simpanCabang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: cId || `CBR${Date.now().toString().slice(-3)}`, 
          nama: cNama, 
          alamat: cAlamat,
          oldId: editingBranchId 
        })
      });
      const data = await res.json();
      alert(data.m);
      setCId('');
      setCNama('');
      setCAlamat('');
      setEditingBranchId(null);
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan cabang");
    }
  };

  const handleEditBranch = (c: any) => {
    setCId(c[0]);
    setCNama(c[1]);
    setCAlamat(c[2]);
    setEditingBranchId(c[0]);
  };

  const handleHapusBranch = async (id: string) => {
    if (!confirm(`Hapus cabang ${id}?`)) return;
    try {
      const res = await fetch('/api/hapusCabang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (e) {
      alert("Gagal menghapus cabang");
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/updateSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaToko: setNamaToko,
          alamat: setAlamat,
          logoUrl: setLogoUrl,
          pajakPersen: setPajak,
          diskonMemberPersen: setDiskonMember,
          footerStruk: setFooter,
          rekeningOwner: rekeningList
        })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (err) {
      alert("Gagal memperbarui pengaturan");
    }
  };

  const tambahRekening = () => {
    if (!newBank || !newNoRek) return alert("Nama Bank dan Nomor Rekening wajib diisi!");
    const newRek: Rekening = {
      id: newBank.toLowerCase() + Date.now().toString().slice(-3),
      bank: newBank,
      nomor: newNoRek,
      atasNama: newAtasNama || user?.nama || "Owner",
      qrisUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newBank}-${newNoRek}`
    };
    const updated = [...rekeningList, newRek];
    setRekeningList(updated);
    setNewBank('');
    setNewNoRek('');
    setNewAtasNama('');
  };

  const hapusRekening = (id: string) => {
    setRekeningList(rekeningList.filter(r => r.id !== id));
  };

  const handleSimpanStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail || !staffNama) return alert("Email dan Nama staff wajib diisi!");
    try {
      const res = await fetch('/api/simpanUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: staffEmail,
          sandi: staffSandi || "123456",
          nama: staffNama,
          role: staffRole,
          cabang: staffCabang,
          oldEmail: editingStaffEmail
        })
      });
      const data = await res.json();
      alert(data.m);
      setStaffEmail('');
      setStaffSandi('');
      setStaffNama('');
      setEditingStaffEmail(null);
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan data staff");
    }
  };

  const handleEditStaff = (u: any) => {
    setStaffEmail(u.email);
    setStaffSandi(u.sandi);
    setStaffNama(u.nama);
    setStaffRole(u.role);
    setStaffCabang(u.cabang);
    setEditingStaffEmail(u.email);
  };

  const handleHapusStaff = async (email: string) => {
    if (!confirm(`Hapus akun staff ${email}?`)) return;
    try {
      const res = await fetch('/api/hapusUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus staff");
    }
  };

  const handleOpnameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setOpKode(selectedCode);
    const found = barangList.find(b => b[1] === selectedCode);
    if (found) {
      setOpSistem(Number(found[6]) || 0);
      setOpFisik(Number(found[6]) || 0);
    } else {
      setOpSistem(0);
      setOpFisik(0);
    }
  };

  const simpanOpname = async () => {
    if (!opKode) return alert("Pilih barang terlebih dahulu!");
    const found = barangList.find(b => b[1] === opKode);
    if (!found) return;

    try {
      const res = await fetch('/api/simpanOpname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabang: user?.cabang,
          kode: opKode,
          nama: found[2],
          sistem: opSistem,
          fisik: opFisik,
          selisih: opFisik - opSistem,
          ket: opKet
        })
      });
      const data = await res.json();
      alert(data.m);
      setOpKet('');
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan opname");
    }
  };

  // Export Audit Stock Opname to Excel Workbook (.csv format)
  const downloadExcelOpname = () => {
    const filteredOpname = opnameList.filter(op => user?.role === 'Owner' || op.cabang === user?.cabang);
    if (filteredOpname.length === 0) return alert("Tidak ada data audit untuk diunduh.");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Waktu Audit,Cabang,Kode Barang,Nama Produk,Stok Sistem,Stok Fisik,Selisih,Keterangan\n";

    filteredOpname.forEach(op => {
      const timeStr = new Date(op.timestamp).toLocaleString();
      const row = `"${timeStr}","${op.cabang}","${op.kode}","${op.nama}",${op.sistem},${op.fisik},${op.selisih},"${op.ket || '-'}"`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Audit_Stock_Opname_${user?.cabang || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fff0f5] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-pink-100">
          <div className="mb-4">
            <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 rounded-full object-cover mx-auto shadow-md border-2 border-pink-300" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-bold text-[#ff3377] mb-2 tracking-tight">🌸 {settings.namaToko} 🌸</h2>
          <p className="text-gray-500 text-sm mb-6">Sistem Kasir POS & Manajemen Butik Multi-Cabang</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Email Akun (Login)</label>
              <input 
                type="email" 
                value={emailInput} 
                onChange={e => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6699] focus:outline-none"
                placeholder="email@usaha.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Kata Sandi</label>
              <input 
                type="password" 
                value={sandiInput} 
                onChange={e => setSandiInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6699] focus:outline-none"
                placeholder="******"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Shift Kerja</label>
              <select 
                value={shiftInput} 
                onChange={e => setShiftInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6699] focus:outline-none bg-white"
              >
                <option value="Pagi">Shift Pagi (08:00 - 15:00)</option>
                <option value="Siang">Shift Siang (15:00 - 22:00)</option>
                <option value="Malam">Shift Malam / Full</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white font-medium py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Masuk & Catat Jam Masuk 📝"}
            </button>
          </form>
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p><b>Owner (Superadmin):</b> owner@usaha.com / 123456</p>
            <p><b>Admin Cabang:</b> admin.pst@usaha.com | admin.jkt@usaha.com</p>
            <p><b>Kasir Cabang:</b> kasir.pst@usaha.com | kasir.jkt@usaha.com</p>
          </div>
        </div>
      </div>
    );
  }

  // Branch access control for POS and Barang
  const filteredBarangForPos = barangList.filter(b => b && (user.role === 'Owner' || b[8] === user.cabang));

  // Strict branch financial report isolation
  // Owner can filter by any branch. Admin Cabang and Kasir can ONLY see their own branch.
  const actualBranchFilter = user.role === 'Owner' ? reportBranchFilter : user.cabang;

  const filteredTransaksi = transaksiList.filter(t => {
    // t format: [timestamp, nota, email, kasir, cabang, total, metode, item, subtotal, diskon, pajak, bayar, kembalian]
    const branchMatch = actualBranchFilter === 'ALL' || t[4] === actualBranchFilter;
    const tTime = Number(t[0]);
    const now = Date.now();
    let periodMatch = true;
    if (reportPeriodFilter === 'daily') {
      const oneDay = 86400000;
      periodMatch = (now - tTime) <= oneDay;
    } else if (reportPeriodFilter === 'monthly') {
      const oneMonth = 86400000 * 30;
      periodMatch = (now - tTime) <= oneMonth;
    } else if (reportPeriodFilter === 'yearly') {
      const oneYear = 86400000 * 365;
      periodMatch = (now - tTime) <= oneYear;
    }
    return branchMatch && periodMatch;
  });

  const totalOmset = filteredTransaksi.reduce((acc, curr) => acc + Number(curr[5] || 0), 0);
  const totalPajak = filteredTransaksi.reduce((acc, curr) => acc + Number(curr[10] || 0), 0);
  const totalDiskon = filteredTransaksi.reduce((acc, curr) => acc + Number(curr[9] || 0), 0);
  
  let totalLaba = 0;
  let cashTotal = 0;
  let qrisTotal = 0;
  filteredTransaksi.forEach(t => {
    const metode = t[6];
    const totalVal = Number(t[5] || 0);
    if (metode && metode.startsWith('QRIS')) qrisTotal += totalVal;
    else cashTotal += totalVal;

    const items = t[7];
    if (Array.isArray(items)) {
      items.forEach((it: any) => {
        const itemHpp = Number(it.hpp || it.harga * 0.7);
        totalLaba += (Number(it.harga) - itemHpp) * Number(it.qty);
      });
    } else {
      totalLaba += totalVal * 0.3;
    }
  });

  const filteredOpname = opnameList.filter(op => user.role === 'Owner' || op.cabang === user.cabang);
  const filteredBarang = barangList.filter(b => user.role === 'Owner' || b[8] === user.cabang);

  return (
    <div className="min-h-screen bg-[#fff0f5] flex font-sans text-gray-800">
      {/* Sidebar with wider, prominent logo */}
      <div className="w-72 bg-[#ff6699] text-white flex flex-col p-5 shadow-lg shrink-0">
        <div className="flex flex-col items-center justify-center mb-4 text-center">
          <img src={settings.logoUrl} alt="Logo" className="w-full h-28 object-cover rounded-xl shadow-md border-2 border-white mb-2" referrerPolicy="no-referrer" />
          <h3 className="text-xl font-bold tracking-tight">{settings.namaToko}</h3>
        </div>
        <div className="text-center mb-5 text-xs bg-white/10 p-3 rounded-xl backdrop-blur-sm space-y-1">
          <b className="text-sm font-semibold">{user.nama}</b> ({user.role})<br/>
          <span className="inline-block px-2.5 py-0.5 bg-white text-gray-900 rounded font-bold text-xs">{user.cabang}</span>
          <div className="text-white/90 text-[11px] flex items-center justify-center gap-1 pt-1">
            <Clock className="w-3 h-3"/> Masuk: {user.loginTime} | Shift: {user.shift}
          </div>
        </div>
        <hr className="border-white/20 mb-4" />

        <nav className="space-y-1.5 flex-1 text-sm">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'pos' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
          >
            <ShoppingCart className="w-4 h-4" /> Kasir POS
          </button>
          
          {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
            <button 
              onClick={() => setActiveTab('barang')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'barang' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
            >
              <Package className="w-4 h-4" /> Kelola Barang
            </button>
          )}

          {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
            <button 
              onClick={() => setActiveTab('opname')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'opname' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
            >
              <Scale className="w-4 h-4" /> Stok Opname
            </button>
          )}

          <button 
            onClick={() => setActiveTab('laporan')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'laporan' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
          >
            <BarChart3 className="w-4 h-4" /> Lap. Keuangan Analitik
          </button>

          {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
            <button 
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'audit' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
            >
              <ShieldCheck className="w-4 h-4" /> Audit Stok Opname
            </button>
          )}

          {user.role === 'Owner' && (
            <>
              <button 
                onClick={() => setActiveTab('cabang')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'cabang' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
              >
                <Building2 className="w-4 h-4" /> Kelola Cabang
              </button>
              <button 
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'staff' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
              >
                <Users className="w-4 h-4" /> Kelola Staff & Akses
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
              >
                <Settings className="w-4 h-4" /> Pengaturan Toko & Bank
              </button>
            </>
          )}

          <button 
            onClick={() => setActiveTab('panduan')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'panduan' ? 'bg-[#ff3377] text-white shadow' : 'text-white/90 hover:bg-[#ff3377]/60'}`}
          >
            <HelpCircle className="w-4 h-4" /> Panduan & Cara Pakai
          </button>
        </nav>

        <button 
          onClick={() => setUser(null)}
          className="mt-auto w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow transition-colors"
        >
          <LogOut className="w-4 h-4" /> Keluar / Log Out
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        
        {/* TAB POS */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100">
                <h5 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Pilih Produk ({user.cabang})
                </h5>
                {filteredBarangForPos.length === 0 ? (
                  <p className="text-gray-400 p-6 text-center">Stok produk kosong di cabang ini. Tambahkan di menu Kelola Barang.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto p-1">
                    {filteredBarangForPos.map((b, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                        <img 
                          src={b[7] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150'} 
                          alt={b[2]}
                          className="w-full h-28 object-cover rounded-lg mb-2"
                          referrerPolicy="no-referrer"
                        />
                        <h6 className="font-semibold text-sm text-gray-800 line-clamp-1">{b[2]}</h6>
                        <span className="text-xs text-gray-500 mb-1">Stok: {b[6]} ({b[8]})</span>
                        <span className="text-sm font-bold text-[#ff3377] mb-2">Rp {Number(b[5] || 0).toLocaleString()}</span>
                        <button 
                          onClick={() => tambahKeKeranjang(b[1], b[2], Number(b[5] || 0), Number(b[4] || b[3] || 0))}
                          className="mt-auto w-full bg-[#ff6699] hover:bg-[#ff3377] text-white text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Beli
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100 sticky top-6">
                <h5 className="text-[#ff3377] font-bold text-lg mb-4">Keranjang Belanja</h5>
                
                <div className="max-h-48 overflow-y-auto mb-4 border border-gray-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-pink-50 text-gray-600 text-xs">
                      <tr>
                        <th className="p-2 text-left">Nama</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2 text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cart.length === 0 ? (
                        <tr><td colSpan={4} className="text-center text-gray-400 py-6 text-xs">Keranjang kosong</td></tr>
                      ) : (
                        cart.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">{item.nama}</td>
                            <td className="p-2 text-center">{item.qty}</td>
                            <td className="p-2 text-right font-semibold">{(item.harga * item.qty).toLocaleString()}</td>
                            <td className="p-2 text-center">
                              <button 
                                onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Options: Member Discount & Tax */}
                <div className="space-y-2 mb-4 bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={isMember} 
                      onChange={e => setIsMember(e.target.checked)}
                      className="rounded text-[#ff6699] focus:ring-[#ff6699]"
                    />
                    <span>Diskon Member ({settings.diskonMemberPersen}%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={useTax} 
                      onChange={e => setUseTax(e.target.checked)}
                      className="rounded text-[#ff6699] focus:ring-[#ff6699]"
                    />
                    <span>Pajak PPN ({settings.pajakPersen}%)</span>
                  </label>
                </div>

                {/* Calculation breakdown */}
                <div className="space-y-1 mb-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <div className="flex justify-between"><span>Subtotal:</span> <span>Rp {subtotal.toLocaleString()}</span></div>
                  {isMember && <div className="flex justify-between text-green-600 font-medium"><span>Diskon Member ({settings.diskonMemberPersen}%):</span> <span>- Rp {diskonAmount.toLocaleString()}</span></div>}
                  {useTax && <div className="flex justify-between"><span>Pajak PPN ({settings.pajakPersen}%):</span> <span>+ Rp {pajakAmount.toLocaleString()}</span></div>}
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-base font-bold text-[#ff3377]">
                    <span>Total Tagihan:</span>
                    <span>Rp {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Metode Bayar</label>
                    <select 
                      value={metodeBayar} 
                      onChange={e => setMetodeBayar(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="Cash">Tunai / Cash</option>
                      <option value="QRIS">QRIS (Rekening Owner)</option>
                    </select>
                  </div>

                  {metodeBayar === 'Cash' ? (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-600">Uang Tunai (Rp)</label>
                        <button 
                          type="button" 
                          onClick={() => setUangBayar(grandTotal)}
                          className="text-[11px] text-[#ff3377] font-bold hover:underline"
                        >
                          [Uang Pas]
                        </button>
                      </div>
                      <input 
                        type="number" 
                        value={uangBayar || ''} 
                        onChange={e => setUangBayar(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Contoh: 100000"
                      />
                      <div className="mt-1 text-xs text-gray-500 font-medium flex justify-between">
                        <span>Kembalian:</span>
                        <span className={`font-bold ${uangBayar === grandTotal ? 'text-blue-600' : 'text-green-600'}`}>
                          {uangBayar === grandTotal ? 'Uang Pas (Rp 0)' : `Rp ${kembalian.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-3 border border-pink-300 rounded-xl bg-pink-50/50">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Pilih Rekening Tujuan Owner:</p>
                      <select 
                        value={selectedRekeningId} 
                        onChange={e => setSelectedRekeningId(e.target.value)}
                        className="w-full mb-3 px-3 py-1.5 text-xs border border-gray-300 rounded bg-white"
                      >
                        <option value="">-- Pilih Bank / QRIS Owner --</option>
                        {settings.rekeningOwner?.map((rek: any, idx: number) => (
                          <option key={idx} value={`${rek.bank} - ${rek.nomornomer || rek.nomor} a.n ${rek.atasNama}`}>
                            {rek.bank} ({rek.nomor}) - {rek.atasNama}
                          </option>
                        ))}
                      </select>
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PinkyPOS-Owner-QRIS" 
                        alt="QRIS Owner" 
                        className="w-24 h-24 mx-auto rounded shadow-xs mb-1"
                      />
                      <span className="text-[11px] text-gray-500">Scan QRIS untuk langsung ke rekening owner</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={prosesBayar}
                  className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white font-medium py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Proses & Cetak Struk 🖨️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB KELOLA BARANG */}
        {activeTab === 'barang' && (user.role === 'Owner' || user.role === 'Admin Cabang') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Kelola & Tambah Item Barang ({user.cabang})
            </h4>

            <form onSubmit={simpanBarang} className="space-y-4 mb-8 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              {editingItemKode && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-xs flex justify-between items-center font-medium">
                  <span>Sedang Mengedit Barang Kode: <b>{editingItemKode}</b> (Stok dapat disesuaikan per cabang di bawah)</span>
                  <button type="button" onClick={() => { setEditingItemKode(null); setNewKode(''); setNewNama(''); setNewBeli(''); setNewHpp(''); setNewJual(''); setNewStok(''); setNewFoto(''); setBranchStokMap({}); }} className="text-blue-900 underline font-bold">
                    Batal Edit
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Kode Barang</label>
                  <input type="text" value={newKode} onChange={e => setNewKode(e.target.value)} placeholder="Contoh: BRG010" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Barang</label>
                  <input type="text" value={newNama} onChange={e => setNewNama(e.target.value)} placeholder="Nama Produk" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Harga Beli</label>
                  <input type="number" value={newBeli} onChange={e => setNewBeli(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">HPP</label>
                  <input type="number" value={newHpp} onChange={e => setNewHpp(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Harga Jual</label>
                  <input type="number" value={newJual} onChange={e => setNewJual(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
                </div>
                {!editingItemKode && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Stok Awal</label>
                    <input type="number" value={newStok} onChange={e => setNewStok(e.target.value)} placeholder="10" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  </div>
                )}
                <div className={editingItemKode ? "md:col-span-3" : "md:col-span-2"}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Link URL Gambar (Opsional)</label>
                  <input type="text" value={newFoto} onChange={e => setNewFoto(e.target.value)} placeholder="https://images.unsplash.com/..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              {editingItemKode && (
                <div className="bg-white p-3 rounded-lg border border-pink-200">
                  <label className="text-xs font-bold text-gray-700 block mb-2">Penyesuaian Stok Masing-Masing Cabang:</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {cabangList.map((c, i) => (
                      <div key={i}>
                        <label className="text-[11px] text-gray-500 block mb-0.5">{c[1]}</label>
                        <input 
                          type="number" 
                          value={branchStokMap[c[1]] !== undefined ? branchStokMap[c[1]] : 10} 
                          onChange={e => setBranchStokMap({ ...branchStokMap, [c[1]]: Number(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button type="submit" className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingItemKode ? 'Perbarui Barang & Stok Cabang 💾' : 'Simpan Barang Baru 📦'}
                </button>
              </div>
            </form>

            <h5 className="text-[#ff3377] font-bold text-base mb-3">Tabel Master Barang ({user.cabang})</h5>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">Gambar</th>
                    <th className="p-3">Kode</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3">Harga Beli</th>
                    <th className="p-3">HPP</th>
                    <th className="p-3">Harga Jual</th>
                    <th className="p-3 text-center">Stok</th>
                    <th className="p-3">Lokasi Cabang</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBarang.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-6 text-gray-400">Belum ada data barang.</td></tr>
                  ) : (
                    filteredBarang.map((b, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3">
                          <img src={b[7] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150'} alt="" className="w-10 h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        </td>
                        <td className="p-3 font-mono text-xs">{b[1]}</td>
                        <td className="p-3 font-medium">{b[2]}</td>
                        <td className="p-3">Rp {Number(b[3] || 0).toLocaleString()}</td>
                        <td className="p-3">Rp {Number(b[4] || 0).toLocaleString()}</td>
                        <td className="p-3 font-semibold text-[#ff3377]">Rp {Number(b[5] || 0).toLocaleString()}</td>
                        <td className="p-3 text-center font-bold">{b[6]}</td>
                        <td className="p-3"><span className="px-2 py-1 bg-pink-100 text-[#ff3377] text-xs rounded-full font-medium">{b[8]}</span></td>
                        <td className="p-3 text-center flex items-center justify-center gap-1.5">
                          <button onClick={() => handleEditBarang(b)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => handleHapusBarang(b[1])} className="bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB OPNAME */}
        {activeTab === 'opname' && (user.role === 'Owner' || user.role === 'Admin Cabang') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 max-w-4xl mx-auto">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5" /> Stok Opname ({user.cabang})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Pilih Barang</label>
                <select 
                  value={opKode} 
                  onChange={handleOpnameChange}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">-- Pilih Barang --</option>
                  {filteredBarang.map((b, idx) => (
                    <option key={idx} value={b[1]}>{b[2]} (Stok Sistem: {b[6]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Stok Sistem</label>
                <input type="number" value={opSistem} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Stok Fisik</label>
                <input type="number" value={opFisik} onChange={e => setOpFisik(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Selisih</label>
                <input type="number" value={opFisik - opSistem} readOnly className={`w-full px-3 py-2 border rounded-lg text-sm font-bold ${opFisik - opSistem < 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`} />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Keterangan / Alasan Selisih</label>
                <input type="text" value={opKet} onChange={e => setOpKet(e.target.value)} placeholder="Contoh: Barang rusak / hilang" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="md:col-span-2 lg:col-span-3 text-right">
                <button 
                  onClick={simpanOpname}
                  className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow transition-colors"
                >
                  Kirim Opname ⚖️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB LAPORAN KEUANGAN ANALITIK */}
        {activeTab === 'laporan' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Laporan Keuangan Analitik {user.role !== 'Owner' ? `(${user.cabang})` : ''}
            </h4>

            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              {user.role === 'Owner' ? (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Filter Cabang (Konsolidasi Owner)</label>
                  <select 
                    value={reportBranchFilter} 
                    onChange={e => setReportBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="ALL">🌐 Semua Cabang (Konsolidasi)</option>
                    {cabangList.map((c, i) => (
                      <option key={i} value={c[1]}>{c[1]}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Cabang Laporan (Terkunci)</label>
                  <input type="text" value={user.cabang} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium" />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Periode Analisis</label>
                <select 
                  value={reportPeriodFilter} 
                  onChange={e => setReportPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value="ALL">Semua Waktu</option>
                  <option value="daily">Harian (24 Jam Terakhir)</option>
                  <option value="monthly">Bulanan (30 Hari Terakhir)</option>
                  <option value="yearly">Tahunan (365 Hari Terakhir)</option>
                </select>
              </div>
            </div>

            {/* Analytical Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#ff6699] to-[#ff3377] text-white p-4 rounded-2xl shadow">
                <h5 className="text-xs font-medium opacity-90 mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/> Total Omset</h5>
                <h3 className="text-lg font-bold">Rp {totalOmset.toLocaleString()}</h3>
              </div>
              <div className="bg-pink-50 text-[#ff3377] p-4 rounded-2xl border border-pink-100 shadow-xs">
                <h5 className="text-xs font-medium opacity-90 mb-1">Perkiraan Laba Bersih</h5>
                <h3 className="text-lg font-bold">Rp {Math.round(totalLaba).toLocaleString()}</h3>
              </div>
              <div className="bg-white text-gray-800 p-4 rounded-2xl border border-gray-200 shadow-xs">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Pajak PPN (11%)</h5>
                <h3 className="text-lg font-bold text-gray-800">Rp {totalPajak.toLocaleString()}</h3>
              </div>
              <div className="bg-white text-gray-800 p-4 rounded-2xl border border-gray-200 shadow-xs">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Diskon Member</h5>
                <h3 className="text-lg font-bold text-gray-800">Rp {totalDiskon.toLocaleString()}</h3>
              </div>
              <div className="bg-white text-gray-800 p-4 rounded-2xl border border-gray-200 shadow-xs">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Metode Bayar (Cash / QRIS)</h5>
                <div className="text-xs font-semibold text-gray-700 mt-1">
                  Cash: Rp {cashTotal.toLocaleString()}<br/>
                  QRIS: Rp {qrisTotal.toLocaleString()}
                </div>
              </div>
            </div>

            <h5 className="text-[#ff3377] font-bold text-base mb-3">Histori Transaksi Analitik ({filteredTransaksi.length} Transaksi)</h5>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Nota</th>
                    <th className="p-3">Kasir</th>
                    <th className="p-3">Cabang</th>
                    <th className="p-3">Subtotal</th>
                    <th className="p-3">Diskon</th>
                    <th className="p-3">Pajak</th>
                    <th className="p-3">Total Tagihan</th>
                    <th className="p-3">Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransaksi.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-6 text-gray-400">Belum ada transaksi tercatat untuk filter ini.</td></tr>
                  ) : (
                    filteredTransaksi.map((t, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 text-xs text-gray-500">{new Date(t[0]).toLocaleString()}</td>
                        <td className="p-3 font-mono font-medium text-xs">{t[1]}</td>
                        <td className="p-3">{t[3]}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-pink-100 text-[#ff3377] text-xs rounded font-medium">{t[4]}</span></td>
                        <td className="p-3">Rp {Number(t[8] || t[5] || 0).toLocaleString()}</td>
                        <td className="p-3 text-green-600">- Rp {Number(t[9] || 0).toLocaleString()}</td>
                        <td className="p-3">+ Rp {Number(t[10] || 0).toLocaleString()}</td>
                        <td className="p-3 font-bold text-[#ff3377]">Rp {Number(t[5] || 0).toLocaleString()}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">{t[6]}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB AUDIT STOK OPNAME */}
        {activeTab === 'audit' && (user.role === 'Owner' || user.role === 'Admin Cabang') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-[#ff3377] font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Laporan Audit Stok Opname ({user.cabang})
                </h4>
                <p className="text-xs text-gray-500">Riwayat pemeriksaan fisik dan audit selisih stok barang.</p>
              </div>
              <button 
                onClick={downloadExcelOpname}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-medium shadow flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Download Excel Workbook (.csv) 📊
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">Waktu Audit</th>
                    <th className="p-3">Cabang</th>
                    <th className="p-3">Kode Barang</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3 text-center">Stok Sistem</th>
                    <th className="p-3 text-center">Stok Fisik</th>
                    <th className="p-3 text-center">Selisih</th>
                    <th className="p-3">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOpname.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-6 text-gray-400">Belum ada data audit stok opname.</td></tr>
                  ) : (
                    filteredOpname.map((op, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 text-xs text-gray-500">{new Date(op.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-medium">{op.cabang}</td>
                        <td className="p-3 font-mono text-xs">{op.kode}</td>
                        <td className="p-3 font-semibold">{op.nama}</td>
                        <td className="p-3 text-center">{op.sistem}</td>
                        <td className="p-3 text-center">{op.fisik}</td>
                        <td className={`p-3 text-center font-bold ${op.selisih < 0 ? 'text-red-600' : op.selisih > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {op.selisih > 0 ? `+${op.selisih}` : op.selisih}
                        </td>
                        <td className="p-3 text-xs text-gray-600">{op.ket || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB KELOLA CABANG */}
        {activeTab === 'cabang' && user.role === 'Owner' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Daftar & Kelola Cabang Butik
            </h4>

            <form onSubmit={simpanCabang} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Kode Cabang</label>
                <input type="text" value={cId} onChange={e => setCId(e.target.value)} placeholder="Contoh: CBR04" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Cabang</label>
                <input type="text" value={cNama} onChange={e => setCNama(e.target.value)} placeholder="Contoh: Cabang Surabaya" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Alamat Cabang</label>
                <input type="text" value={cAlamat} onChange={e => setCAlamat(e.target.value)} placeholder="Jl. Tunjungan No. 10" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                {editingBranchId && (
                  <button type="button" onClick={() => { setEditingBranchId(null); setCId(''); setCNama(''); setCAlamat(''); }} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                    Batal Edit
                  </button>
                )}
                <button type="submit" className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingBranchId ? 'Perbarui Cabang' : 'Daftarkan Cabang Baru'} 🏢
                </button>
              </div>
            </form>

            <h5 className="text-[#ff3377] font-bold text-base mb-3">Daftar Cabang Aktif</h5>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">ID Cabang</th>
                    <th className="p-3">Nama Cabang</th>
                    <th className="p-3">Alamat</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cabangList.map((c, idx) => (
                    <tr key={idx} className="hover:bg-pink-50/20">
                      <td className="p-3 font-mono font-medium">{c[0]}</td>
                      <td className="p-3 font-bold text-[#ff3377]">{c[1]}</td>
                      <td className="p-3 text-gray-600">{c[2]}</td>
                      <td className="p-3 text-center flex items-center justify-center gap-2">
                        <button onClick={() => handleEditBranch(c)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleHapusBranch(c[0])} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB KELOLA STAFF & AKSES */}
        {activeTab === 'staff' && user.role === 'Owner' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Kelola Akun Staff, Kasir & Hak Akses Berjenjang
            </h4>
            <p className="text-xs text-gray-500 mb-6">Atur username (email), password, peran (Owner / Admin Cabang / Kasir), dan penugasan cabang masing-masing staff.</p>

            <form onSubmit={handleSimpanStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email / Username Login</label>
                <input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} placeholder="staff@usaha.com" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Kata Sandi</label>
                <input type="text" value={staffSandi} onChange={e => setStaffSandi(e.target.value)} placeholder="123456" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap Staff</label>
                <input type="text" value={staffNama} onChange={e => setStaffNama(e.target.value)} placeholder="Nama Staff" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Hak Akses / Peran</label>
                <select value={staffRole} onChange={e => setStaffRole(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                  <option value="Kasir">Kasir</option>
                  <option value="Admin Cabang">Admin Cabang</option>
                  <option value="Owner">Owner (Superadmin)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Penugasan Cabang</label>
                <select value={staffCabang} onChange={e => setStaffCabang(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                  <option value="Semua Cabang">Semua Cabang (Owner)</option>
                  {cabangList.map((c, i) => (
                    <option key={i} value={c[1]}>{c[1]}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                {editingStaffEmail && (
                  <button type="button" onClick={() => { setEditingStaffEmail(null); setStaffEmail(''); setStaffSandi(''); setStaffNama(''); }} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                    Batal Edit
                  </button>
                )}
                <button type="submit" className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingStaffEmail ? 'Perbarui Akun Staff' : 'Tambah Akun Staff Baru'} 👤
                </button>
              </div>
            </form>

            <h5 className="text-[#ff3377] font-bold text-base mb-3">Daftar Akun Staff Terdaftar</h5>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">Nama Staff</th>
                    <th className="p-3">Email / Username</th>
                    <th className="p-3">Sandi</th>
                    <th className="p-3">Peran / Hak Akses</th>
                    <th className="p-3">Cabang Tugas</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map((u, idx) => (
                    <tr key={idx} className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">{u.nama}</td>
                      <td className="p-3 font-mono text-xs text-gray-600">{u.email}</td>
                      <td className="p-3 font-mono text-xs">••••••</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'Owner' ? 'bg-purple-100 text-purple-700' : u.role === 'Admin Cabang' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-[#ff3377]'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-xs font-medium">{u.cabang}</td>
                      <td className="p-3 text-center flex items-center justify-center gap-2">
                        <button onClick={() => handleEditStaff(u)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        {u.email !== 'owner@usaha.com' && (
                          <button onClick={() => handleHapusStaff(u.email)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB PENGATURAN TOKO & REKENING OWNER */}
        {activeTab === 'settings' && user.role === 'Owner' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 max-w-4xl mx-auto">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Pengaturan Toko & Daftar Rekening Owner
            </h4>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Toko / Butik</label>
                  <input type="text" value={setNamaToko} onChange={e => setSetNamaToko(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Alamat Utama</label>
                  <input type="text" value={setAlamat} onChange={e => setSetAlamat(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">URL Logo Toko (Perbesar Tampilan)</label>
                  <input type="text" value={setLogoUrl} onChange={e => setSetLogoUrl(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Pajak PPN (%)</label>
                  <input type="number" value={setPajak} onChange={e => setSetPajak(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Diskon Member (%)</label>
                  <input type="number" value={setDiskonMember} onChange={e => setSetDiskonMember(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Footer Struk Belanja</label>
                  <input type="text" value={setFooter} onChange={e => setSetFooter(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              {/* Daftar Rekening Owner untuk QRIS */}
              <div className="bg-pink-50/40 p-4 rounded-xl border border-pink-100">
                <h5 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#ff3377]" /> Daftar Rekening & QRIS Owner
                </h5>
                <p className="text-xs text-gray-500 mb-4">Rekening bank dan QRIS ini akan otomatis terhubung saat kasir memilih pembayaran QRIS di POS.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <input type="text" value={newBank} onChange={e => setNewBank(e.target.value)} placeholder="Nama Bank (BCA/Mandiri)" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  <input type="text" value={newNoRek} onChange={e => setNewNoRek(e.target.value)} placeholder="Nomor Rekening" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  <input type="text" value={newAtasNama} onChange={e => setNewAtasNama(e.target.value)} placeholder="Atas Nama Pemilik" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <button type="button" onClick={tambahRekening} className="mb-4 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Tambah Rekening Owner
                </button>

                <div className="space-y-2">
                  {rekeningList.map((rek, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center text-xs">
                      <div>
                        <b>{rek.bank}</b> - {rek.nomor} (a.n {rek.atasNama})
                      </div>
                      <button type="button" onClick={() => hapusRekening(rek.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white py-3 rounded-xl font-medium shadow transition-colors">
                Simpan Semua Pengaturan Toko & Rekening 💾
              </button>
            </form>
          </div>
        )}

        {/* TAB PANDUAN */}
        {activeTab === 'panduan' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 max-w-3xl mx-auto space-y-4">
            <h4 className="text-[#ff3377] font-bold text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5" /> Panduan Penggunaan Sistem Pinky POS
            </h4>
            <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
              <p><b>1. Hak Akses Berjenjang (Role):</b><br/>
              - <b>Owner (Superadmin):</b> Memiliki akses penuh melihat laporan konsolidasi seluruh cabang, mengatur rekening owner, menambah/mengedit staff & cabang, serta pengaturan toko.<br/>
              - <b>Admin Cabang:</b> Mengelola stok barang, opname, dan laporan keuangan khusus cabang tempatnya bertugas.<br/>
              - <b>Kasir:</b> Melakukan transaksi POS, melihat katalog produk cabang, dan mencetak struk belanja. Laporan keuangan cabang bersifat rahasia dan tidak dapat dibaca oleh cabang lain.</p>

              <p><b>2. Pembayaran & QRIS Terhubung Rekening Owner:</b><br/>
              Saat melakukan transaksi di Kasir POS, kasir dapat memilih pembayaran Cash (dengan perhitungan kembalian otomatis & tombol Uang Pas) atau QRIS yang otomatis terhubung ke daftar rekening bank owner yang diatur di menu Pengaturan.</p>

              <p><b>3. Audit Stok Opname & Export Excel:</b><br/>
              Admin Cabang atau Owner dapat melakukan opname fisik stok dan mengunduh laporan audit selisih stok ke dalam format Excel Workbook (.csv) dengan satu klik.</p>
            </div>
          </div>
        )}

      </div>

      {/* STRUK MODAL */}
      {showStrukModal && lastReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-pink-100">
            <div className="mb-2">
              <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover mx-auto shadow border border-pink-200" referrerPolicy="no-referrer" />
              <h4 className="font-bold text-base text-[#ff3377] mt-1">{settings.namaToko}</h4>
              <p className="text-[11px] text-gray-500">{settings.alamat}</p>
            </div>
            <div className="text-left text-xs text-gray-600 border-b border-t border-dashed border-gray-300 py-2 my-2 space-y-0.5">
              <p>Nota: <b>{lastReceipt.nota}</b></p>
              <p>Waktu: {new Date(lastReceipt.timestamp).toLocaleString()}</p>
              <p>Kasir: {lastReceipt.kasir} ({lastReceipt.shift})</p>
              <p>Cabang: {lastReceipt.cabang}</p>
            </div>

            <div className="text-left text-xs space-y-1 mb-3 max-h-40 overflow-y-auto">
              {lastReceipt.item.map((it: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{it.nama} x{it.qty}</span>
                  <span>Rp {(it.harga * it.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="text-right text-xs border-t border-gray-200 pt-2 space-y-1 text-gray-700">
              <div className="flex justify-between"><span>Subtotal:</span><span>Rp {lastReceipt.subtotal.toLocaleString()}</span></div>
              {lastReceipt.diskon > 0 && <div className="flex justify-between text-green-600"><span>Diskon Member:</span><span>- Rp {lastReceipt.diskon.toLocaleString()}</span></div>}
              {lastReceipt.pajak > 0 && <div className="flex justify-between"><span>PPN:</span><span>+ Rp {lastReceipt.pajak.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-sm text-[#ff3377] pt-1">
                <span>Total:</span>
                <span>Rp {lastReceipt.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between"><span>Bayar ({lastReceipt.metode}):</span><span>Rp {lastReceipt.bayar.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Kembalian:</span><span>Rp {lastReceipt.kembalian.toLocaleString()}</span></div>
            </div>

            <p className="text-[11px] text-gray-500 italic mt-4">{settings.footerStruk}</p>

            <button 
              onClick={() => { window.print(); setShowStrukModal(false); }}
              className="mt-4 w-full bg-[#ff6699] hover:bg-[#ff3377] text-white py-2 rounded-xl text-xs font-medium shadow flex items-center justify-center gap-1"
            >
              <Printer className="w-4 h-4" /> Cetak Struk 🖨️
            </button>
            <button 
              onClick={() => setShowStrukModal(false)}
              className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-xl text-xs font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
