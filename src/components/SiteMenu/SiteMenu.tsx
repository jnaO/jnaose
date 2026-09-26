'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import pageStyles from '@/app/page.module.scss'
import { useSceneLink } from '@/hooks/useSceneLink'

import styles from './siteMenu.module.scss'

function SiteMenu() {
  const pathname = usePathname()
  const toHome = useSceneLink('/')
  const toWork = useSceneLink('/work')

  const items = [
    {
      label: 'home',
      href: '/',
      current: pathname === '/',
      onClick: toHome
    },
    {
      label: 'work',
      href: '/work',
      current: pathname.startsWith('/work'),
      onClick: toWork
    }
  ]

  return (
    <nav aria-label="Site" className={styles.menu}>
      {items.map(({ label, href, current, onClick }) => (
        <Link
          key={label}
          href={href}
          scroll={false}
          onClick={onClick}
          aria-current={current ? 'page' : undefined}
          className={classNames(pageStyles.navItem, {
            [pageStyles.navCurrent]: current
          })}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

export default SiteMenu
