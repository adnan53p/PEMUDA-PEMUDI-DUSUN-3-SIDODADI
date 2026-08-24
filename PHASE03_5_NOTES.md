# Phase 03.5 — Public Finance Separation

## Perubahan utama
- Detail keuangan dihapus dari Homepage.
- Statistik Homepage tidak lagi menampilkan pemasukan/saldo; diganti metrik dampak non-keuangan.
- Dibuat halaman publik khusus `/keuangan` dengan posisi setara `/kegiatan`.
- Navbar, CTA Transparansi, Hero, Final CTA, dan Footer diarahkan ke `/keuangan`.
- Halaman `/keuangan` berisi ringkasan kas, grafik 6 bulan, sumber pemasukan, kategori pengeluaran, transaksi publik, filter periode/kegiatan, RAB vs realisasi per kegiatan, dan status laporan/LPJ.
- Data sensitif tidak ditampilkan; bukti hanya menunjukkan status publik.
- Semua data keuangan masih mock/development dan dipusatkan di `src/data/financeData.ts`.

## Belum dikerjakan
- Backend / Supabase
- Login / role
- Input transaksi real-time
- Verifikasi transaksi
- Audit log
- Kas di tangan Humas vs kas kegiatan
- Serah terima kas
- LPJ otomatis

## Prinsip dipertahankan
ONE TRANSACTION = ONE SOURCE OF TRUTH. Ketika backend dibuat, `/keuangan`, `/kegiatan`, laporan, dan LPJ harus membaca sumber transaksi yang sama, bukan menyimpan salinan data terpisah.
