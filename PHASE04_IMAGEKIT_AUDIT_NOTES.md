# Phase 04 ImageKit + YouTube — Audit Notes

Tanggal: 24 Agustus 2026

## Scope final

- Supabase tetap untuk Auth, database, RLS/RPC, metadata media, dan Edge Function.
- Supabase Storage tidak digunakan untuk binary media.
- Foto kegiatan disimpan sebagai public file di ImageKit.
- Bukti transaksi disimpan sebagai private file di ImageKit dan dibuka melalui signed URL singkat.
- Video tetap berupa link YouTube / Google Drive.
- Private API key ImageKit hanya disimpan sebagai Supabase Edge Function secret, tidak di frontend.

## Perubahan keamanan utama

- Upload ImageKit dilakukan server-side melalui `supabase/functions/imagekit-media`.
- Session Supabase, role, activity scope, transaction ownership, dan assignment Humas divalidasi sebelum upload/delete/preview.
- Delete ImageKit memeriksa `filePath` agar `fileId` dari scope lain tidak dapat dihapus.
- Bukti transaksi private memakai signed URL 5 menit.
- Public snapshot hanya mengekspos `evidence_present`, bukan URL bukti private.
- Legacy `cloudflare_r2` tetap dapat dibaca untuk kompatibilitas data lama, tetapi penulisan media baru diwajibkan memakai ImageKit.

## Database patch

Jalankan satu kali:

`docs/SUPABASE_PHASE04_IMAGEKIT_APPLY.sql`

Patch menambah enum/provider `imagekit`, `external_file_id` untuk bukti transaksi, dan mengganti RPC media untuk metadata ImageKit. Phase 01–03 dan patch R2 lama tidak perlu diulang.

## Validasi yang dijalankan

- `node scripts/validate-external-media.mjs` — PASS
- `node scripts/validate-supabase-phase03.mjs` — PASS
- `node scripts/validate-supabase-phase02-auth.mjs` — PASS
- TypeScript syntax/transpile audit — PASS (94 file TS/TSX)
- Relative local import audit — PASS
- Manual audit: tidak ada `VITE_MEDIA_API_URL`, private ImageKit key, service-role key, atau Cloudflare Worker aktif pada frontend.

## Catatan build

`npm ci` pada environment packaging mengalami network timeout sehingga full `npm run build` tidak diklaim sebagai PASS di sini. Jalankan `npm install`, `npm run audit:external-media`, dan `npm run build` pada PC pengembangan sebelum deployment production.
