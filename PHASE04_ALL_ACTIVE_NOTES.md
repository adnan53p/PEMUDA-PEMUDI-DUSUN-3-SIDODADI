# Phase 04 — Semua Workspace Aktif untuk Uji Prototype

## Scope
Phase ini mengaktifkan seluruh menu Admin yang sebelumnya berlabel **SEGERA** dan mengaktifkan action utama Humas menggunakan state frontend bersama (in-memory). Belum ada Supabase/backend.

## Role tetap
- **Superadmin**: Website Management / CMS only.
- **Admin**: Operasional organisasi.
- **Humas**: Operasional lapangan per kegiatan sesuai permission.

## Route Admin aktif
- `/admin` — Ringkasan Operasional
- `/admin/kegiatan` — Kegiatan
- `/admin/panitia-humas` — Panitia & Humas
- `/admin/keuangan` — RAB & Keuangan
- `/admin/verifikasi` — Verifikasi
- `/admin/bukti` — Bukti Transaksi
- `/admin/laporan` — Laporan & LPJ
- `/admin/audit` — Audit Operasional

## Action Humas aktif untuk prototype
- Catat Iuran
- Catat Belanja
- Serahkan Kas
- Riwayat Saya

Data yang dibuat Humas masuk ke satu state operasi yang sama. Tanpa refresh, Anda dapat logout dari Humas, login sebagai Admin, lalu melihat transaksi yang sama di menu Verifikasi, RAB & Keuangan, Bukti Transaksi, dan Audit.

## Skenario uji terbaik
1. Login `humas / demo-humas`.
2. Pilih Festival Kemerdekaan.
3. Catat iuran pada target yang belum dibayar.
4. Logout.
5. Login `admin / demo-admin`.
6. Buka **Verifikasi** dan verifikasi transaksi tadi.
7. Buka **RAB & Keuangan**, **Bukti Transaksi**, dan **Audit Operasional**.
8. Logout lalu login Humas lagi tanpa refresh browser untuk melihat status target berubah.

## Proteksi prototype
- Target iuran yang sudah diajukan tidak bisa langsung dicatat dua kali selama state sesi masih hidup.
- Transaksi Ditolak/Dibatalkan tetap menyisakan audit trail.
- Serah terima kas berstatus pending tidak langsung dianggap menambah Kas Kegiatan.
- Permission Humas tetap per kegiatan.

## Batasan
- State prototype reset jika browser direfresh.
- Belum ada database, Supabase Auth, RLS, Storage, realtime server, atau persistence.
- File bukti masih berupa metadata/preview placeholder; belum upload file nyata.
- Struktur panitia memakai jabatan dengan nama kosong agar tidak mengarang identitas pengurus.
