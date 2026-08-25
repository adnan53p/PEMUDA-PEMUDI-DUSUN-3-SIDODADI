# Phase 05H — Mobile Horizontal + Managed Content + Program SEO

Scope perubahan:
- Pencapaian & Transparansi mobile menjadi satu baris horizontal swipe, bukan memanjang vertikal.
- Lima Bidang mobile menjadi satu baris horizontal swipe.
- Konten Pencapaian dan Lima Bidang dipindahkan ke sumber data Supabase `public_site_content`.
- Superadmin dapat mengedit heading/deskripsi/statistik serta seluruh detail 5 bidang.
- Setiap bidang dapat dibuka pada route `/bidang/:slug`.
- Detail bidang memiliki title, deskripsi lengkap, tujuan, image URL opsional, CTA opsional, dan metadata SEO runtime.
- Urutan dan visibility bidang dapat diatur dari Superadmin.

Yang tidak diubah:
- Auth / role.
- Tabel dan RLS keuangan.
- Operasional kegiatan.
- Transaction evidence.
- ImageKit Edge Function.
- Site media hero/profile/organization.

Wajib sebelum Publish:
1. Jalankan `docs/SUPABASE_PHASE05H_PUBLIC_CONTENT_APPLY.sql` di Supabase SQL Editor.
2. Jalankan `npm run build` di PC lokal.
3. Uji Superadmin > Konten Website > Publish.
4. Uji public mobile pada Pencapaian dan Lima Bidang.
5. Uji `/bidang/<slug>` dan refresh langsung route tersebut.
