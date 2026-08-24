# Cloudflare R2 Media API

Worker ini menjadi satu-satunya jalur upload file biner. Credential R2 tidak pernah masuk ke React/browser.

## Penyimpanan

- `activities/<activity-id>/photos/...` -> foto kegiatan, dapat disajikan publik lewat custom domain R2.
- `transactions/<transaction-id>/evidence/...` -> bukti transaksi privat. File dibuka melalui endpoint Worker `/object/...` yang memvalidasi session Supabase + RLS sebelum membaca R2.
- Video tidak diupload ke R2. Video tetap berupa link YouTube / Google Drive.

## Setup singkat

1. Login Cloudflare: `npx wrangler login`
2. Buat bucket: `npx wrangler r2 bucket create pemuda-dusun3-media`
3. Salin `wrangler.toml.example` menjadi `wrangler.toml` lalu sesuaikan `MEDIA_PUBLIC_BASE_URL` dan `ALLOWED_ORIGINS`.
4. Hubungkan custom domain publik ke bucket R2 untuk foto kegiatan.
5. Set secret Worker:
   - `npx wrangler secret put SUPABASE_URL`
   - `npx wrangler secret put SUPABASE_PUBLISHABLE_KEY`
6. Deploy: `npm install && npm run deploy`
7. Salin URL Worker ke `.env` frontend sebagai `VITE_MEDIA_API_URL`.

## Security

- Worker memvalidasi bearer token ke Supabase Auth.
- Role dibaca dari `profiles` memakai JWT user yang sama; tidak memakai service-role key.
- Akses activity/transaction diverifikasi lagi melalui REST Supabase dan RLS.
- Bukti transaksi tidak diberi public R2 URL.
- MIME dan ukuran file dibatasi.
- Nama object selalu UUID sehingga nama file user tidak dipakai sebagai path.
- CORS hanya mengizinkan origin yang tercantum di `ALLOWED_ORIGINS`.
