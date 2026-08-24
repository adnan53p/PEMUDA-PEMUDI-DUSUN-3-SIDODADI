# Setup Cloudflare R2 untuk PEMUDA DUSUN 3 SIDODADI

## 1. Tujuan

Cloudflare R2 menyimpan:

- foto cover/galeri kegiatan,
- foto/PDF bukti transaksi.

Video tetap memakai YouTube / Google Drive. Supabase tidak menyimpan binary file.

## 2. Buat R2 bucket

Dari folder `cloudflare/media-api`:

```powershell
npx wrangler login
npx wrangler r2 bucket create pemuda-dusun3-media
```

## 3. Konfigurasi Worker

Salin:

`wrangler.toml.example` -> `wrangler.toml`

Atur:

- `MEDIA_PUBLIC_BASE_URL`: custom domain/R2 public domain khusus foto kegiatan.
- `ALLOWED_ORIGINS`: origin frontend, misalnya `http://localhost:5173` saat development dan domain production saat live.

## 4. Secret Worker

```powershell
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
```

Gunakan project Supabase yang sama dengan aplikasi.

## 5. Deploy

```powershell
npm install
npm run deploy
```

Catat URL Worker, misalnya:

`https://pemuda-dusun3-media-api.<subdomain>.workers.dev`

## 6. Hubungkan frontend

Tambahkan ke `.env` project React:

```env
VITE_MEDIA_API_URL=https://pemuda-dusun3-media-api.<subdomain>.workers.dev
```

Restart development server setelah mengubah `.env`.

## 7. Jalankan migration metadata bukti

Di Supabase SQL Editor, jalankan satu kali:

`docs/SUPABASE_PHASE04_MEDIA_APPLY.sql`

## 8. Uji

1. Login Admin -> Kegiatan -> Media -> upload foto -> foto muncul di halaman publik.
2. Login Humas pembelanjaan -> catat belanja + lampirkan bukti -> Admin melihat bukti dari menu Bukti Transaksi.
3. Coba membuka URL bukti privat tanpa session melalui request biasa; Worker harus menolak.
4. Tambahkan video YouTube -> halaman kegiatan menampilkan embed/thumbnail seperti sebelumnya.
