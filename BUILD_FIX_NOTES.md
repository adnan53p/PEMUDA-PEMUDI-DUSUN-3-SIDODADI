# Build Fix Notes

Perubahan minimum setelah verifikasi build lokal pengguna:

1. Menghapus `selectedTargetState` yang tidak digunakan di `HumasWorkspace.tsx`.
2. Mengubah konstruksi `Blob` XLSX di `reportExport.ts` menjadi salinan `ArrayBuffer` eksplisit agar kompatibel dengan tipe `BlobPart` TypeScript terbaru.
3. Tidak menambahkan `FinanceTransparency.tsx`. File tersebut tidak termasuk source audited dan jika muncul pada folder lokal berarti file sisa dari ekstraksi/versi lama.

Tidak ada perubahan UI, alur transaksi, role, RLS, atau schema Supabase.
