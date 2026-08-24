export default function ActivityCategoryBadge({
  category,
  variant = 'light',
}: {
  category: string
  variant?: 'light' | 'dark'
}) {
  const styles = variant === 'dark'
    ? 'border-white/30 bg-white/10 text-offwhite'
    : 'border-forest/20 bg-sage/35 text-forest'

  return (
    <span className={`inline-flex items-center border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${styles}`}>
      {category}
    </span>
  )
}
