# Admin Simplification — Pre-Supabase

Scope: menyederhanakan workspace Admin tanpa mengubah arsitektur Supabase/backend (belum dipasang) dan tanpa mengubah alur Humas lapangan.

## Perubahan utama

### Sidebar Admin: 8 menu → 5 menu
1. Ringkasan
2. Kegiatan
3. Humas & Warga
4. Keuangan
5. Laporan & LPJ

Menu standalone `Verifikasi`, `Bukti Transaksi`, dan `Audit Operasional` dihilangkan dari sidebar. Route lama tetap aman dan diarahkan ke lokasi baru agar bookmark/link prototype lama tidak putus.

### Ringkasan
Dashboard kini hanya menampilkan:
- kegiatan aktif
- transaksi yang perlu tindakan
- kas kegiatan
- kas di tangan Humas
- daftar pendek tindakan Admin
- progress singkat kegiatan aktif

Daftar penugasan Humas dan audit log panjang tidak lagi diulang di dashboard.

### Kegiatan
Pengelolaan susunan panitia dipindah dari halaman Humas ke halaman Kegiatan. Tombol `Panitia` pada kartu kegiatan membuka pengelolaan panitia untuk kegiatan tersebut.

### Humas & Warga
Halaman lama `Panitia & Humas` difokuskan menjadi `Humas & Warga`.
- Panitia tidak lagi dikelola di sini.
- Tab `Akun Humas` untuk login/status akun.
- Tab `Penugasan & Warga` untuk assignment, permission, wilayah, dan daftar warga iuran.

### Keuangan
Menjadi pusat tunggal operasional finansial dengan tab:
- Ringkasan
- Iuran
- Pembelanjaan
- Serah Kas
- Transaksi

Verifikasi Admin dan metadata bukti transaksi kini berada di detail transaksi. Tidak ada lagi menu verifikasi/bukti terpisah.

### Laporan & LPJ
- Default fokus pada rekap/filter/export, bukan tabel transaksi penuh.
- Detail transaksi disembunyikan sampai Admin menekan `Lihat Detail Transaksi`.
- Audit dipindah menjadi tab `Riwayat Aktivitas` pada halaman yang sama.

## Kompatibilitas route lama
- `/admin/verifikasi` → `/admin/keuangan?tab=pembelanjaan`
- `/admin/bukti` → `/admin/keuangan?tab=transaksi`
- `/admin/audit` → `/admin/laporan?tab=riwayat`

## Validasi
- 78 file TS/TSX lolos syntax transpile check.
- Seluruh relative import lolos pemeriksaan.
- Pemeriksaan struktur Admin memastikan sidebar hanya 5 menu dan fungsi Verifikasi/Bukti/Audit sudah mempunyai lokasi baru.
- `npm ci` pada environment pengerjaan timeout sehingga full `npm run build` tidak disertifikasi di environment ini.

## Tidak diubah
- Supabase/Auth produksi/RLS/Storage belum dipasang.
- Alur iuran sukarela tanpa target nominal tetap dipertahankan.
- Alur Humas lapangan tidak dirombak pada simplifikasi Admin ini.
