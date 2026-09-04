import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Seguranca em Server Actions',
  description: 'Lab de estudo React/Next senior',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
