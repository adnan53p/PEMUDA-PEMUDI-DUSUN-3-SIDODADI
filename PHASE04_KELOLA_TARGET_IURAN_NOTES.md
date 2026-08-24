# Phase 04 — Kelola Target Iuran

## Implementasi
- Admin → Panitia & Humas sekarang memiliki tombol **Kelola Target** pada setiap penugasan yang memiliki permission Iuran.
- Admin dapat menambah target warga/keluarga satu per satu: nama, nominal, wilayah/RT.
- Target langsung berasal dari `OperationsContext`, sehingga otomatis muncul pada Workspace Humas sesuai `assignmentId`.
- Status target dihitung dari transaksi yang sama: Belum Ditagih → Menunggu Verifikasi → Belum Lunas / Sudah Bayar.
- Target yang sudah mempunyai histori transaksi tidak dapat dihapus.
- Duplikat nama pada assignment yang sama ditolak.
- Admin dapat import target massal dari **CSV** dan **XLSX** tanpa dependency tambahan.
- Disediakan download template CSV yang kompatibel dengan Excel/Google Sheets.
- Import mendukung kolom `Nama`, `Nominal`, `Wilayah`; duplikat/baris tidak valid dilewati.
- Ringkasan per assignment menampilkan target Humas, total target warga terdaftar, nilai terverifikasi, dan nilai menunggu verifikasi.

## Prinsip data
Nama pembayar tidak diketik bebas oleh Humas. Admin membuat target, lalu Humas hanya memilih target yang terikat ke penugasannya.

## Prototype
Data masih in-memory dan reset saat browser direfresh sampai Supabase diterapkan.
