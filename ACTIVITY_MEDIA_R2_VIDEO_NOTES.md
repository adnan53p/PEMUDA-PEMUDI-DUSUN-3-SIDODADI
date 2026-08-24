# Activity Media — R2 + YouTube/Google Drive (Pre-Supabase)

Checkpoint base: `PEMUDA_DUSUN_3_SIDODADI_FINANCE_BOX_RESPONSIVE_FIX.zip`.

## Scope implemented

- Setiap kegiatan memiliki pengelolaan media sendiri melalui Admin -> Kegiatan -> Media Kegiatan.
- Media dipisahkan per `activityId`; media kegiatan A tidak bercampur dengan kegiatan B.
- Foto:
  - provider: Cloudflare R2
  - dapat menjadi foto cover
  - dapat menjadi foto galeri
  - dapat ditampilkan/disembunyikan dari publik
  - urutan dapat dinaikkan/diturunkan
- Video:
  - provider: YouTube atau Google Drive
  - link YouTube dikenali dari watch/youtu.be/shorts/live/embed
  - link Google Drive diubah menjadi URL `/preview` untuk embed
  - tidak autoplay
  - dapat ditampilkan/disembunyikan dan diurutkan
- Halaman publik detail kegiatan:
  - cover membaca foto cover media jika ada
  - galeri menampilkan beberapa foto, bukan hanya tiga foto
  - video ditampilkan pada section khusus dengan iframe lazy-loaded
- Jika belum ada media yang dikelola Admin, data gambar demo lama tetap menjadi fallback agar halaman prototype tidak kosong.
- Audit log mencatat tambah/hapus/publish/hide/set-cover/perubahan urutan media.

## Architecture prepared for backend later

Data media yang nantinya cocok disimpan di Supabase Database:

- id
- activity_id
- type (`photo` / `video`)
- provider (`cloudflare-r2` / `youtube` / `google-drive`)
- title
- url
- sort_order
- is_cover
- public_visible

File besar tidak perlu disimpan di Supabase Storage.

- Foto fisik: Cloudflare R2
- Video: YouTube Unlisted atau Google Drive
- Supabase nanti: metadata/link + relational data + Auth/RLS

## Important security note

Upload langsung ke R2 sekarang tersedia melalui Cloudflare Worker terautentikasi. Credential R2 tetap tidak pernah masuk ke frontend React. Worker memakai R2 binding Cloudflare dan memvalidasi session Supabase sebelum menerima upload. Jangan memasukkan `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` ke bundle browser.

## Validation

- TypeScript/TSX syntax transpile: PASS — 80 files.
- Relative local import resolver: PASS.
- Internal TypeScript semantic audit dengan dependency stubs: tidak ditemukan error baru pada modul media; hanya dua warning unused variable lama di `HumasWorkspace.tsx` yang sudah ada sebelum scope ini.
- URL parser test:
  - YouTube -> `youtube-nocookie.com/embed/...`: PASS.
  - Google Drive -> `drive.google.com/file/d/.../preview`: PASS.
- Full `npm run build` tidak dapat disertifikasi karena dependency npm tidak tersedia di cache environment dan `npm ci` timeout / offline cache tidak lengkap.
