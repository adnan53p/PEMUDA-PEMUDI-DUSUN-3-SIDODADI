# Phase 04 — Humas Individual Accounts & Reporting

Prototype frontend only. Belum terhubung Supabase/database.

## Perubahan utama

- Admin membuat akun Humas individual: nama, username, password awal, WhatsApp opsional, kegiatan, wilayah/tugas, target, dan permission.
- Humas Penarikan dan Humas Pembelanjaan dapat merupakan orang berbeda.
- Permission per kegiatan:
  - `collect_dues` — Penarikan Iuran
  - `record_purchases` — Pembelanjaan/Pengeluaran
  - `handover_cash` — Serah Terima Kas
- Setiap transaksi Humas mencatat `createdByUserId`, `createdByName`, `createdByRole`, `assignmentId`, dan `areaLabel` secara otomatis dari akun login/penugasan aktif.
- Humas tidak memilih nama penginput secara manual.
- Admin dapat menonaktifkan akun dan reset password prototype tanpa menghapus histori transaksi.
- Halaman Laporan & LPJ memiliki Laporan Per Humas dengan filter:
  - kegiatan
  - nama Humas
  - jenis transaksi
  - wilayah/tugas
  - status
- Humas pembelanjaan mendapat dashboard berbeda dari Humas penarikan; target iuran tidak ditampilkan sebagai tugas utama jika permission penarikan tidak ada.

## Akun demo

- Superadmin: `superadmin` / `demo-super`
- Admin: `admin` / `demo-admin`
- Budi Santoso (Penarikan RT 01 + Serah Kas): `budi.rt01` / `demo-budi`
- Andi Saputra (Pembelanjaan): `andi.belanja` / `demo-andi`
- Rian Pratama (Penarikan RT 02 + Serah Kas): `rian.rt02` / `demo-rian`

## Skenario uji

1. Login `budi.rt01` → hanya Catat Iuran dan Serahkan Kas yang aktif.
2. Catat iuran baru → logout.
3. Login `admin` → Verifikasi → transaksi menampilkan Budi sebagai penginput.
4. Buka Laporan & LPJ → filter Nama Humas = Budi Santoso dan Jenis = Penarikan Iuran.
5. Logout → login `andi.belanja` → hanya Catat Belanja yang aktif.
6. Catat pembelanjaan → login Admin → filter laporan Andi + Pembelanjaan.
7. Admin → Panitia & Humas → buat akun Humas baru. Logout lalu login dengan username/password yang baru dibuat tanpa refresh halaman.

## Batas prototype

Semua akun/transaksi baru masih state memory dan reset setelah browser refresh. Password demo tidak disimpan di sessionStorage; session hanya menyimpan ID user + expiry. Backend/auth produksi belum aktif.
