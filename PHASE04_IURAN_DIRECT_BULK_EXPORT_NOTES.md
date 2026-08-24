# Phase 04 — Iuran Langsung + Export Laporan Kolektif

## 1. Koreksi alur iuran Humas

- Iuran yang dicatat Humas **tidak lagi menunggu verifikasi Admin per pembayaran**.
- Setelah disimpan, transaksi iuran langsung berstatus **Diterima Humas**.
- Target warga langsung dihitung ulang menjadi **Belum Ditagih / Belum Lunas / Sudah Bayar** berdasarkan nominal yang sudah diterima Humas.
- Nominal iuran langsung masuk ke **Kas di Tangan Humas**.
- Admin tetap melakukan verifikasi untuk **Pembelanjaan/Pengeluaran**.
- Admin melakukan konfirmasi pada **Serah Terima Kas** sebelum uang dianggap masuk **Kas Kegiatan**.
- Iuran yang salah tidak dihapus permanen; alur koreksi/pembatalan tetap mempertahankan audit trail.

Alur utama:

`Humas catat iuran → Diterima Humas → target diperbarui → Kas di Tangan Humas`

`Humas serahkan kas → Menunggu Verifikasi → Admin konfirmasi → Kas Kegiatan`

## 2. Export laporan kolektif Admin

Pada **Admin → Laporan & LPJ**, laporan transaksi yang sudah mengikuti filter aktif sekarang dapat diekspor secara kolektif melalui:

- **Download Semua PDF**
- **Excel / CSV** (CSV UTF-8 yang kompatibel dengan Excel, WPS Office, dan Google Sheets)
- **Bagikan PDF** menggunakan Web Share API; pada perangkat/browser yang tidak mendukung berbagi file, sistem fallback ke download PDF.

Filter yang ikut diterapkan pada export:

- Kegiatan
- Nama Humas
- Jenis transaksi
- Wilayah/tugas
- Status
- Periode

PDF kolektif berformat **A4 landscape**, mendukung banyak halaman, dan berisi:

- Identitas PEMUDA DUSUN 3 SIDODADI
- Judul laporan
- Filter aktif
- Ringkasan nominal
- Rekap petugas
- Rekap kategori
- Tabel transaksi
- Nomor halaman dan footer

PDF per transaksi tetap dipertahankan sebagai opsi sekunder.

## Catatan Prototype

Belum menggunakan Supabase. Data operasional masih in-memory dan kembali ke data awal setelah browser direfresh.
