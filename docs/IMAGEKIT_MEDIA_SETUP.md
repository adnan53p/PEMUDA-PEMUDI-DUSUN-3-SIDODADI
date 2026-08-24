# Setup ImageKit untuk Pemuda Dusun 3 Sidodadi

## Arsitektur

Project ini **tidak menggunakan Supabase Storage untuk file media**.

- Supabase: Auth, database, RLS/RPC, metadata URL/fileId, dan Edge Function broker.
- ImageKit: file foto kegiatan dan bukti transaksi.
- YouTube / Google Drive: video kegiatan berupa URL/embed.

Bukti transaksi diupload ke ImageKit sebagai **private file**. Frontend tidak menerima private API key. Saat Admin membuka bukti, Edge Function membuat signed URL yang berlaku singkat (5 menit).

## 1. Buat akun ImageKit

Buat akun ImageKit Free. Tidak perlu kartu kredit untuk paket Free.

Di dashboard ImageKit buka bagian **Developer options / API keys** dan catat:

- URL Endpoint, contoh `https://ik.imagekit.io/xxxxxx`
- Private API key

Disarankan membuat **Restricted API Key** dengan izin Media Management `Read and write`, bukan memakai key standar untuk jangka panjang.

> Jangan menaruh private key di `.env` Vite, source React, GitHub, screenshot, atau chat.

## 2. Jalankan patch SQL ImageKit

Di Supabase SQL Editor jalankan satu kali:

`docs/SUPABASE_PHASE04_IMAGEKIT_APPLY.sql`

Ini menambah provider `imagekit`, menyimpan `external_file_id`, dan mengganti RPC media agar metadata ImageKit tersimpan aman. Migration Phase 01-03 dan patch R2 lama tidak perlu dijalankan ulang.

## 3. Simpan secret ImageKit di Supabase

Pastikan folder project sudah terhubung ke project Supabase yang benar (`supabase link`).

Cara aman: buat file lokal sementara bernama `.env.imagekit.local` (sudah diabaikan Git jika mengikuti `.gitignore`) dengan isi:

```env
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

Lalu jalankan:

```powershell
npx supabase secrets set --env-file .env.imagekit.local
```

Setelah secret berhasil tersimpan, hapus file lokal tersebut:

```powershell
Remove-Item .env.imagekit.local
```

## 4. Deploy Edge Function

```powershell
npx supabase functions deploy imagekit-media
```

Function `imagekit-media` menangani:

- validasi session Supabase,
- validasi role dan assignment,
- upload server-side ke ImageKit,
- foto kegiatan sebagai public file,
- bukti transaksi sebagai private file,
- signed URL bukti selama 5 menit,
- verifikasi filePath sebelum delete agar file lain tidak dapat dihapus sembarang.

## 5. Pengaturan keamanan ImageKit

Karena foto kegiatan memang publik sedangkan bukti ditandai `isPrivateFile=true`, **jangan aktifkan “Restrict all unsigned URLs” secara global** untuk akun ini. Private file tetap membutuhkan signed URL walaupun unsigned URLs untuk file publik tidak dibatasi.

## 6. Jalankan aplikasi

Tidak ada key ImageKit pada `.env` frontend. Cukup konfigurasi Supabase yang sudah ada.

```powershell
npm install
npm run audit:external-media
npm run dev
```

## 7. Tes wajib

1. Login Admin → Kegiatan → Media Kegiatan → upload JPG/PNG/WebP.
2. Pastikan foto tampil di halaman publik.
3. Login Humas pembelanjaan → buat transaksi + bukti JPG/PDF.
4. Login Admin → Bukti Transaksi → Preview.
5. Pastikan URL bukti tidak muncul di public snapshot dan bukti hanya dapat dibuka oleh session berwenang.
6. Hapus foto kegiatan dari Admin → cek file juga hilang dari ImageKit Media Library jika `external_file_id` tersedia.

## Batas file aplikasi

Walaupun limit ImageKit Free lebih tinggi, aplikasi sengaja membatasi upload menjadi **8 MB per file** untuk menjaga request Edge Function ringan dan stabil.
