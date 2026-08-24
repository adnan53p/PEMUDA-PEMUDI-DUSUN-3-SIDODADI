import { useMemo } from 'react'
import { publicActivities as contentActivities, type ActivityStatus, type PublicActivity } from '../data/activityData'
import { isRecognizedTransaction, useOperations } from './OperationsContext'
import { summarizeActivityFinance } from './financeSelectors'
import { getActivityVideoEmbedUrl, getActivityVideoThumbnail } from './activityMedia'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1660749413245-20ebc39eb6cd?q=80&w=1800&auto=format&fit=crop'

function normalizeStatus(phase: string): ActivityStatus {
  if (phase === 'Penggalangan/Iuran') return 'Penggalangan'
  if (phase === 'Perencanaan' || phase === 'Penggalangan' || phase === 'Berlangsung' || phase === 'Penyelesaian' || phase === 'LPJ' || phase === 'Selesai') return phase
  return 'Perencanaan'
}

function reportStatus(status?: string, fallback?: PublicActivity['reportStatus']): PublicActivity['reportStatus'] {
  if (status === 'Disahkan') return 'Tersedia'
  if (status === 'Siap Diajukan' || status === 'Draft') return 'Disusun'
  return fallback ?? 'Belum tersedia'
}

export function usePublicActivities(): PublicActivity[] {
  const { activities, transactions, budgets, reports, activityMedia } = useOperations()

  return useMemo(() => activities
    .filter((activity) => activity.publicVisible)
    .map((activity) => {
      const content = contentActivities.find((item) => item.id === activity.id)
      const verified = transactions.filter((item) => item.activityId === activity.id && isRecognizedTransaction(item))
      const financeSummary = summarizeActivityFinance(transactions, activity.id)
      const activityBudgets = budgets.filter((item) => item.activityId === activity.id)
      const activityReport = reports.find((item) => item.activityId === activity.id && item.type.toLowerCase().includes('lpj'))
        ?? reports.find((item) => item.activityId === activity.id)

      const purchases = verified
        .filter((item) => item.kind === 'expense')
        .map((item) => ({
          id: item.id,
          item: item.label,
          category: item.category,
          vendor: item.vendor || 'Vendor tidak dipublikasikan',
          date: item.date.split(' · ')[0],
          total: item.amount,
          evidence: item.evidenceName ? 'Tersedia' as const : 'Menunggu' as const,
        }))

      const budget = activityBudgets.map((item) => ({ category: item.category, plan: item.plan, actual: item.realized }))
      const publishedMedia = activityMedia
        .filter((item) => item.activityId === activity.id && item.publicVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      const publishedPhotos = publishedMedia.filter((item) => item.type === 'photo')
      const coverPhoto = publishedPhotos.find((item) => item.isCover) ?? publishedPhotos[0]
      const dynamicGallery = publishedPhotos.filter((item) => !item.isCover).map((item) => item.url)
      const videos = publishedMedia
        .filter((item) => item.type === 'video' && (item.provider === 'youtube' || item.provider === 'google-drive'))
        .map((item) => ({
          id: item.id,
          title: item.title,
          provider: item.provider as 'youtube' | 'google-drive',
          url: item.url,
          embedUrl: getActivityVideoEmbedUrl(item.provider, item.url),
          thumbnailUrl: getActivityVideoThumbnail(item.provider, item.url),
        }))
        .filter((item) => Boolean(item.embedUrl))

      return {
        id: activity.id,
        title: activity.name,
        shortTitle: content?.shortTitle ?? activity.name,
        category: activity.category || content?.category || 'Kegiatan',
        status: normalizeStatus(activity.phase),
        date: activity.date,
        dateISO: activity.dateISO,
        location: activity.location,
        summary: activity.summary || content?.summary || 'Kegiatan Pemuda Dusun 3 Sidodadi.',
        description: content?.description ?? [
          activity.summary || 'Kegiatan ini dikelola melalui workspace kegiatan yang sama dengan data kepanitiaan, keuangan, dan laporan.',
          'Informasi publik mengikuti data kegiatan yang dipublikasikan Admin. Data internal yang bersifat pribadi tetap tidak ditampilkan.',
        ],
        image: coverPhoto?.url ?? content?.image ?? FALLBACK_IMAGE,
        featured: content?.featured ?? false,
        participantTarget: content?.participantTarget ?? 0,
        participantActual: content?.participantActual ?? 0,
        finance: {
          target: activity.budgetTarget || activityBudgets.reduce((sum, item) => sum + item.plan, 0),
          income: financeSummary.recordedIncome,
          expense: financeSummary.totalExpense,
          cash: financeSummary.netBalance,
        },
        budget,
        purchases,
        committeeRoles: content?.committeeRoles ?? ['Ketua Panitia', 'Sekretaris', 'Bendahara', 'Humas'],
        gallery: publishedPhotos.length ? (dynamicGallery.length ? dynamicGallery : [coverPhoto?.url ?? FALLBACK_IMAGE]) : (content?.gallery?.length ? content.gallery : [content?.image ?? FALLBACK_IMAGE]),
        videos,
        reportStatus: reportStatus(activityReport?.status, content?.reportStatus),
      }
    })
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO)), [activities, activityMedia, budgets, reports, transactions])
}

export function usePublicActivityById(activityId?: string) {
  const activities = usePublicActivities()
  return activities.find((activity) => activity.id === activityId)
}
