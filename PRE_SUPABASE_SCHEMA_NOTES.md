# PRE-SUPABASE SCHEMA PREPARATION

Versi ini melanjutkan `MEDIA_VIEWER_HARDENED` dengan menyiapkan struktur data production-ready, **tanpa mengaktifkan Supabase** dan tanpa mengubah UI/flow yang sudah berjalan.

## File baru

- `src/domain/productionTypes.ts` — bentuk canonical entity production.
- `src/domain/productionRules.ts` — label machine/UI + invariant transaksi.
- `src/domain/prototypeAdapter.ts` — jembatan dari bentuk prototype saat ini ke model production.
- `docs/PRE_SUPABASE_DATA_MODEL.md` — penjelasan relasi dan keputusan data.
- `docs/POSTGRES_SCHEMA_BLUEPRINT.sql` — draft PostgreSQL; tidak dijalankan.
- `scripts/validate-data-blueprint.mjs` — audit statis blueprint.

## Hal penting yang dikunci

- iuran sukarela, tidak ada target nominal warga/Humas;
- satu warga unik per kegiatan untuk penugasan iuran;
- panitia per kegiatan;
- Humas + permission per kegiatan;
- satu tabel transaksi sebagai sumber kebenaran;
- RAB realization tidak disimpan ganda;
- Kas Humas dan Kas Kegiatan diturunkan dari transaksi;
- koreksi/batal tidak menghapus histori;
- media hanya menyimpan referensi ImageKit / YouTube / Google Drive;
- bukti transaksi dipisah ke entity evidence;
- LPJ + audit disiapkan untuk lifecycle production.

## Belum dilakukan

Supabase Auth, database live, RLS, Storage, `.env`, API, RPC, signed upload, dan sinkronisasi Android tetap belum disentuh.
