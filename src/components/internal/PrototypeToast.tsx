export default function PrototypeToast({ message }: { message: string }) {
  if (!message) return null
  return <div role="status" className="fixed bottom-5 left-4 right-4 z-[90] mx-auto max-w-md rounded-md bg-charcoal px-4 py-3 text-center text-sm font-semibold text-offwhite shadow-xl sm:left-auto sm:right-6 sm:mx-0">{message}</div>
}
