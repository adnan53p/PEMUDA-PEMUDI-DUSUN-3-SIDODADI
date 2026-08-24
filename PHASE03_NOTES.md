# PEMUDA DUSUN 3 SIDODADI — Phase 02 Polish + Phase 03 Public Kegiatan

## Phase 02 Polish
- Profil diperkuat dengan fotografi editorial, cerita organisasi, visi-misi, nilai, jejak organisasi, dan CTA internal.
- Keabsahan dirapikan menjadi arsip dokumen publik yang lebih kredibel dengan kategori, status, preview PDF, dan prinsip privasi dokumen.
- Kepengurusan ditingkatkan menjadi bagan desktop + hierarchy mobile, tanpa mengarang nama pengurus yang belum diberikan.

## Phase 03 — Public Kegiatan
- Route `/kegiatan` dengan featured activity, pencarian, filter kategori, dan filter status.
- Route `/kegiatan/:activityId` sebagai editorial impact story.
- Detail kegiatan mencakup tujuan/cerita, peserta, transparansi anggaran, RAB vs realisasi, kepanitiaan, pembelanjaan publik, dokumentasi, dan status laporan/LPJ.
- Route `/dokumentasi` dengan galeri masonry/filter yang terhubung kembali ke kegiatan.
- Homepage Kegiatan dan Dokumentasi sekarang mengarah ke route publik yang nyata.

## Data
Seluruh angka, nama kegiatan, nominal, peserta, tanggal, serta status pada Phase 03 masih mock data untuk UI/UX dan harus diganti dengan data organisasi terverifikasi sebelum publikasi resmi.

## Belum Dibangun
- Login / authentication
- Superadmin / Admin / Humas workspace
- Database / Supabase
- Permission per kegiatan
- Input iuran real-time
- Pembelanjaan real-time
- Kas di tangan Humas vs Kas Kegiatan
- Audit trail transaksi
- Generator LPJ otomatis

Fitur di atas sengaja ditahan untuk phase internal berikutnya.

## Phase 03 Correction Pass
- Seluruh visual utama kegiatan diganti ke foto yang relevan dengan konteks Indonesia, terutama perayaan kemerdekaan, futsal pemuda, usaha lokal, dan persiapan kegiatan kampung.
- Foto Santorini/non-Indonesia di modul Kegiatan dihapus.
- Nama featured activity dikonsistenkan menjadi "Festival Kemerdekaan Dusun 3 Sidodadi 2026".
- Badge kategori dibuat konsisten dengan badge status.
- Featured activity ditambah ringkasan dampak: peserta, bidang panitia, dan dana terkumpul.
- Detail kegiatan ditambah lifecycle visual: Perencanaan → Penggalangan/Iuran → Berlangsung → Penyelesaian → LPJ → Selesai.
- Detail kegiatan ditambah CTA "Bagikan via WhatsApp" yang tidak bergantung pada nomor WhatsApp organisasi.
- Hero detail kegiatan diperbaiki untuk wrapping mobile dan overlay yang lebih ringan.
- Homepage hero, featured activity, dan dokumentasi juga diarahkan ke foto komunitas Indonesia agar identitas visual tidak kembali generik.

### Sumber foto development
Foto development memakai foto Unsplash berlisensi Unsplash dan dipilih karena konteksnya memang Indonesia (Tasikmalaya/West Java, Bogor/West Java, Surabaya, dll.). Untuk produksi final, foto asli PEMUDA DUSUN 3 SIDODADI tetap menjadi prioritas pengganti.
