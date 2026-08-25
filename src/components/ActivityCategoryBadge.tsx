export default function ActivityCategoryBadge({
  category,
  variant = 'light',
}: {
  category: string
  variant?: 'light' | 'dark'
}) {
  const styles = variant === 'dark'
    ? 'border-white/30 bg-black/10 text-white'
    : 'border-border-soft bg-white text-forest'

  return (
    <span className={`inline-flex items-center border px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.12em] ${styles}`}>
      {category}
    </span>
  )
}
