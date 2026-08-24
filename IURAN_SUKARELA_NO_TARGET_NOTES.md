# Iuran Sukarela — Tanpa Target Rupiah

Perubahan ini mengubah model iuran agar sesuai kondisi nyata Pemuda Dusun 3 Sidodadi:

- Humas tidak memiliki target nominal/rupiah.
- Setiap warga/keluarga tidak memiliki nominal iuran wajib.
- Admin menugaskan Humas berdasarkan kegiatan, wilayah, dan daftar warga/keluarga.
- Humas hanya memilih warga/keluarga yang ditugaskan Admin lalu memasukkan nominal kontribusi yang benar-benar diterima.
- Satu warga/keluarga memiliki satu catatan kontribusi aktif per kegiatan pada prototype saat ini. Jika salah input, gunakan Koreksi/Batalkan agar audit trail tetap ada.
- Status publik/internal iuran: `Belum Berkontribusi` atau `Sudah Berkontribusi`.
- Progress Humas dihitung dari jumlah warga yang sudah berkontribusi dibanding jumlah warga yang ditugaskan, bukan dari target rupiah.
- Total iuran tetap dijumlahkan sebagai dana terkumpul dan masuk ke Kas di Tangan Humas sampai dilakukan serah-terima kas.
- RAB / Target Anggaran kegiatan tetap dipertahankan karena merupakan kebutuhan kegiatan, bukan target penarikan Humas.
- Website publik tidak menampilkan nama pembayar; hanya ringkasan partisipasi, wilayah/Humas, dan total iuran.
- Belum menggunakan Supabase; state prototype masih in-memory dan reset saat refresh.
