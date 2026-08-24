# Supabase Phase 01B — Audit Corrections

Audit dilakukan terhadap source aktual `PRE_SUPABASE_DATA_MODEL_READY`, terutama:

- `src/prototype/OperationsContext.tsx`
- `src/prototype/AccountsContext.tsx`
- `src/auth/types.ts`
- `src/App.tsx`
- `src/pages/internal/AdminReportsPage.tsx`
- `src/pages/internal/HumasWorkspace.tsx`
- `src/domain/productionTypes.ts`
- `src/domain/productionRules.ts`
- `src/domain/prototypeAdapter.ts`
- `docs/PRE_SUPABASE_DATA_MODEL.md`
- `PRE_SUPABASE_HARDENING_NOTES.md`

## Temuan yang dikoreksi

1. **Role operasional tidak cocok dengan source terbaru.** Source memisahkan Superadmin (Website Management) dan Admin (Operasional). Policy write operasional kini Admin-only; Superadmin tetap dapat membaca untuk oversight bila diperlukan.
2. **LPJ approval sebelumnya Superadmin-only, padahal UI aktual menjalankannya dari Admin.** Lifecycle kini disiapkan untuk Admin-only safe RPC.
3. **Pengesahan LPJ belum otomatis mengunci kegiatan di SQL.** Trigger sinkronisasi kini membuat LPJ approved → phase `completed` + `financial_locked=true`; reopen → phase `lpj` + unlocked.
4. **Humas nonaktif masih bisa lolos beberapa RLS berbasis assignment.** Semua jalur Humas kini mensyaratkan profile aktif + role `humas`.
5. **Self-signup berpotensi menjadi Humas aktif.** User tanpa role valid di `raw_app_meta_data` kini dibuat `is_active=false`.
6. **Username auth collision dapat menggagalkan trigger.** Ditambah fallback suffix UUID.
7. **Assignment area unik sebelumnya case-sensitive.** Kini `RT 01` dan `rt 01` dianggap scope yang sama.
8. **Cash reconciliation belum memiliki constraint saldo dan cross-table guard.** Kini expected/physical non-negatif, difference wajib konsisten, dan assignment harus cocok dengan activity + Humas.
9. **Permission assignment masih bisa berubah pada kegiatan terkunci.** Kini diblokir.
10. **RAB masih bisa dihapus walau sudah punya histori pengeluaran.** Kini diblokir seperti prototype.
11. **Cover media belum dipaksa foto.** Kini `is_cover=true` hanya valid untuk media `photo`.
12. **Status transaksi belum cukup ketat.** Ditambah invariant untuk `received_by_humas`, income pending, actor verifikasi, dan penerima handover terverifikasi.
13. **Lock fields kegiatan dapat diubah langsung jika memakai grant table-level.** Kini metadata lock tidak diberikan sebagai direct PostgREST update; lifecycle sensitif disiapkan lewat RPC.
14. **Status laporan sensitif masih direct-write.** Insert/update laporan direvoke dari client pada Phase 01B; Phase 02 akan menyediakan RPC Admin yang memerlukan alasan untuk reopen dan audit atomik.
15. **Structural write belum menjamin audit.** Ditambah append-oriented structural audit trigger untuk perubahan non-finansial utama.

## Sengaja belum dikerjakan

- Supabase client / `.env`
- login production
- RPC transaksi keuangan
- RPC lifecycle laporan/LPJ
- public finance aggregate
- CMS/Keabsahan/Kepengurusan persistence ke Supabase
- ImageKit upload melalui Supabase Edge Function
- Android offline sync

Tidak ada file UI/TSX yang diubah pada koreksi ini.
