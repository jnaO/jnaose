import { Analytics } from '@vercel/analytics/react'
import classNames from 'classnames'
import type { Metadata, Viewport } from 'next'
import { Rajdhani } from 'next/font/google'
import React from 'react'

import './globals.scss'

import Backdrop from '@/components/Backdrop/Backdrop'
import HistoryScenes from '@/components/HistoryScenes/HistoryScenes'
import JnaoLogo from '@/components/JnaoLogo/JnaoLogo'
import Logo from '@/components/Logo/Logo'
import RotateNotice from '@/components/RotateNotice/RotateNotice'
import SiteMenu from '@/components/SiteMenu/SiteMenu'
import {
  SCROLLER_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  UI_CHROME
} from '@/constants'

import icons from './icons'
import styles from './page.module.scss'

const rajdhani = Rajdhani({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-rajdhani'
})
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['developer'],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  icons
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
          <h1
            className={classNames(styles.title, UI_CHROME)}
          >
            <Logo alt="jnaO AB" className={styles.logo} />
          </h1>
          {children}
          <footer className={styles.footer}>
            <JnaoLogo />
          </footer>
        </main>
        <SiteMenu />
        <HistoryScenes />
        <RotateNotice />
        <Analytics />
      </body>
    </html>
  )
}
