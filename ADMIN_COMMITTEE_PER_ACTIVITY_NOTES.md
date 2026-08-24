# Admin — Struktur Kepanitiaan Per Kegiatan

Perbaikan ini menegaskan bahwa struktur panitia bukan data organisasi global. Setiap kegiatan memiliki susunan panitia sendiri berdasarkan `activityId`.

## Perubahan
- Tombol pada kartu kegiatan diperjelas menjadi **Struktur Panitia**.
- Struktur muncul langsung di bawah kegiatan yang dipilih, tidak lagi jauh di bawah seluruh daftar.
- Kartu kegiatan menampilkan jumlah panitia dan jumlah Humas secara terpisah.
- Jabatan/bidang panitia sekarang bebas diketik, dengan saran jabatan umum melalui datalist.
- Susunan satu kegiatan tidak otomatis dipakai untuk kegiatan lain.
- Setelah LPJ disahkan dan kegiatan dikunci, tambah/ubah/hapus panitia ikut terkunci dan dilindungi di UI serta OperationsContext.
- Data panitia tetap menjadi sumber yang sama untuk draft LPJ.

Tidak ada Supabase/backend yang ditambahkan.
