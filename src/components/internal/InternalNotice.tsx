import { ShieldCheck } from 'lucide-react'
import { SUPABASE_CONFIGURED } from '../../lib/supabaseClient'
import { useOperations } from '../../prototype/OperationsContext'

export default function InternalNotice() {
  const { loading, syncError } = useOperations()

  if (SUPABASE_CONFIGURED && !loading && !syncError) return null

  return (
    <div className="flex gap-3 border border-[#E8D8B7] bg-[#FFF9EC] px-4 py-3 text-xs leading-relaxed text-[#6F5830]">
      <ShieldCheck size={17} className="mt-0.5 shrink-0" />
      <p>
        {SUPABASE_CONFIGURED ? (
          syncError ? (
            <><strong>Data belum berhasil dimuat.</strong> Muat ulang halaman. Jika masalah tetap terjadi, hubungi pengelola website.</>
          ) : (
            <><strong>Memuat data.</strong> Informasi operasional dan keuangan sedang disiapkan.</>
          )
        ) : (
          <><strong>Layanan data belum tersedia.</strong> Hubungi pengelola website untuk mengaktifkan akses.</>
        )}
      </p>
    </div>
  )
}
