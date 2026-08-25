import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { OperationsProvider, PublicOperationsProvider } from './prototype/OperationsContext'
import { AccountsProvider } from './prototype/AccountsContext'
import { SiteContentProvider } from './prototype/SiteContentContext'
import ProtectedRoute from './auth/ProtectedRoute'
import PublicLayout from './components/PublicLayout'
import RouteScrollManager from './components/RouteScrollManager'
import Homepage from './pages/Homepage'
import ProfilePage from './pages/ProfilePage'
import LegalityPage from './pages/LegalityPage'
import OrganizationPage from './pages/OrganizationPage'
import ActivitiesPage from './pages/ActivitiesPage'
import ActivityDetailPage from './pages/ActivityDetailPage'
import DocumentationPage from './pages/DocumentationPage'
import FinancePage from './pages/FinancePage'
import ProgramDetailPage from './pages/ProgramDetailPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import SuperadminDashboard from './pages/internal/SuperadminDashboard'
import WebsiteContentPage from './pages/internal/WebsiteContentPage'
import WebsiteAppearancePage from './pages/internal/WebsiteAppearancePage'
import WebsiteNavigationPage from './pages/internal/WebsiteNavigationPage'
import WebsiteDocumentsPage from './pages/internal/WebsiteDocumentsPage'
import AdminAccountsPage from './pages/internal/AdminAccountsPage'
import WebsiteSettingsPage from './pages/internal/WebsiteSettingsPage'
import AdminDashboard from './pages/internal/AdminDashboard'
import AdminActivitiesPage from './pages/internal/AdminActivitiesPage'
import AdminCommitteeHumasPage from './pages/internal/AdminCommitteeHumasPage'
import AdminFinancePage from './pages/internal/AdminFinancePage'
import AdminReportsPage from './pages/internal/AdminReportsPage'
import HumasWorkspace from './pages/internal/HumasWorkspace'

function App() {
  return (
    <AuthProvider>
      <OperationsProvider>
        <AccountsProvider>
          <SiteContentProvider>
      <BrowserRouter>
        <RouteScrollManager />
        <Routes>
          <Route element={<PublicOperationsProvider><PublicLayout /></PublicOperationsProvider>}>
            <Route path="/" element={<Homepage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/keabsahan" element={<LegalityPage />} />
            <Route path="/kepengurusan" element={<OrganizationPage />} />
            <Route path="/kegiatan" element={<ActivitiesPage />} />
            <Route path="/kegiatan/:activityId" element={<ActivityDetailPage />} />
            <Route path="/dokumentasi" element={<DocumentationPage />} />
            <Route path="/keuangan" element={<FinancePage />} />
            <Route path="/bidang/:slug" element={<ProgramDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperadminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/konten" element={<ProtectedRoute allowedRoles={['superadmin']}><WebsiteContentPage /></ProtectedRoute>} />
          <Route path="/superadmin/tampilan" element={<ProtectedRoute allowedRoles={['superadmin']}><WebsiteAppearancePage /></ProtectedRoute>} />
          <Route path="/superadmin/navigasi" element={<ProtectedRoute allowedRoles={['superadmin']}><WebsiteNavigationPage /></ProtectedRoute>} />
          <Route path="/superadmin/dokumen" element={<ProtectedRoute allowedRoles={['superadmin']}><WebsiteDocumentsPage /></ProtectedRoute>} />
          <Route path="/superadmin/admin" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminAccountsPage /></ProtectedRoute>} />
          <Route path="/superadmin/pengaturan" element={<ProtectedRoute allowedRoles={['superadmin']}><WebsiteSettingsPage /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/kegiatan" element={<ProtectedRoute allowedRoles={['admin']}><AdminActivitiesPage /></ProtectedRoute>} />
          <Route path="/admin/panitia-humas" element={<ProtectedRoute allowedRoles={['admin']}><AdminCommitteeHumasPage /></ProtectedRoute>} />
          <Route path="/admin/keuangan" element={<ProtectedRoute allowedRoles={['admin']}><AdminFinancePage /></ProtectedRoute>} />
          <Route path="/admin/verifikasi" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/keuangan?tab=pembelanjaan" replace /></ProtectedRoute>} />
          <Route path="/admin/bukti" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/keuangan?tab=transaksi" replace /></ProtectedRoute>} />
          <Route path="/admin/laporan" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/laporan?tab=riwayat" replace /></ProtectedRoute>} />
          <Route path="/humas" element={<ProtectedRoute allowedRoles={['humas']}><HumasWorkspace /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
          </SiteContentProvider>
        </AccountsProvider>
      </OperationsProvider>
    </AuthProvider>
  )
}

export default App
