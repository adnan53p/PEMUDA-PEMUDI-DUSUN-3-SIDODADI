import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buildWhatsAppLink } from '../config/whatsapp'

export default function FinalCTA() {
  const joinLink = buildWhatsAppLink('gabung')
  return (
    <section className="section-rule bg-white">
      <div className="container-content py-16 md:py-20">
        <div className="grid overflow-hidden bg-forest text-white lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="px-7 py-12 md:px-10 md:py-14 lg:px-14">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-white/65">#MulaiDariLingkungan</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-.045em] md:text-5xl">Ruang kecil bisa melahirkan dampak yang besar.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/72">Jadi bagian dari kegiatan sosial, budaya, olahraga, dan pemberdayaan Pemuda Dusun 3 Sidodadi.</p>
          </div>
          <div className="border-t border-white/20 px-7 py-8 lg:border-l lg:border-t-0 lg:px-10 lg:py-14">
            <div className="flex flex-wrap gap-3 lg:flex-col">
              {joinLink ? <a href={joinLink} target="_blank" rel="noopener noreferrer" className="btn bg-white text-forest">Gabung Sekarang <ArrowUpRight size={16}/></a> : <span className="btn bg-white/80 text-forest">Gabung Sekarang</span>}
              <Link to="/keuangan" className="btn btn-ghost-light">Lihat Transparansi</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
