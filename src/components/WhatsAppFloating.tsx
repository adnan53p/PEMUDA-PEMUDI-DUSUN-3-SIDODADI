import { MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from '../config/whatsapp'

export default function WhatsAppFloating() {
  const whatsappLink = buildWhatsAppLink('tanya-panitia')

  if (!whatsappLink) return null

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi Pemuda Dusun 3 Sidodadi lewat WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-md transition-transform duration-200 hover:scale-105 md:bottom-6 md:right-6"
    >
      <MessageCircle size={22} fill="currentColor" className="text-white" strokeWidth={0} />
    </a>
  )
}
