import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SITE_IDENTITY } from '../config/site'
import { homepageSectionItems } from '../data/internal/cmsData'
import { mainNavigation, type NavigationItem } from '../data/navigation'
import { legalityDocuments, type LegalityDocument } from '../data/organizationData'
import { fetchSiteMedia, type SiteMediaRecord, type SiteMediaSlot } from '../data/siteMediaRepository'

export interface SiteColors {
  primary: string
  deep: string
  surface: string
  warm: string
  sage: string
  text: string
}

export interface SiteIdentity {
  name: string
  shortName: string
  locationLabel: string
  email: string
}

export interface HomepageContent {
  headline: string
  subheadline: string
  primaryCta: string
  secondaryCta: string
}

export interface ManagedHomepageSection {
  id: string
  title: string
  description: string
  visible: boolean
}

export type ManagedNavigationItem = NavigationItem & { visible: boolean }

export interface ManagedDocument extends LegalityDocument {
  publicVisible: boolean
}

export type SiteMediaMap = Record<SiteMediaSlot, SiteMediaRecord>

interface SiteContentContextValue {
  identity: SiteIdentity
  setIdentity: (value: SiteIdentity) => void
  homepage: HomepageContent
  setHomepage: (value: HomepageContent) => void
  sections: ManagedHomepageSection[]
  setSections: (value: ManagedHomepageSection[]) => void
  colors: SiteColors
  setColors: (value: SiteColors) => void
  navigation: ManagedNavigationItem[]
  setNavigation: (value: ManagedNavigationItem[]) => void
  documents: ManagedDocument[]
  setDocuments: (value: ManagedDocument[]) => void
  siteMedia: SiteMediaMap
  refreshSiteMedia: () => Promise<void>
  isSectionVisible: (id: string) => boolean
}

const initialColors: SiteColors = {
  primary: '#1E3A8A',
  deep: '#162A63',
  surface: '#FFFFFF',
  warm: '#F6F7F9',
  sage: '#EEF2F7',
  text: '#171717',
}

const initialIdentity: SiteIdentity = {
  name: SITE_IDENTITY.name,
  shortName: SITE_IDENTITY.shortName,
  locationLabel: SITE_IDENTITY.locationLabel,
  email: SITE_IDENTITY.email,
}

const initialHomepage: HomepageContent = {
  headline: 'BERSAMA\nMEMBANGUN\nDESA',
  subheadline: 'Pemuda Dusun 3 Sidodadi yang aktif, transparan, dan bergerak bersama masyarakat.',
  primaryCta: 'Lihat Kegiatan',
  secondaryCta: 'Transparansi Keuangan',
}

const initialNavigation: ManagedNavigationItem[] = mainNavigation.map((item) => ({ ...item, visible: true }))

const initialDocuments: ManagedDocument[] = legalityDocuments.map((document) => ({
  ...document,
  publicVisible: document.id === 'contoh-preview',
}))

const initialSiteMedia: SiteMediaMap = {
  hero: {
    slot: 'hero',
    title: 'Foto utama beranda',
    url: 'https://images.unsplash.com/photo-1660749414248-a59e87e49862?q=80&w=2200&auto=format&fit=crop',
    externalFileId: '',
    publicVisible: true,
  },
  profile: {
    slot: 'profile',
    title: 'Foto profil organisasi',
    url: 'https://images.unsplash.com/photo-1660749411531-1efe3e9c6fd1?q=80&w=1800&auto=format&fit=crop',
    externalFileId: '',
    publicVisible: true,
  },
  organization: {
    slot: 'organization',
    title: 'Foto kepengurusan',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop',
    externalFileId: '',
    publicVisible: true,
  },
}


const SiteContentContext = createContext<SiteContentContextValue | null>(null)

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<SiteIdentity>(initialIdentity)
  const [homepage, setHomepage] = useState<HomepageContent>(initialHomepage)
  const [sections, setSections] = useState<ManagedHomepageSection[]>(() => homepageSectionItems.map((item) => ({ ...item, visible: Boolean(item.visible) })))
  const [colors, setColors] = useState<SiteColors>(initialColors)
  const [navigation, setNavigation] = useState<ManagedNavigationItem[]>(initialNavigation)
  const [documents, setDocuments] = useState<ManagedDocument[]>(initialDocuments)
  const [siteMedia, setSiteMedia] = useState<SiteMediaMap>(initialSiteMedia)


  const refreshSiteMedia = async () => {
    try {
      const rows = await fetchSiteMedia()
      if (!rows.length) return
      setSiteMedia((current) => {
        const next = { ...current }
        rows.forEach((row) => { next[row.slot] = row })
        return next
      })
    } catch (error) {
      console.warn('Site media belum dapat dimuat.', error)
    }
  }

  useEffect(() => {
    void refreshSiteMedia()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-forest', colors.primary)
    root.style.setProperty('--color-forest-deep', colors.deep)
    root.style.setProperty('--color-offwhite', colors.surface)
    root.style.setProperty('--color-warmwhite', colors.warm)
    root.style.setProperty('--color-sage', colors.sage)
    root.style.setProperty('--color-charcoal', colors.text)
  }, [colors])

  const value = useMemo<SiteContentContextValue>(() => ({
    identity,
    setIdentity,
    homepage,
    setHomepage,
    sections,
    setSections,
    colors,
    setColors,
    navigation,
    setNavigation,
    documents,
    setDocuments,
    siteMedia,
    refreshSiteMedia,
    isSectionVisible: (id: string) => sections.find((section) => section.id === id)?.visible ?? true,
  }), [identity, homepage, sections, colors, navigation, documents, siteMedia])

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  const value = useContext(SiteContentContext)
  if (!value) throw new Error('useSiteContent harus digunakan di dalam SiteContentProvider')
  return value
}
