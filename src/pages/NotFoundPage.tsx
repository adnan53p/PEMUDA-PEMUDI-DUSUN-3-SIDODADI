import { ArrowLeft, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="bg-offwhite">
      <div className="container-content flex min-h-[70vh] items-center py-20">
        <div className="max-w-2xl">
          <p className="eyebrow text-forest">404 · HALAMAN TIDAK DITEMUKAN</p>
          <h1 className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] text-charcoal md:text-7xl">Alamat yang Anda buka tidak tersedia.</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">Periksa kembali alamat halaman atau kembali ke beranda PEMUDA DUSUN 3 SIDODADI.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/" className="btn btn-primary"><Home size={16}/> Beranda</Link><button type="button" onClick={() => window.history.back()} className="btn btn-secondary"><ArrowLeft size={16}/> Kembali</button></div>
        </div>
      </div>
    </section>
  )
}
