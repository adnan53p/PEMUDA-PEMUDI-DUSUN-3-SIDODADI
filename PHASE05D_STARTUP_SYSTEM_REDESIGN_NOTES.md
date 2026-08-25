# Phase 05D — Startup-System Redesign

Fokus redesign ini adalah membangun ulang **sistem visual**, bukan hanya mengganti warna/font.

## Arah visual
- Inspirasi: karakter visual program digital Indonesia seperti 1000 Startup Digital (tanpa menyalin layout atau brand secara identik).
- Font utama: Plus Jakarta Sans.
- Warna utama: royal blue, coral red, yellow accent, ink/navy, white/light blue background.
- Hierarki font diperketat: display 800, body 400–500, label 700–800.
- Layout: asymmetric hero, bento metrics, editorial activity layout, modular program cards, gallery grid.
- Foto kegiatan dijadikan elemen utama, bukan sekadar thumbnail.

## Scope aman
Tidak mengubah:
- Supabase Auth
- RLS / RPC / migration
- Finance / transaction logic
- ImageKit
- Edge Functions
- Routing logic
- Provider data layer

## File presentation yang diubah
- src/index.css
- src/components/Navbar.tsx
- src/components/Footer.tsx
- src/components/ActivityCard.tsx
- src/sections/HeroSection.tsx
- src/sections/ImpactStats.tsx
- src/sections/ActivitiesSection.tsx
- src/sections/ProgramsSection.tsx
- src/sections/DocumentationSection.tsx
- src/sections/FinalCTA.tsx
