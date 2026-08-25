# Phase 05 — UI Modernization

Scope perubahan hanya presentation layer publik.

## Diubah
- Navbar publik: pill navigation, glass/blur saat scroll, CTA transparansi yang lebih modern.
- Hero: editorial split layout, headline tanpa uppercase penuh, hero image rounded, floating transparency card.
- Impact stats: modern metric cards.
- Kegiatan: featured editorial card + grid cards modern.
- Program: card grid dengan hierarchy lebih kuat.
- Dokumentasi: image cards rounded dengan overlay caption.
- Final CTA dan footer: spacing, radius, typography, depth lebih modern.
- Design tokens: system display font modern + button radius/soft variant.
- Fix build regression: unused `FileImage` import pada AdminEvidencePage.

## Tidak diubah
- Supabase Auth / session
- Role superadmin/admin/humas
- RLS, schema, migration, RPC
- Keuangan, verifikasi, laporan/PDF
- ImageKit / Edge Function / signed evidence
- Business logic dan repository data

Target: visual modern, clean, warm, civic/community platform tanpa mengubah fungsi yang sudah stabil.
