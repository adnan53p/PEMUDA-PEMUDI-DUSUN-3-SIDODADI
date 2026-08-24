import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, PlayCircle, X } from 'lucide-react'
import type { PublicActivityVideo } from '../data/activityData'

interface Props {
  title: string
  shortTitle: string
  gallery: string[]
  videos?: PublicActivityVideo[]
}

export default function PublicActivityMedia({ title, shortTitle, gallery, videos = [] }: Props) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  useEffect(() => {
    if (activePhoto === null) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePhoto(null)
      if (event.key === 'ArrowLeft') {
        setActivePhoto((current) => current === null ? null : (current - 1 + gallery.length) % gallery.length)
      }
      if (event.key === 'ArrowRight') {
        setActivePhoto((current) => current === null ? null : (current + 1) % gallery.length)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activePhoto, gallery.length])

  const closePhoto = () => setActivePhoto(null)
  const previousPhoto = () => setActivePhoto((current) => current === null ? null : (current - 1 + gallery.length) % gallery.length)
  const nextPhoto = () => setActivePhoto((current) => current === null ? null : (current + 1) % gallery.length)

  return (
    <>
      <section className="bg-offwhite">
        <div className="container-content py-16 md:py-24">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-forest">DOKUMENTASI</p>
              <h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">Foto & video kegiatan.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Dokumentasi setiap kegiatan disimpan sebagai koleksi tersendiri. Foto dapat dibuka penuh, sedangkan video baru dimuat setelah tombol putar ditekan agar halaman tetap ringan.</p>
            </div>
            <div className="flex gap-2 text-xs font-bold text-muted">
              <span className="border border-border-soft bg-white px-3 py-2"><Images size={14} className="mr-1.5 inline" />{gallery.length} foto</span>
              <span className="border border-border-soft bg-white px-3 py-2"><PlayCircle size={14} className="mr-1.5 inline" />{videos.length} video</span>
            </div>
          </div>

          {gallery.length ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActivePhoto(index)}
                  className={`group relative overflow-hidden bg-warmwhite text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${index === 0 && gallery.length > 2 ? 'sm:col-span-2 lg:row-span-2' : ''}`}
                  aria-label={`Buka foto dokumentasi ${index + 1} dari ${gallery.length}`}
                >
                  <img
                    src={image}
                    alt={`Dokumentasi ${shortTitle} ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className={`w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02] ${index === 0 && gallery.length > 2 ? 'h-80 sm:h-[28rem] lg:h-full lg:min-h-[30rem]' : 'h-64 md:h-72'}`}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/65 to-transparent px-4 pb-4 pt-12 text-white">
                    <span className="text-xs font-bold">Foto {index + 1}</span>
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-white/80">Buka</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-border-soft bg-white p-8 text-sm text-muted">Belum ada foto dokumentasi yang dipublikasikan untuk kegiatan ini.</div>
          )}

          {videos.length ? (
            <div className="mt-14 border-t border-border-soft pt-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow text-forest">VIDEO KEGIATAN</p>
                  <h3 className="mt-3 text-2xl font-extrabold text-charcoal md:text-3xl">Dokumentasi bergerak dari kegiatan.</h3>
                </div>
                <p className="max-w-md text-xs leading-relaxed text-muted">Video tidak autoplay. YouTube dan Google Drive hanya dimuat saat pengunjung memilih video.</p>
              </div>

              <div className="mt-7 grid gap-6 lg:grid-cols-2">
                {videos.map((video) => {
                  const isActive = activeVideoId === video.id
                  return (
                    <article key={video.id} className="overflow-hidden border border-border-soft bg-white">
                      <div className="aspect-video bg-charcoal">
                        {isActive ? (
                          <iframe
                            src={video.embedUrl}
                            title={video.title}
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="h-full w-full border-0"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveVideoId(video.id)}
                            className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-forest-deep text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage"
                            aria-label={`Putar ${video.title}`}
                          >
                            {video.thumbnailUrl ? (
                              <img src={video.thumbnailUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.02]" />
                            ) : (
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_45%)]" />
                            )}
                            <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />
                            <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-forest shadow-lg transition-transform group-hover:scale-105"><PlayCircle size={30} /></span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
                        <div>
                          <h4 className="font-extrabold text-charcoal">{video.title}</h4>
                          <p className="mt-1 text-xs font-semibold text-muted">{video.provider === 'youtube' ? 'YouTube' : 'Google Drive'}</p>
                        </div>
                        {isActive && <button type="button" onClick={() => setActiveVideoId(null)} className="shrink-0 text-xs font-extrabold text-forest">Tutup video</button>}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {activePhoto !== null && gallery[activePhoto] ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 px-3 py-4 sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto dokumentasi ${title}`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closePhoto()
          }}
        >
          <button type="button" onClick={closePhoto} className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Tutup foto"><X size={22} /></button>
          {gallery.length > 1 && <button type="button" onClick={previousPhoto} className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-5" aria-label="Foto sebelumnya"><ChevronLeft size={26} /></button>}
          <div className="flex max-h-full max-w-6xl flex-col items-center">
            <img src={gallery[activePhoto]} alt={`Dokumentasi ${shortTitle} ${activePhoto + 1}`} className="max-h-[82vh] max-w-full object-contain" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-white/70">Foto {activePhoto + 1} dari {gallery.length}</p>
          </div>
          {gallery.length > 1 && <button type="button" onClick={nextPhoto} className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-5" aria-label="Foto berikutnya"><ChevronRight size={26} /></button>}
        </div>
      ) : null}
    </>
  )
}
