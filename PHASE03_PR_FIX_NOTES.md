# Phase 03 PR Fix — PDF, Bulk Verification, Humas Cash

Perbaikan ini dibuat di atas project Phase 03 Operasional + Keuangan tanpa mengubah schema/migration Supabase.

## 1. PDF laporan dirapikan
- LPJ otomatis sekarang memakai layout A4 yang lebih terstruktur: header, identitas kegiatan, ringkasan keuangan, tabel panitia, RAB vs realisasi, tabel transaksi, catatan/evaluasi, area pengesahan, dan footer nomor halaman.
- PDF laporan transaksi memakai layout landscape dengan filter, kartu ringkasan, tabel berkolom, wrapping teks, dan pagination.
- PDF per transaksi juga dirapikan menjadi bukti/catatan transaksi dengan status, nominal, detail, bukti, dan footer audit.
- Tidak menambah dependency PDF eksternal. Renderer PDF ringan ada di `src/utils/simplePdf.ts`.

## 2. Admin Keuangan — verifikasi massal
Tab `Pembelanjaan` dan `Serah Kas` sekarang memiliki:
- checkbox per transaksi yang masih menunggu verifikasi,
- `Tandai Semua`,
- jumlah transaksi yang dipilih,
- `Verifikasi Dipilih` untuk pembelanjaan,
- `Konfirmasi Dipilih` untuk serah kas.

Proses tetap memanggil workflow verifikasi transaksi existing satu per satu sehingga aturan backend/RPC yang sudah ada tetap dipakai. Transaksi yang sudah terverifikasi tidak dapat ditandai ulang.

## 3. Humas pembelanjaan — Serahkan Kas dibatasi
- `Serahkan Kas` hanya tersedia jika penugasan memiliki `collect_dues` dan `handover_cash`.
- Pada Humas yang hanya bertugas pembelanjaan, tombol Serahkan Kas dan Tutup Kas tidak ditampilkan.
- Guard tambahan mencegah modal/submit Serah Kas dipakai dari penugasan pembelanjaan saja.
- Di pengaturan permission Admin, menghapus `Penarikan Iuran` otomatis menghapus `Serah Terima Kas`; menambahkan `Serah Terima Kas` otomatis menambahkan `Penarikan Iuran`. Ini mencegah kombinasi permission yang tidak konsisten pada penugasan baru.

## Audit
- TypeScript semantic check: PASS.
- Supabase Phase 03 validation: PASS.
- PDF engine smoke test: PDF 1.4 A4 valid (`pdfinfo`).
- Full production build tidak dijadikan validator pada environment ini karena dependency project tidak dipasang di folder paket final.
