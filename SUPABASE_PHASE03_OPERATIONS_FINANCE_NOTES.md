# Supabase Phase 03 — Operasional & Keuangan

## Status

Phase 03 memindahkan sumber data operasional dan keuangan dari state/mock frontend ke Supabase ketika konfigurasi Supabase aktif. Mode prototype tetap tersedia hanya sebagai fallback saat environment Supabase tidak dikonfigurasi.

Cakupan yang sudah terhubung:

- Kegiatan dan status/publikasi kegiatan.
- Penugasan Humas dan permission per penugasan.
- Master warga dan target penarikan iuran per kegiatan.
- RAB kegiatan.
- Panitia kegiatan.
- Iuran, pemasukan langsung, pembelanjaan, serah kas, verifikasi, penolakan, pembatalan, dan koreksi transaksi.
- Rekonsiliasi/penutupan kas Humas.
- Status laporan/LPJ dan penguncian keuangan setelah LPJ disahkan.
- Metadata dokumentasi/media kegiatan.
- Audit trail untuk aksi sensitif yang disediakan RPC/migration.
- Snapshot publik yang disanitasi untuk website publik.

## Keamanan dan single source of truth

- Browser memakai Supabase session pengguna aktif; identitas transaksi tidak dipercaya dari payload frontend.
- Operasi keuangan sensitif menggunakan RPC `security definer` dengan pemeriksaan role/assignment di server.
- RLS yang sudah dibangun pada Phase 01 tetap menjadi lapisan pembatas baca/tulis.
- Superadmin tetap berfokus pada website/oversight; operasi kegiatan dikelola Admin, sedangkan Humas hanya pada assignment dan permission yang diberikan.
- Snapshot publik tidak mengirim nama warga pembayar, UUID master warga, atau UUID user Humas yang sebenarnya.
- `SUPABASE_SERVICE_ROLE_KEY` tidak digunakan di source frontend.

## Bukti transaksi dan media

Phase 03 menyimpan metadata bukti transaksi/media. Fase media eksternal memakai ImageKit untuk foto/bukti dan YouTube/Google Drive untuk video. Supabase Storage tidak digunakan untuk file foto/video. Ledger transaksi tetap menjadi single source of truth di Supabase.

## Data prototype lama

Data mock/demo frontend sengaja **tidak** disalin otomatis ke database production. Sesudah migration Phase 03 diterapkan, workspace Supabase dapat terlihat kosong sampai Admin membuat data kegiatan nyata pertama.

Akun Auth yang sudah ada tetap digunakan. Untuk akun Humas yang sudah pernah dibuat sebelum Phase 03, jangan membuat akun Auth kedua. Admin cukup membuat penugasan Supabase untuk akun Humas tersebut pada kegiatan yang sesuai.

## Cara menerapkan migration Phase 03

1. Gunakan source project Phase 03 terbaru.
2. Pastikan `.env` project berisi konfigurasi Supabase yang sama dengan project Auth yang sudah berhasil dipakai. Jika memakai hasil extract baru, salin `.env` lokal dari project sebelumnya. Jangan membagikan key rahasia.
3. Buka Supabase Dashboard → SQL Editor.
4. Buka file `docs/SUPABASE_PHASE03_APPLY.sql` dari source Phase 03.
5. Salin seluruh isinya ke SQL Editor dan jalankan **satu kali**.
6. Jangan menjalankan ulang migration `202608240001` atau `202608240002` pada project yang sudah memiliki Phase 01/02.
7. Dari folder project jalankan:

```powershell
npm install
npm run audit:supabase-phase03
npm run dev
```

## Checklist uji setelah migration

1. Login Admin.
2. Buat kegiatan nyata pertama dan pastikan tetap ada setelah refresh browser.
3. Tambahkan RAB kegiatan.
4. Tambahkan penugasan untuk akun Humas yang sudah ada, lengkap dengan permission yang dibutuhkan.
5. Tambahkan warga/target iuran untuk kegiatan tersebut.
6. Login Humas dan pastikan hanya assignment yang diberikan yang terlihat.
7. Catat iuran. Refresh Admin dan pastikan transaksi langsung terbaca dari Supabase.
8. Catat pembelanjaan Humas. Pastikan status menunggu verifikasi dan Admin dapat verifikasi/tolak.
9. Catat serah kas Humas. Setelah Admin verifikasi, pastikan saldo Kas Kegiatan bertambah.
10. Lakukan rekonsiliasi/penutupan kas Humas.
11. Uji halaman publik pada kegiatan yang `public_visible`: nama warga dan ID user internal tidak boleh tampil.
12. Majukan LPJ sampai `Disahkan`; pastikan transaksi/RAB kegiatan terkunci sesuai lifecycle Phase 01.
13. Jika perlu koreksi setelah LPJ, gunakan alur buka kembali dengan alasan agar audit trail tetap tercatat.

## Catatan build

Audit Phase 03 adalah pemeriksaan statis khusus integrasi repository/RPC/RLS/privacy. Production build tetap harus dijalankan pada mesin development setelah dependency npm tersedia:

```powershell
npm run build
```
