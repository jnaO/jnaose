import React from 'react'

import { Analytics } from '@vercel/analytics/react'
import classNames from 'classnames'
import type { Metadata, Viewport } from 'next'
import { Rajdhani } from 'next/font/google'

import './globals.scss'
import bg from '@/assets/images/bg.jpg'

import icons from './icons'

const rajdhani = Rajdhani({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
})
const name = 'jnaO'
const description = 'Webdeveloper, music maker'
export const metadata: Metadata = {
  title: name,
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOMAIN || ''),
  description,
  applicationName: name,
  keywords: ['developer'],
  authors: [{ name: 'jnaO', url: 'https://jnao.se' }],
  icons,
  openGraph: {
    type: 'website',
    url: 'https://jnao.se',
    title: name,
    description,
    siteName: name,
    images: [
      {
        url: bg.src,
      },
    ],
  },
}
export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={classNames(rajdhani.className, rajdhani.variable)}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
