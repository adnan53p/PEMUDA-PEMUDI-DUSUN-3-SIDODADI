# Supabase Phase 01 — Schema + Auth Mapping + RLS

Status: **READY TO APPLY MANUALLY / belum dijalankan ke project Supabase live**.

File utama:

- `supabase/migrations/202608240001_initial_schema_auth_rls.sql`

## Yang sudah disiapkan

1. 15 tabel canonical production sesuai blueprint pre-Supabase.
2. `profiles.id -> auth.users.id` sebagai 1:1 identity binding.
3. Trigger `auth.users -> profiles`.
4. Role hanya dibaca dari `raw_app_meta_data`, bukan metadata yang dapat diubah user biasa.
5. Role production tetap `superadmin | admin | humas`.
6. RLS di seluruh tabel.
7. Humas membaca data berdasarkan assignment kegiatan.
8. Community member Humas hanya terlihat bila warga tersebut ditugaskan kepadanya.
9. Transaksi dan evidence hanya **read-only dari client** pada fase ini.
10. Hard-delete transaksi/evidence diblokir di database.
11. Cross-table guard untuk assignment, target warga, dan transaction activity.
12. Kegiatan `financial_locked=true` menolak perubahan financial transaction.
13. Public views awal hanya untuk activity cards/media dan tidak mengekspos nomor telepon/actor ke publik.
14. Default privilege future tables/functions di-hardening agar tidak otomatis terbuka ke `anon/authenticated`.

## Kenapa transaksi belum bisa INSERT dari frontend

Sengaja.

Kebutuhan proyek ini tidak aman jika `financial_transactions` ditulis langsung dari browser hanya dengan policy biasa. Penarikan iuran, pembelanjaan, verifikasi Admin, serah kas, koreksi, pembatalan, dan audit harus menjadi operasi atomik lewat RPC/transactional server function.

Phase berikutnya akan membuat RPC seperti:

- `record_humas_dues(...)`
- `record_purchase(...)`
- `submit_cash_handover(...)`
- `verify_financial_transaction(...)`
- `reject_financial_transaction(...)`
- `cancel_financial_transaction(...)`
- `correct_financial_transaction(...)`
- `approve_activity_lpj(...)`

RPC wajib memvalidasi actor dari `auth.uid()`, assignment, permission, lock status, dan menulis audit log dalam transaksi database yang sama.

## Provision akun pertama

Jangan membiarkan user mendaftar sebagai `superadmin` dari frontend.

Buat user pertama melalui Supabase Dashboard/Admin API, lalu set **app_metadata** role ke `superadmin`. Trigger profile menggunakan app metadata tersebut.

Untuk akun berikutnya, provisioning Admin/Humas sebaiknya dilakukan melalui server-side/Admin API pada phase auth management, bukan mengizinkan client mengubah role.

## Urutan deploy aman

1. Buat project Supabase baru.
2. Pastikan belum ada tabel dengan nama yang sama.
3. Buka SQL Editor.
4. Jalankan migration `202608240001_initial_schema_auth_rls.sql`.
5. Verifikasi 15 tabel muncul.
6. Verifikasi semua tabel menunjukkan RLS enabled.
7. Buat akun Superadmin pertama melalui Dashboard/Admin path.
8. Jangan hubungkan UI operasional dulu.
9. Lanjut Phase 02: safe financial RPC + repository.

## Yang belum dilakukan

- Supabase URL / anon key di frontend.
- `@supabase/supabase-js` runtime client.
- login production menggantikan login demo.
- OperationsContext repository live.
- safe financial write RPC.
- public finance aggregate RPC/view.
- ImageKit upload melalui Supabase Edge Function.
- Android offline sync.

UI prototype tetap tidak disentuh pada fase ini untuk mencegah regresi visual/flow.
