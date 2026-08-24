# SUPABASE PHASE 02B — ACCOUNT MANAGEMENT

Status source: **READY**

Phase ini melengkapi Auth agar Superadmin dapat membuat/mengelola akun Admin dan Admin dapat membuat/mengelola akun Humas tanpa menaruh `service_role` di frontend.

## Arsitektur keamanan

- Frontend hanya memakai `VITE_SUPABASE_URL` + Publishable/Anon key.
- Operasi sensitif dipanggil melalui Edge Function `manage-account`.
- Edge Function membaca JWT caller, lalu mengecek `public.profiles.role` dan `is_active`.
- Superadmin hanya boleh mengelola akun `admin`.
- Admin hanya boleh mengelola akun `humas`.
- `SUPABASE_SERVICE_ROLE_KEY` hanya tersedia di environment Edge Function, tidak pernah di bundle React.
- Pembuatan akun memakai Supabase Admin API agar `auth.users`/identity tidak dimanipulasi dengan SQL manual.

## Operasi yang aktif

1. Superadmin membuat akun Admin dari `/superadmin/admin`.
2. Superadmin reset password Admin.
3. Superadmin aktif/nonaktifkan Admin.
4. Admin membuat akun Humas dari `/admin/panitia-humas`.
5. Admin reset password Humas.
6. Admin aktif/nonaktifkan Humas.
7. Daftar Admin/Humas dibaca dari `public.profiles` dengan RLS.
8. Login 3 role tetap memakai selector dan role server-side tetap menjadi sumber izin.

## Yang sengaja belum dipindahkan ke Supabase

Penugasan Humas, kegiatan, warga, transaksi, RAB, laporan, dan media masih prototype/frontend. Itu masuk Phase 03 data integration. Karena itu akun Humas yang baru dibuat sudah dapat login, tetapi penugasan produksinya baru permanen setelah data kegiatan/assignment dipindahkan ke Supabase.

## Deploy Edge Function

Dari root project yang sudah terhubung ke Supabase CLI:

```bash
supabase login
supabase link --project-ref PROJECT_REF_ANDA
supabase functions deploy manage-account
```

Supabase hosted Edge Functions menyediakan `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` sebagai server-side environment. Jangan menambahkan service-role ke `.env` Vite.

## Verifikasi

1. Login sebagai Superadmin.
2. Buka `Superadmin > Akun Admin`.
3. Buat satu Admin dengan email + password.
4. Logout, pilih `Admin`, login dengan akun tersebut.
5. Buka `Admin > Humas & Warga`.
6. Buat satu Humas dengan email + password.
7. Logout, pilih `Humas`, login dengan akun tersebut.
8. Coba memilih role yang salah pada halaman login — login harus ditolak walaupun email/password benar.
9. Nonaktifkan akun lalu coba login kembali — profil harus ditolak sebagai akun tidak aktif.

## Catatan penting

Jangan pernah membuat user dengan `insert into auth.users`. Gunakan Supabase Dashboard/Admin API/Edge Function agar tabel identity dan metadata Auth tetap konsisten.
