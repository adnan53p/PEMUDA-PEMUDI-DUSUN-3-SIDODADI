# Phase 05K — UI Copy Cleanup

## Tujuan
Membersihkan teks teknis yang tidak perlu terlihat oleh pengguna/pengurus tanpa mengubah arsitektur atau logic aplikasi.

## Prinsip
- Istilah backend seperti Supabase, ImageKit, Edge Function, RLS/RPC, fileId, metadata, signed URL, service-role, server-side, dan prototype tidak lagi ditampilkan sebagai copy utama UI.
- Pesan operasional diubah menjadi bahasa pengguna: data berhasil disimpan, layanan belum tersedia, bukti transaksi, pengelolaan akun, dan sebagainya.
- Nama teknis tetap dipertahankan hanya di implementasi source code karena dibutuhkan fungsi aplikasi.

## Area yang dibersihkan
- Login pengurus
- Status/sinkronisasi internal
- Pengelolaan akun Admin dan Humas
- Pengelolaan media website dan media kegiatan
- Bukti transaksi privat
- Keuangan Admin dan Humas
- Konten website & SEO
- Halaman detail kegiatan publik
- Pesan repository/service yang dapat muncul ke UI
- Istilah Workspace/Permission yang tampil ke pengguna

## Regression guard
Tidak mengubah schema, migration, RLS, RPC, Auth flow, query Supabase, upload/delete ImageKit, Edge Function, perhitungan keuangan, route, atau SEO logic.

## Kompatibilitas
Patch ini juga mempertahankan perbaikan mobile terakhir yang dilaporkan setelah Phase 05J: proteksi angka statistik, tooltip keuangan, hero detail kegiatan, dan touch target menu.
