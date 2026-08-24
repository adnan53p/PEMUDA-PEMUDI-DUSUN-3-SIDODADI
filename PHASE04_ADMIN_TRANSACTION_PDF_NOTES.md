# Phase 04 — PDF Transaksi Admin

Fitur yang ditambahkan:

- Setiap transaksi **Iuran/Pemasukan** dan **Pembelanjaan/Pengeluaran** pada area Admin memiliki aksi **PDF** dan **Bagikan**.
- Aksi tersedia pada:
  - Admin → Laporan & LPJ → Laporan per Humas
  - Admin → RAB & Keuangan → Transaksi Kegiatan
  - Admin → Bukti Transaksi
  - Admin → Verifikasi (detail transaksi yang dipilih)
- PDF dibuat langsung di browser tanpa dependency tambahan.
- Isi PDF membawa ID transaksi, kegiatan, status, nominal, Humas/penginput, wilayah/tugas, waktu, kategori, bukti, dan detail pembelanjaan bila tersedia.
- **Bagikan PDF** memakai Web Share API file sharing. Pada Android/Chrome dan WebView yang mendukung, share sheet perangkat akan terbuka sehingga PDF dapat dikirim ke WhatsApp/aplikasi lain.
- Jika browser/perangkat tidak mendukung file sharing, tombol Bagikan otomatis fallback menjadi download PDF.
- Download menggunakan Blob + object URL sehingga bekerja pada web desktop dan Android browser modern.
- Tidak ada library PDF baru dan tidak ada perubahan ke database/Supabase.

Catatan produksi:

- Web Share API pada deployment publik memerlukan secure context (HTTPS). `localhost` tetap diperbolehkan untuk development.
- Status transaksi dicetak jelas di PDF. PDF ini adalah catatan transaksi sistem, bukan kuitansi yang mengubah status verifikasi.
