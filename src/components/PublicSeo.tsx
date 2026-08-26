import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteContent } from '../prototype/SiteContentContext'
import type { SeoPageContent } from '../data/publicContentRepository'

function ensureMeta(selector: string, attrs: Record<string, string>) {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    document.head.appendChild(tag)
  }
  Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value))
}

function ensureLink(rel: string, href: string) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel
    document.head.appendChild(tag)
  }
  tag.href = href
}

function upsertOrganizationSchema(name: string, description: string, url: string, image: string) {
  const id = 'organization-jsonld'
  let tag = document.getElementById(id) as HTMLScriptElement | null
  if (!tag) {
    tag = document.createElement('script')
    tag.id = id
    tag.type = 'application/ld+json'
    document.head.appendChild(tag)
  }
  tag.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description,
    url,
    ...(image ? { image, logo: image } : {}),
  })
}

export default function PublicSeo() {
  const { pathname } = useLocation()
  const { managedPublicContent, siteMedia } = useSiteContent()
  const seo = managedPublicContent.seo

  const resolved = useMemo(() => {
    let page: SeoPageContent = seo.pages.home
    let image = seo.defaultOgImage || siteMedia.hero.url || ''

    if (pathname === '/profil') page = seo.pages.profile
    else if (pathname === '/keabsahan') page = seo.pages.legality
    else if (pathname === '/kepengurusan') page = seo.pages.organization
    else if (pathname === '/kegiatan') page = seo.pages.activities
    else if (pathname === '/dokumentasi') page = seo.pages.documentation
    else if (pathname === '/keuangan') page = seo.pages.finance
    else if (pathname.startsWith('/kegiatan/')) {
      page = {
        title: `Detail Kegiatan | ${seo.organizationName}`,
        description: seo.pages.activities.description,
        keywords: seo.pages.activities.keywords,
      }
    } else if (pathname.startsWith('/bidang/')) {
      const slug = pathname.split('/').filter(Boolean)[1] || ''
      const program = managedPublicContent.programs.programs.find((item) => item.visible && item.slug === slug)
      if (program) {
        page = {
          title: program.seoTitle || `${program.title} | ${seo.organizationName}`,
          description: program.seoDescription || program.shortDescription,
          keywords: program.seoKeywords,
        }
        image = program.imageUrl || image
      }
    }

    const base = (seo.siteUrl || 'https://pemudadusun3.my.id').replace(/\/$/, '')
    const canonical = `${base}${pathname === '/' ? '/' : pathname}`
    return { page, image, canonical, base }
  }, [managedPublicContent.programs.programs, pathname, seo, siteMedia.hero.url])

  useEffect(() => {
    const { page, image, canonical, base } = resolved
    document.documentElement.lang = 'id'
    document.title = page.title
    ensureMeta('meta[name="description"]', { name: 'description', content: page.description })
    ensureMeta('meta[name="keywords"]', { name: 'keywords', content: page.keywords })
    ensureMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow, max-image-preview:large' })

    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: page.title })
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: page.description })
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: seo.organizationName })
    ensureMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'id_ID' })
    if (image) ensureMeta('meta[property="og:image"]', { property: 'og:image', content: image })

    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' })
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: page.title })
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: page.description })
    if (image) ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })

    ensureLink('canonical', canonical)
    upsertOrganizationSchema(seo.organizationName, seo.organizationDescription, base, image)
  }, [resolved, seo.organizationDescription, seo.organizationName])

  return null
}
