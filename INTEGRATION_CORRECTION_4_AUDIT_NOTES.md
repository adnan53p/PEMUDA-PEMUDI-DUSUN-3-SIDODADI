# Integration Correction — 4 Audit Findings

Project: **PEMUDA DUSUN 3 SIDODADI**

## Status
Empat temuan integrasi frontend telah dikoreksi dalam satu pass. Backend/Supabase masih sengaja belum dipasang.

## 1. Keuangan = satu sumber transaksi
- `/keuangan`, bagian iuran/pembelanjaan, grafik, breakdown, dan jejak transaksi membaca `OperationsContext.transactions`.
- Hanya transaksi `Terverifikasi` pada kegiatan yang dipublikasikan yang masuk area publik.
- Data `financeSummary`, `monthlyFinance`, dan `publicTransactions` statis sudah dihapus dari sumber runtime.
- Kas dibedakan menjadi: pemasukan tercatat, kas di tangan Humas, kas diterima kegiatan, pengeluaran, dan saldo kas kegiatan.

## 2. Pembelanjaan -> Realisasi RAB otomatis
- `BudgetItem.realized` dihitung dari transaksi `expense` berstatus `Terverifikasi` dengan `activityId + category` yang sama.
- Humas mencatat pembelian sekali; setelah Admin verifikasi, realisasi RAB Admin dan publik ikut berubah.
- Form pembelanjaan Humas membawa kategori RAB, vendor, qty, harga satuan, metode bayar, dan bukti.

## 3. Target Iuran -> Pembayaran -> Status target
- Target iuran mempunyai `targetId` dan terikat ke `assignmentId` Humas.
- Humas memilih target, bukan mengetik nama pelaku/pembayar bebas.
- Status target diturunkan dari transaksi: Belum Ditagih / Menunggu Verifikasi / Belum Lunas / Sudah Bayar.
- Pending + verified dihitung untuk mencegah pencatatan melebihi sisa target.
- Transaksi Ditolak/Dibatalkan tidak mengunci target sehingga dapat diperbaiki.

## 4. Admin Activities + Superadmin CMS -> Website publik
### Admin Kegiatan
- Activity state yang sama dipakai Admin dan publik.
- Admin dapat publish/unpublish kegiatan.
- Fase kegiatan yang diubah Admin langsung tercermin pada halaman publik selama sesi prototype.
- `/kegiatan`, detail kegiatan, dokumentasi, homepage kegiatan, dan keuangan per kegiatan membaca selector dari `OperationsContext`.

### Superadmin CMS
`SiteContentContext` sekarang benar-benar menghubungkan prototype CMS ke website selama sesi:
- Konten Hero -> Homepage
- Tampil/sembunyi section -> Homepage
- Design token -> CSS website
- Navigasi -> Navbar
- Dokumen publik -> `/keabsahan`
- Identitas nama/lokasi/email -> Navbar/Footer

## Verification
- TypeScript/TSX syntax parse: PASS (70 files)
- Project internal type audit dengan declaration stubs: PASS
- Relative import resolution: PASS
- Full `npm ci` / production build tidak dapat disertifikasi di environment ini karena instalasi dependency eksternal timeout.

## Prototype limitation
Semua data masih in-memory. Refresh browser akan mengembalikan initial demo data. Persistensi, real-time multi-device, Auth production, Storage, dan RLS baru dilakukan ketika Supabase diaktifkan.
