# PRE-SUPABASE HARDENING — PEMUDA DUSUN 3 SIDODADI

Status: **Prototype frontend terintegrasi, belum menggunakan Supabase/backend.**

Dokumen ini merangkum hardening yang dilakukan sebelum fase backend agar alur role, kegiatan, iuran, pembelanjaan, kas, laporan, LPJ, CMS, dan website publik memakai aturan yang konsisten.

## 1. Integritas kegiatan & LPJ

- Kegiatan tidak dapat dipindahkan ke status **Selesai** sebelum LPJ berstatus **Disahkan**.
- Saat LPJ disahkan, kegiatan otomatis menjadi **Selesai** dan `financialLocked` aktif.
- Setelah terkunci, transaksi baru, perubahan RAB, dan perubahan finansial ditolak.
- Admin dapat **Buka Kunci untuk Koreksi** dengan alasan; aksi masuk audit trail dan kegiatan kembali ke fase LPJ.

## 2. Iuran Humas

- Iuran **tidak menunggu verifikasi Admin satu per satu**.
- Setelah Humas mencatat iuran, transaksi langsung menjadi **Diterima Humas**.
- Target warga langsung diperbarui menjadi **Belum Lunas** atau **Sudah Bayar**.
- Nilai iuran menambah **Kas di Tangan Humas**, bukan langsung Kas Kegiatan.
- Koreksi/pembatalan iuran tidak menghapus histori transaksi; alasan dan referensi koreksi dipertahankan.
- Koreksi iuran ditolak bila akan membuat kas Humas lebih kecil daripada kas yang sudah terikat pada serah-terima/pengeluaran yang sah.

## 3. Target iuran

- Target warga terhubung ke kegiatan dan assignment Humas.
- Humas memilih target; nama pembayar tidak diketik bebas.
- Target duplikat dalam kegiatan dicegah lintas Humas.
- Target yang sudah memiliki histori transaksi tidak dapat dihapus sembarangan.
- Admin dapat menambah target satu per satu atau import CSV/XLSX.
- Tersedia peringatan jika jumlah target warga tidak sama dengan target nominal assignment Humas.

## 4. Kas Humas & serah-terima

- **Kas di Tangan Humas** dipisahkan dari **Kas Kegiatan**.
- Serah-terima kas menggunakan alur **Menunggu Konfirmasi Admin → Diterima Kas Kegiatan**.
- Nama Admin penerima/konfirmasi dicatat.
- Konfirmasi serah kas ditolak bila saldo Kas Humas sudah berubah dan tidak lagi mencukupi nominal yang diajukan.
- Humas memiliki fitur rekonsiliasi/tutup kas untuk membandingkan saldo sistem dengan uang fisik.
- Pembatalan serah kas terverifikasi ditolak bila dana tersebut sudah dipakai dari Kas Kegiatan.

## 5. Pembelanjaan / pengeluaran

- Pembelanjaan tetap membutuhkan verifikasi Admin.
- Data pembelanjaan mencakup kategori RAB, vendor, qty, harga satuan, total, metode pembayaran, bukti, dan sumber dana.
- Sumber dana: **Kas Kegiatan, Kas Humas, Uang Pribadi/Reimburse, Uang Muka, Lainnya**.
- Realisasi RAB berasal dari transaksi pembelanjaan terverifikasi.
- Sistem memberi peringatan jika verifikasi pembelanjaan akan membuat realisasi melewati RAB.
- Pengeluaran yang dibiayai Kas Humas mengurangi Kas Humas; pengeluaran activity-funded memengaruhi Kas Kegiatan.

## 6. RAB & kepanitiaan

- Admin dapat tambah/ubah/hapus item RAB dengan proteksi terhadap data realisasi dan lock kegiatan.
- Admin dapat mengelola kepanitiaan kegiatan.
- Perubahan RAB, kepanitiaan, assignment, kegiatan, dan transaksi penting masuk audit trail.

## 7. Pemasukan non-iuran

Admin dapat mencatat pemasukan organisasi/kegiatan selain iuran, misalnya:

- Sponsor
- Donasi
- Bantuan Desa
- Hasil Usaha
- Pendapatan Kegiatan
- Lainnya

Pemasukan yang sudah sah menjadi bagian dari sumber transaksi yang sama untuk laporan dan tampilan publik.

## 8. Laporan profesional

- PDF individual tetap tersedia sebagai bukti transaksi.
- Fitur utama laporan adalah ekspor kolektif berdasarkan filter aktif.
- Tersedia **Download Semua PDF**, **Download XLSX**, dan **Bagikan PDF**.
- Filter dapat mencakup kegiatan, Humas, RT/wilayah, periode, jenis transaksi, dan status.
- Total laporan menggunakan transaksi yang diakui/sah; pending/ditolak/dibatalkan tidak dicampur ke total sah.
- PDF kolektif berformat A4 landscape multi-page, memiliki identitas organisasi, filter, rekap, detail transaksi, dan nomor halaman.
- XLSX dibuat sebagai workbook Excel sungguhan; data teks dinetralisasi untuk mengurangi risiko formula injection.
- Android/web share menggunakan Web Share API dengan fallback download.

## 9. LPJ

- Draft LPJ dapat dibentuk dari data kegiatan, kepanitiaan, RAB, pemasukan, pengeluaran, dan transaksi yang sama.
- LPJ dapat melalui status Draft → Siap Diajukan → Disahkan.
- Pengesahan LPJ menjadi titik penguncian kegiatan.

## 10. Superadmin / CMS

Superadmin tetap dipisahkan dari operasional Admin dan difokuskan pada Website Management/CMS:

- Konten Homepage
- Tampilan/brand
- Navigasi publik
- Dokumen publik
- Identitas website
- Akun Admin

Alur pengelolaan konten diarahkan ke **Draft → Preview → Publish**, bukan perubahan produksi langsung tanpa kontrol.

## 11. Website publik

- Homepage tidak menampilkan rincian keuangan; transparansi ada di `/keuangan`.
- `/keuangan` membaca sumber transaksi operasional yang sama.
- Tampilan publik membedakan pemasukan tercatat, Kas di Tangan Humas, Kas Kegiatan, pengeluaran activity-funded, dan reimburse.
- Hanya data yang memang layak dipublikasikan yang ditampilkan; identitas pembayar iuran tidak otomatis dibuka ke publik.
- Kegiatan publik berasal dari sumber kegiatan operasional yang sama dan mengikuti status publikasi.

## 12. Audit trail

Audit item mendukung metadata seperti:

- actor / actor ID
- waktu
- entity type
- entity ID
- reason
- deskripsi aksi

Transaksi finansial tidak dihapus permanen sebagai cara normal untuk memperbaiki kesalahan.

## 13. Status label

Status internal handover yang memakai state teknis `Menunggu Verifikasi` ditampilkan kepada pengguna sebagai **Menunggu Konfirmasi Admin** agar sesuai alur bisnis.

## 14. Validasi yang dilakukan

Pada source final hardening:

- TypeScript internal audit dengan stub dependency sementara: **PASS**.
- `transpileModule` TypeScript/TSX: **PASS — 77 file**.
- Relative local import resolver: **PASS**.
- Tidak ditemukan `href="#"` interaktif.
- Tidak ada `node_modules` di paket final.
- Runtime test PDF kolektif: terbaca sebagai **PDF 1.4**.
- Runtime test XLSX: terbaca sebagai **Microsoft Excel 2007+** dan berhasil dibuka dengan `openpyxl`.
- ZIP final diuji dengan `unzip -t` setelah packaging.

### Build penuh

Full `npm run build` **belum dapat disertifikasi di environment pengerjaan ini** karena dependency project tidak tersedia lengkap dan proses instalasi dependency eksternal timeout. Ini bukan klaim bahwa build gagal karena source; setelah ZIP dibuka di PC, tetap jalankan:

```bash
npm install
npm run build
```

dan perbaiki bila runtime toolchain lokal menemukan masalah.

## 15. Sengaja belum dikerjakan — fase backend nanti

Atas instruksi pemilik proyek, **Supabase belum dipasang**. Yang masih deferred:

- Supabase Auth
- PostgreSQL/database persistence
- Row Level Security (RLS)
- [SUPERSEDED] Supabase Storage untuk bukti/PDF/foto — keputusan final memakai ImageKit untuk foto/bukti dan YouTube/Google Drive untuk video.
- persistence lintas refresh/perangkat
- offline sync durable + idempotency
- push notification produksi
- server-verifiable QR/report verification

Prototype saat ini masih berbasis state frontend dan reset saat browser direfresh.
