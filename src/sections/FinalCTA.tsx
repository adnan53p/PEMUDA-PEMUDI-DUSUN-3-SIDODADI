import { Link } from 'react-router-dom'
import { buildWhatsAppLink } from '../config/whatsapp'

export default function FinalCTA() {
  const joinLink = buildWhatsAppLink('gabung')

  return (
    <section className="bg-forest text-offwhite">
      <div className="container-content py-20 text-center md:py-28">
        <p className="eyebrow text-sage">Ambil Bagian</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.04em] md:text-4xl">
          Desa tumbuh ketika
          <br /> pemudanya ikut bergerak.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-offwhite/75">
          Jadi bagian dari kegiatan sosial, budaya, olahraga, dan pemberdayaan yang tumbuh bersama warga Dusun 3 Sidodadi.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {joinLink ? (
            <a
              href={joinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-offwhite text-forest hover:bg-sage"
            >
              Gabung Sekarang
            </a>
          ) : (
            <span
              className="btn cursor-not-allowed bg-offwhite/70 text-forest/70"
              aria-disabled="true"
              title="Nomor WhatsApp resmi belum dikonfigurasi"
            >
              Gabung Sekarang
            </span>
          )}
          <Link to="/keuangan" className="btn btn-ghost-light">
            Lihat Transparansi
          </Link>
        </div>
      </div>
    </section>
  )
}
