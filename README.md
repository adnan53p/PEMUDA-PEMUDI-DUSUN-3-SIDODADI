# Pemuda Dusun 3 Sidodadi

Website publik + workspace internal Superadmin, Admin, dan Humas.

## Stack

- React + TypeScript + Vite
- Supabase Auth + PostgreSQL + RLS/RPC
- Supabase Edge Functions untuk operasi server-side sensitif
- ImageKit untuk foto kegiatan dan bukti transaksi
- YouTube / Google Drive untuk video

## Media architecture

Supabase Storage **tidak digunakan** untuk file foto/video/bukti.

- Foto kegiatan: ImageKit public file
- Bukti transaksi: ImageKit private file + signed URL 5 menit
- Video: URL YouTube / Google Drive
- Supabase: metadata, URL, `external_file_id`, relasi, Auth, RLS/RPC

Private ImageKit key hanya disimpan di Supabase Edge Function secrets dan tidak pernah masuk source React/Vite.

## Setup lanjutan dari Phase 03/Phase 04 R2

Jika database Phase 01-03 dan RPC Phase 04 sebelumnya sudah terpasang, jalankan hanya patch:

`docs/SUPABASE_PHASE04_IMAGEKIT_APPLY.sql`

Kemudian ikuti:

`docs/IMAGEKIT_MEDIA_SETUP.md`

## Development

```bash
npm install
npm run audit:supabase-phase03
npm run audit:external-media
npm run dev
```

## Build

```bash
npm run build
```
