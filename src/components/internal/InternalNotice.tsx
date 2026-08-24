import { ShieldCheck } from 'lucide-react'
import { SUPABASE_CONFIGURED } from '../../lib/supabaseClient'
import { MEDIA_UPLOAD_CONFIGURED } from '../../data/mediaUploadService'
import { useOperations } from '../../prototype/OperationsContext'

export default function InternalNotice() {
  const { loading, syncError } = useOperations()

  return (
    <div className="flex gap-3 border border-[#E8D8B7] bg-[#FFF9EC] px-4 py-3 text-xs leading-relaxed text-[#6F5830]">
      <ShieldCheck size={17} className="mt-0.5 shrink-0" />
      <p>
        {SUPABASE_CONFIGURED ? (
          syncError ? (
            <><strong>Sinkronisasi Supabase belum berhasil.</strong> Muat ulang halaman. Jika tetap gagal, cek migrasi Phase 03 dan koneksi project Supabase.</>
          ) : loading ? (
            <><strong>Memuat Supabase.</strong> Data operasional dan keuangan sedang disinkronkan.</>
          ) : (
            <><strong>Supabase Phase 03 aktif.</strong> Login, kegiatan, penugasan, iuran, pembelanjaan, serah kas, RAB, laporan, dan metadata media memakai Supabase dengan RLS/RPC. {MEDIA_UPLOAD_CONFIGURED ? 'Foto dan bukti biner dikirim ke ImageKit melalui Edge Function terautentikasi.' : 'Supabase belum dikonfigurasi; metadata tetap aman dan upload biner belum aktif.'}</>
          )
        ) : (
          <><strong>Mode prototype frontend.</strong> Supabase belum dikonfigurasi, sehingga akun dan data uji masih berjalan lokal dan dapat reset setelah halaman direfresh.</>
        )}
      </p>
    </div>
  )
}
