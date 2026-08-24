# Public Finance — Iuran & Pembelanjaan

- `/keuangan` sekarang memiliki section khusus **Iuran & Pembelanjaan**.
- Data membaca `OperationsContext`, sumber transaksi yang sama dengan workspace Humas/Admin.
- Hanya transaksi `Terverifikasi` yang tampil ke publik.
- Nama pembayar iuran tidak ditampilkan; wilayah, petugas, kegiatan, waktu, dan nominal tetap transparan.
- Iuran: target, terkumpul, progress, jumlah pembayaran, progress per wilayah, filter kegiatan dan Humas penarikan.
- Pembelanjaan: total, jumlah transaksi, kategori, bukti tersedia, breakdown kategori, filter kegiatan dan petugas.
- Jejak transaksi publik juga memasukkan transaksi operasional yang sudah diverifikasi.
- `OperationTransaction` ditambah `dateISO` untuk filter dan kesiapan migrasi Supabase.

Prototype masih in-memory dan reset saat refresh. Setelah Supabase aktif, seluruh UI ini harus membaca transaksi terverifikasi dari database yang sama tanpa pencatatan ulang.
