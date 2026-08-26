import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getRoleHome } from '../auth/ProtectedRoute'
import type { UserRole } from '../auth/types'

interface LocationState {
  from?: string
}

const roleOptions: Array<{ role: UserRole; title: string; subtitle: string }> = [
  { role: 'superadmin', title: 'Superadmin', subtitle: 'Website & platform' },
  { role: 'admin', title: 'Admin', subtitle: 'Operasional organisasi' },
  { role: 'humas', title: 'Humas', subtitle: 'Kegiatan lapangan' },
]

export default function LoginPage() {
  const { user, loading, login, supabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !submitting && user) navigate(getRoleHome(user.role), { replace: true })
  }, [loading, navigate, submitting, user])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!selectedRole) {
      setError('Pilih akses Superadmin, Admin, atau Humas terlebih dahulu.')
      return
    }

    setSubmitting(true)
    const result = await login(email, password, selectedRole)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message ?? 'Login gagal.')
      return
    }

    const destination = (location.state as LocationState | null)?.from
    navigate(destination || (result.user ? getRoleHome(result.user.role) : '/'), { replace: true })
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-forest-deep px-5 py-5 text-offwhite sm:px-8 sm:py-7 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
          <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-offwhite/75 hover:text-offwhite">
            <ArrowLeft size={17} /> Kembali ke website
          </Link>

          <div className="max-w-xl py-7 sm:py-10 lg:py-10">
            <p className="eyebrow text-sage">AREA PENGURUS</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl lg:mt-5 lg:text-7xl lg:leading-[0.97] lg:tracking-[-0.055em]">Satu ruang kerja untuk kegiatan yang lebih tertib.</h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-offwhite/68 lg:mt-7 lg:text-base">Superadmin mengelola website. Admin mengelola operasional organisasi. Humas bekerja di lapangan sesuai kegiatan dan tugas yang diberikan.</p>

            <div className="mt-5 hidden gap-3 text-sm sm:grid sm:grid-cols-3 lg:mt-10 lg:grid-cols-1 xl:grid-cols-3">
              {['Superadmin · Website', 'Admin · Operasional', 'Humas · Lapangan'].map((item) => (
                <div key={item} className="border border-white/15 px-4 py-4 text-offwhite/75">
                  <ShieldCheck size={18} className="mb-3 text-sage" />
                  <p className="font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="hidden text-xs uppercase tracking-[0.12em] text-offwhite/35 lg:block">PEMUDA DUSUN 3 SIDODADI · INTERNAL</p>
        </section>

        <section className="flex items-start justify-center px-5 py-7 sm:px-10 sm:py-10 lg:items-center lg:px-16">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-forest text-sm font-semibold text-offwhite">PD</span>
              <div>
                <p className="text-sm font-semibold tracking-[0.025em] text-charcoal">PEMUDA DUSUN 3 SIDODADI</p>
                <p className="text-xs text-muted">Portal Pengurus</p>
              </div>
            </div>

            <div className="mt-7 sm:mt-10">
              <p className="eyebrow text-forest">LOGIN PENGURUS</p>
              <h2 className="mt-3 text-3xl font-semibold text-charcoal sm:text-4xl">Masuk ke ruang kerja sesuai peran Anda.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">Gunakan akun pengurus yang telah diberikan. Hak akses akan menyesuaikan peran akun Anda.</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <fieldset>
                <legend className="mb-2 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Pilih akses</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {roleOptions.map((option) => {
                    const active = selectedRole === option.role
                    return (
                      <button
                        key={option.role}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setSelectedRole(option.role)
                          setError('')
                        }}
                        className={`min-h-20 border px-3 py-3 text-left transition-colors ${active ? 'border-forest bg-[#EEF2F7] text-forest' : 'border-border-soft bg-white text-charcoal hover:border-forest/45'}`}
                      >
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.07em]">
                          <ShieldCheck size={15} className={active ? 'text-forest' : 'text-muted'} />
                          {option.title}
                        </span>
                        <span className="mt-1.5 block text-[0.7rem] leading-snug text-muted">{option.subtitle}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[0.7rem] leading-relaxed text-muted">Pilih peran sesuai akun yang Anda gunakan.</p>
              </fieldset>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Email</span>
                <div className="flex h-13 items-center border border-border-soft bg-white px-4 focus-within:border-forest">
                  <Mail size={18} className="mr-3 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="nama@email.com"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:font-normal placeholder:text-muted/65"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Kata sandi</span>
                <div className="flex h-13 items-center border border-border-soft bg-white px-4 focus-within:border-forest">
                  <LockKeyhole size={18} className="mr-3 text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:font-normal placeholder:text-muted/65"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="ml-2 text-muted hover:text-forest" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {error && <p role="alert" className="border border-[#F1C5C8] bg-[#FFF4F4] px-4 py-3 text-sm font-semibold text-[#9F1D24]">{error}</p>}

              <button type="submit" disabled={loading || !supabaseConfigured || submitting || !selectedRole || !email.trim() || !password} className="btn btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'Memeriksa sesi…' : submitting ? 'Memeriksa…' : 'Masuk ke Ruang Kerja'}
              </button>
            </form>

            {supabaseConfigured ? (
              <div className="mt-8 border border-[#C9D3EE] bg-[#F3F6FC] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-forest">Login Pengurus</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">Masuk menggunakan email dan kata sandi akun pengurus Anda.</p>
              </div>
            ) : (
              <div className="mt-8 border border-[#E3E5E8] bg-[#F6F7F9] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal">Layanan login belum tersedia</p>
                <p className="mt-2 text-xs leading-relaxed text-charcoal">Hubungi pengelola website untuk mengaktifkan akses pengurus.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
