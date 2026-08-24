# Pre-Supabase Data Model — PEMUDA DUSUN 3 SIDODADI

Status: **blueprint only / belum terhubung Supabase**.

Tahap ini menyiapkan bentuk data production-ready tanpa menambahkan Supabase client, environment key, Auth production, RLS, Storage, API call, atau migrasi aktif.

## Prinsip yang dikunci

1. **One transaction = one source of truth.** Iuran, pemasukan lain, pembelanjaan, dan serah kas berasal dari satu tabel transaksi.
2. **Iuran bersifat sukarela.** Tidak ada `target_amount` pada warga maupun Humas.
3. **Kas Humas berbeda dengan Kas Kegiatan.** Kas Humas baru menjadi Kas Kegiatan setelah serah kas dikonfirmasi Admin.
4. **Pembelanjaan Humas perlu verifikasi Admin.** Iuran warga tidak diverifikasi satu per satu.
5. **Koreksi tidak menghapus histori.** Transaksi dibatalkan/dikoreksi tetap tersimpan dan saling terhubung.
6. **RAB hanya menyimpan rencana.** Nilai terpakai/realisasi dihitung dari transaksi pengeluaran terverifikasi, bukan disimpan sebagai angka manual kedua.
7. **Panitia selalu per kegiatan.** Tidak ada struktur panitia global yang otomatis dipakai semua kegiatan.
8. **Humas selalu per kegiatan.** Permission melekat pada assignment kegiatan, bukan role global.
9. **Warga menjadi master internal.** Assignment iuran kegiatan menghubungkan kegiatan + Humas + warga dengan unique constraint per kegiatan/warga.
10. **Media file dipisahkan dari database.** Database hanya menyimpan referensi. Foto kegiatan diarahkan ke ImageKit; video ke YouTube atau Google Drive.
11. **LPJ yang disahkan mengunci keuangan kegiatan.** Unlock untuk koreksi harus beralasan dan masuk audit.
12. **Audit trail append-oriented.** Actor, waktu, entity, alasan, before/after disiapkan untuk produksi.

## Tabel inti yang disiapkan

| Tabel | Fungsi |
|---|---|
| `organization_periods` | periode kepengurusan |
| `profiles` | profil Superadmin/Admin/Humas; nanti 1:1 dengan Supabase Auth |
| `activities` | master kegiatan dan lifecycle |
| `activity_committee_members` | struktur panitia berbeda untuk setiap kegiatan |
| `humas_assignments` | Humas yang ditugaskan pada kegiatan/wilayah |
| `humas_assignment_permissions` | permission Iuran/Belanja/Serah Kas per assignment |
| `community_members` | master warga/keluarga internal |
| `activity_collection_targets` | daftar warga yang ditugaskan ke Humas pada kegiatan |
| `budget_items` | item RAB / nominal rencana |
| `financial_transactions` | sumber utama semua transaksi keuangan |
| `transaction_evidence` | referensi bukti transaksi |
| `cash_reconciliations` | tutup kas / pencocokan kas fisik Humas |
| `activity_reports` | laporan dan LPJ kegiatan |
| `activity_media` | referensi cover, galeri, dan video kegiatan |
| `audit_logs` | histori perubahan penting |

## Relasi inti

```text
profiles
   └── humas_assignments ── activities
             ├── humas_assignment_permissions
             └── activity_collection_targets ── community_members

activities
   ├── activity_committee_members
   ├── budget_items
   ├── financial_transactions
   │       └── transaction_evidence
   ├── cash_reconciliations
   ├── activity_reports
   └── activity_media
```

## Data yang sengaja TIDAK disimpan sebagai angka kedua

- `RAB realized` → dihitung dari pengeluaran yang sah.
- `Kas di tangan Humas` → dihitung dari iuran diterima + transaksi relevan - serah kas - belanja dari Kas Humas.
- `Kas Kegiatan` → dihitung dari pemasukan langsung + serah kas terverifikasi - pengeluaran dari Kas Kegiatan.
- `Total iuran` → dihitung dari transaksi iuran yang sah.
- `Progress kontribusi warga` → dihitung dari target warga vs transaksi iuran sah.

Ini mencegah data rangkap dan saldo berbeda antarhalaman.

## Perubahan penting dari prototype

### `OperationActivity.budgetTarget`
Field ini bersifat transisional. Production sebaiknya menggunakan:

`TOTAL RAB = SUM(budget_items.planned_amount)`

Bukan menyimpan target anggaran kedua di tabel kegiatan.

### `CollectionTarget.name`
Prototype masih menyimpan nama warga langsung pada target. Production menjadi:

`activity_collection_targets.member_id -> community_members.id`

Sehingga perubahan ejaan nama warga tidak memutus histori.

### `BudgetItem.realized`
Production tidak menyimpan `realized`. Nilai terpakai dihitung dari transaksi pengeluaran terverifikasi sesuai `activity_id + category`.

### Media
Production menyimpan provider + URL/file ID. File besar tidak ditempatkan di row database.

- foto: `imagekit`
- video: `youtube` atau `google_drive`

## Status machine vs label UI

Database disarankan memakai nilai stabil berbahasa mesin, UI tetap Bahasa Indonesia.

Contoh:

- `received_by_humas` → **Diterima Humas**
- `pending_verification` → **Menunggu Verifikasi** / untuk serah kas UI dapat menampilkan **Menunggu Konfirmasi Admin**
- `verified` → **Terverifikasi**
- `cancelled` → **Dibatalkan**

Cara ini mencegah migrasi database hanya karena teks UI berubah.

## Rule integritas yang wajib ada saat backend diaktifkan

- nominal transaksi > 0 dan integer Rupiah;
- satu warga hanya satu assignment iuran per kegiatan (`unique activity_id, member_id`);
- satu kategori RAB unik dalam kegiatan (case-insensitive);
- transaksi iuran Humas wajib mempunyai `assignment_id` dan `collection_target_id`;
- transaksi iuran tidak menggunakan status `pending_verification`;
- pembelanjaan wajib mempunyai `funding_source`;
- transaksi dibatalkan wajib mempunyai alasan;
- transaksi/struktur panitia/RAB tidak boleh diubah pada kegiatan terkunci kecuali workflow unlock resmi;
- hanya satu foto cover publik per kegiatan;
- LPJ approved harus mencatat actor dan timestamp;
- seluruh write penting menghasilkan audit log.

## Yang belum dilakukan pada tahap ini

- Supabase client;
- `.env` Supabase;
- membuat project/table Supabase;
- menjalankan SQL;
- Auth production;
- Row Level Security;
- Storage Supabase;
- ImageKit signed upload;
- webhook/notifikasi;
- offline sync Android.

Dengan demikian UI prototype tetap berjalan seperti sebelumnya, tetapi bentuk data yang akan dipakai backend sudah mempunyai tujuan yang jelas.
