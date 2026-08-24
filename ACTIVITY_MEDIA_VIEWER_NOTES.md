# Activity Media Viewer — Pre-Backend

Perubahan ini melanjutkan media kegiatan tanpa menyentuh Supabase atau credential Cloudflare.

## Publik /kegiatan/:id
- Galeri foto sekarang membuka lightbox di halaman, bukan tab baru.
- Lightbox mendukung tombol sebelumnya/berikutnya, ESC, dan tombol tutup.
- Jumlah foto/video ditampilkan pada header dokumentasi.
- Video YouTube/Google Drive tidak langsung membuat iframe saat halaman dibuka.
- Iframe baru dimuat setelah pengunjung menekan Play sehingga halaman kegiatan lebih ringan.
- YouTube menampilkan thumbnail sebelum diputar.
- Google Drive menggunakan placeholder ringan sebelum diputar.
- Tidak ada autoplay.

## Batas fase saat ini
- Foto ImageKit dapat diunggah langsung dari Admin melalui Supabase Edge Function terautentikasi. URL manual tetap tersedia sebagai fallback.
- Bukti transaksi disimpan sebagai private file ImageKit dan dibuka melalui signed URL singkat setelah session/izin diverifikasi.
- Video tetap berupa link YouTube/Google Drive; tidak diupload ke Supabase atau ImageKit.
