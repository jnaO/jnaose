import { Analytics } from '@vercel/analytics/react'
import classNames from 'classnames'
import type { Metadata, Viewport } from 'next'
import { Rajdhani } from 'next/font/google'
import React from 'react'

import './globals.scss'

import bg from '@/assets/images/bg.jpg'

import Backdrop from '@/components/Backdrop/Backdrop'
import HistoryScenes from '@/components/HistoryScenes/HistoryScenes'
import JnaoLogo from '@/components/JnaoLogo/JnaoLogo'
import Logo from '@/components/Logo/Logo'
import SiteMenu from '@/components/SiteMenu/SiteMenu'
import { SCROLLER_ID } from '@/constants'

import icons from './icons'
import styles from './page.module.scss'

const rajdhani = Rajdhani({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-rajdhani'
})
const name = 'jnaO'
const description = 'Webdeveloper, music maker'
export const metadata: Metadata = {
  title: name,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_DOMAIN || ''
  ),
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
        url: bg.src
      }
    ]
  }
}
export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  viewportFit: 'cover',
  initialScale: 1
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={classNames(
          rajdhani.className,
          rajdhani.variable
        )}
      >
        <Backdrop />
        <main id={SCROLLER_ID} className={styles.main}>
          <div className={styles.padder} />
          <h1 className={styles.title}>
            <Logo alt="jnaO AB" className={styles.logo} />
          </h1>
          {children}
          <footer className={styles.footer}>
            <JnaoLogo />
          </footer>
        </main>
        <SiteMenu />
        <HistoryScenes />
        <Analytics />
      </body>
    </html>
  )
}
