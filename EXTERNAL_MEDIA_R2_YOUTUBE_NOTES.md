# External Media — Cloudflare R2 + YouTube/Google Drive

## Keputusan arsitektur final

File foto/video **tidak disimpan di Supabase Storage**.

- Supabase: Auth, database, metadata media, relasi transaksi/kegiatan, RLS/RPC.
- Cloudflare R2: foto kegiatan dan file bukti transaksi.
- YouTube / Google Drive: video kegiatan berupa link/embed.

## Implementasi source

### Foto kegiatan

Admin dapat memilih file JPG/PNG/WebP dari `Admin -> Kegiatan -> Media Kegiatan`.
Frontend mengirim file ke Cloudflare Worker dengan bearer token session Supabase. Worker memvalidasi akun dan role, lalu menyimpan file ke R2. URL publik foto kemudian disimpan sebagai metadata `activity_media` di Supabase.

### Bukti transaksi

Admin/Humas dapat memilih JPG/PNG/WebP/PDF saat mencatat pemasukan/pembelanjaan.
Urutan aman:

1. transaksi dibuat di Supabase,
2. file diupload ke Worker/R2 menggunakan ID transaksi,
3. RPC `rpc_attach_transaction_evidence` menautkan metadata bukti ke transaksi.

Bukti transaksi tidak memakai public R2 URL. URL metadata mengarah ke endpoint privat Worker `/object/...`; Worker memvalidasi JWT Supabase + RLS sebelum mengirim file.

### Video

Video tidak diupload ke R2 dan tidak disimpan sebagai binary di Supabase. Admin cukup memasukkan URL YouTube atau Google Drive. Parser/embed lama tetap dipakai.

## Security

- Tidak ada R2 access key/secret di React.
- Tidak ada Supabase service-role key di React maupun Worker.
- Worker memakai R2 binding Cloudflare, bukan S3 credential browser.
- Worker memvalidasi bearer token ke Supabase Auth.
- Role dibaca dari `profiles` dengan token user yang sama.
- Access activity/transaction diverifikasi kembali melalui Supabase REST + RLS.
- MIME/ukuran file dibatasi.
- Bukti transaksi dikirim dengan `private, no-store`.
- Public snapshot hanya mengirim `evidence_present`, bukan URL bukti privat.

## Migration tambahan

Jalankan satu kali setelah Phase 03:

`docs/SUPABASE_PHASE04_MEDIA_APPLY.sql`

Migration hanya menambah RPC untuk menautkan metadata bukti R2. Tidak memakai Supabase Storage.

## Cloudflare Worker

Source Worker tersedia di:

`cloudflare/media-api/`

Ikuti `cloudflare/media-api/README.md` untuk membuat bucket, binding, secret, dan deploy Worker.
