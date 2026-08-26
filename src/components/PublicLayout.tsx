import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppFloating from './WhatsAppFloating'
import PublicSeo from './PublicSeo'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-offwhite">
      <PublicSeo />
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <WhatsAppFloating />
    </div>
  )
}
