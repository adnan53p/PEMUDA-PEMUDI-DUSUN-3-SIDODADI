# Phase 05F — Editable Public Images

## Scope
- Hero homepage is no longer hard-coded; it uses `site_media.hero`.
- Profile page image is no longer hard-coded; it uses `site_media.profile`.
- Organization page image is no longer hard-coded; it uses `site_media.organization`.
- Homepage documentation gallery now uses published activity media instead of `mockData` gallery URLs.
- Superadmin → Konten Website gets a new **Media Website · ImageKit** manager with 3 replaceable image slots.
- ImageKit Edge Function adds isolated `site-image` upload/delete scope restricted to Superadmin.
- New `site_media` table stores only ImageKit metadata/URLs. Supabase Storage is not used.

## Apply order
1. Run `docs/SUPABASE_PHASE05_SITE_MEDIA_APPLY.sql` once in Supabase SQL Editor.
2. Redeploy Edge Function: `npx supabase functions deploy imagekit-media`.
3. Build/test frontend.

## Regression boundaries
No changes to financial transaction logic, RLS for existing operational tables, Auth flows, activity media RPCs, or transaction evidence flow.
