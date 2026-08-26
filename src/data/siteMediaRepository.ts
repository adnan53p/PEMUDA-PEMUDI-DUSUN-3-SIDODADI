import { supabase } from '../lib/supabaseClient'

export type SiteMediaSlot = 'hero' | 'profile' | 'organization'

export interface SiteMediaRecord {
  slot: SiteMediaSlot
  title: string
  url: string
  externalFileId: string
  publicVisible: boolean
}

function client() {
  if (!supabase) throw new Error('Layanan media website belum tersedia.')
  return supabase
}

export async function fetchSiteMedia(): Promise<SiteMediaRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('site_media')
    .select('slot,title,url,external_file_id,public_visible')
    .order('slot')
  if (error) {
    // Keep the public site usable before the Phase 05 site-media migration is applied.
    if (error.code === '42P01' || error.message?.toLowerCase().includes('site_media')) return []
    throw error
  }
  return (data ?? []).map((item) => ({
    slot: item.slot as SiteMediaSlot,
    title: item.title,
    url: item.url,
    externalFileId: item.external_file_id,
    publicVisible: Boolean(item.public_visible),
  }))
}

export async function upsertSiteMedia(input: SiteMediaRecord & { updatedByUserId: string }) {
  const { error } = await client().from('site_media').upsert({
    slot: input.slot,
    title: input.title,
    provider: 'imagekit',
    url: input.url,
    external_file_id: input.externalFileId,
    public_visible: input.publicVisible,
    updated_by_user_id: input.updatedByUserId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'slot' })
  if (error) throw error
}
