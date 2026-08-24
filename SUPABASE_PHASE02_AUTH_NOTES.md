# SUPABASE PHASE 02 — AUTH INTEGRATION

Scope ketat fase ini:

- React memakai `@supabase/supabase-js`.
- Login internal berubah dari credential demo lokal menjadi Supabase email/password.
- Setelah Auth sukses, frontend membaca `public.profiles` dan menolak akun nonaktif / role tidak valid.
- Session dipersist oleh Supabase dan divalidasi kembali saat refresh menggunakan `auth.getUser()`.
- `onAuthStateChange` menjaga state login tetap sinkron.
- Logout memakai Supabase Auth.
- Humas yang login memuat assignment + permission aktif dari tabel Supabase agar struktur `AuthUser` tetap kompatibel.
- ProtectedRoute menunggu proses restore session sehingga tidak redirect prematur saat refresh.
- `.env` di-ignore oleh git; `.env.example` hanya berisi nama variable.
- Publishable Key direkomendasikan. `anon` key lama hanya fallback kompatibilitas sementara.

## Phase 02B selesai di source

- Pembuatan Admin/Humas dari UI ke Supabase Auth melalui Edge Function `manage-account`.
- Reset password dan aktif/nonaktif akun dilakukan server-side.
- Daftar Admin/Humas dibaca dari `public.profiles` dengan RLS.
- Deploy Edge Function tetap perlu dilakukan sekali pada project Supabase live.

## Belum dikerjakan setelah Phase 02

- CRUD operasional Supabase.
- RPC iuran, pembelanjaan, serah kas, verifikasi, koreksi, LPJ.
- Migrasi mock/prototype data ke production.
- Storage/media production.

## Setup lokal

1. Copy `.env.example` menjadi `.env`.
2. Isi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (recommended)
3. Jangan pernah memasukkan Secret Key / service_role ke frontend.
4. Jalankan `npm install` agar dependency Supabase dan lockfile lokal diperbarui.
5. Jalankan `npm run audit:supabase-phase02-auth`.
6. Jalankan `npm run build`.
7. Jalankan `npm run dev` lalu login memakai email Supabase.
