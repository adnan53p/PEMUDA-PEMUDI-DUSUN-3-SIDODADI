# Public data scope + RAB matching fix

Fix ini menutup dua regresi yang terkonfirmasi pada Phase 03.

## 1. Halaman publik tidak boleh mengikuti scope RLS akun yang sedang login

Sebelumnya `OperationsProvider` memilih internal snapshot ketika Supabase session masih aktif. Akibatnya halaman publik yang dibuka saat Humas login dapat melihat subset transaksi sesuai assignment Humas, bukan snapshot publik sanitasi.

Perbaikan:
- Menambahkan `PublicOperationsProvider`.
- Semua route publik di bawah `PublicLayout` dibungkus provider ini.
- Provider publik selalu memanggil `get_public_operations_snapshot()` walaupun Admin/Humas/Superadmin masih login.
- Provider internal tetap memakai snapshot internal/RLS sesuai role.

## 2. Realisasi RAB tidak lagi bergantung exact text match

Sebelumnya `kosumsi` dan `Konsumsi` dianggap berbeda. Sekarang kategori dinormalisasi dan toleransi satu typo hanya diterapkan untuk label kategori yang cukup panjang. Ini mempertahankan keamanan pencocokan sambil menangani typo sederhana.

## 3. Navbar publik sadar session

Jika session masih aktif, tombol `Masuk` berubah menjadi `Workspace` dan mengarah ke workspace role terkait. Ini mencegah pengguna mengira dirinya sedang anonim padahal session masih aktif.

Tidak ada perubahan SQL, schema, RLS, atau migration.
