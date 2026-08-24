# Phase 04 — External Media ImageKit + YouTube/Google Drive

## Keputusan final

- Supabase Storage: **tidak digunakan**.
- Foto kegiatan: ImageKit public file.
- Bukti transaksi: ImageKit private file.
- Video: YouTube / Google Drive link.
- Supabase: Auth, database, metadata, `external_file_id`, RLS/RPC, dan Edge Function broker.

## Security boundary

React tidak memiliki ImageKit private key. File dikirim dari browser ke Supabase Edge Function `imagekit-media`, lalu function melakukan upload server-side ke ImageKit menggunakan secret `IMAGEKIT_PRIVATE_KEY`.

Bukti transaksi ditandai `isPrivateFile=true`. Preview Admin meminta signed URL 5 menit dari Edge Function setelah session, role, transaction ownership/RLS, dan provider diverifikasi.

Delete file tidak hanya mempercayai `fileId` dari browser. Function mengambil file details dari ImageKit dan memastikan `filePath` cocok dengan activity/transaction yang diizinkan sebelum menghapus.

## SQL

User yang sebelumnya sudah menjalankan Phase 04 R2 cukup menjalankan patch baru:

`docs/SUPABASE_PHASE04_IMAGEKIT_APPLY.sql`

Tidak perlu mengulang migration Phase 01-03.

## Deployment

Lihat `docs/IMAGEKIT_MEDIA_SETUP.md`.
