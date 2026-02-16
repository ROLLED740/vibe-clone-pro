import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SmartNavbar from '@/components/SmartNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vibe Clone Pro',
  description: 'AI App Generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-[#020502]"}>
        {/* We use the SmartNavbar here. It will hide itself when you enter the app. */}
        <SmartNavbar />
        {children}
      </body>
    </html>
  )
}
/* cache buster 2 */
