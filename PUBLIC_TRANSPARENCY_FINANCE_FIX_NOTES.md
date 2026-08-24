# Public Transparency Finance Fix

Perbaikan ini menutup regresi angka pada halaman detail kegiatan publik tanpa mengubah schema/database Phase 03.

## Yang diperbaiki

1. Ringkasan keuangan publik memakai satu selector terpusat (`src/prototype/financeSelectors.ts`).
   - Pemasukan = seluruh income sah (`Diterima Humas` atau `Terverifikasi`).
   - Pengeluaran = seluruh expense terverifikasi.
   - Sisa Dana = Pemasukan - Pengeluaran.
   - Posisi Kas Kegiatan tetap dihitung terpisah untuk halaman keuangan organisasi.
2. Data operasional otomatis diperbarui lintas-tab setelah mutation melalui `BroadcastChannel` + `storage` fallback.
3. Saat tab/window kembali aktif, snapshot Supabase dimuat ulang secara silent.
4. Ada fallback refresh silent setiap 15 detik selama tab terlihat, sehingga halaman publik tidak tertinggal lama bila perubahan dilakukan dari perangkat/tab lain.
5. Layout empat angka transparansi di detail kegiatan dibuat 2x2 agar tidak menyisakan blok kosong pada desktop.

## Contoh kasus yang diperbaiki

Pemasukan Rp 1.100.000 dan pengeluaran Rp 1.040.000 menghasilkan Sisa Dana Rp 60.000, bukan -Rp 1.040.000.

## Database

Tidak ada migration SQL baru untuk perbaikan ini. Migration Phase 03 yang sudah diterapkan tidak perlu dijalankan ulang.
