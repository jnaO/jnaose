import type { StaticImageData } from 'next/image'

import bakersmaths from '@/assets/images/projects/bakersmaths.png'
import hangboardBuzzer from '@/assets/images/projects/hangboard-buzzer.png'
import martakei from '@/assets/images/projects/martakei.png'
import showMeTheMoney from '@/assets/images/projects/show-me-the-money.png'

export interface Project {
  slug: string
  name: string
  href: string
  host: string
  kind: string
  icon: StaticImageData
  about: string
  // Shown after the kind in the project's meta line, e.g. 'in review'.
  status?: string
}

// Two-digit project number, e.g. 3 → "03".
export const projectNumber = (n: number) =>
  String(n).padStart(2, '0')

export const projects: Project[] = [
  {
    slug: 'marta-kei',
    name: 'marta_kei_',
    href: 'https://martakei.com',
    host: 'martakei.com',
    kind: 'site',
    icon: martakei,
    about:
      'A home for Marta’s art, workshops and creative rituals. I built it end to end: she runs it all herself, sells artworks and workshop seats through Stripe checkout in two currencies, and the site speaks English, Swedish and Polish.'
  },
  {
    slug: 'hangboard-buzzer',
    name: 'hangboard buzzer',
    href: 'https://hangboard-buzzer.jnao.se',
    host: 'hangboard-buzzer.jnao.se',
    kind: 'iPhone app',
    icon: hangboardBuzzer,
    about:
      'An interval timer for hangboard training. Set up your hangs once, press start, and it counts you through every hang and rest with sound and haptics, logs the session to Apple Health, and ends with an arcade round on a Game Center leaderboard. I made the app and its site: free, no ads, no account, no data collected.'
  },
  {
    slug: 'bakers-maths',
    name: 'bakers maths',
    href: 'https://bakersmaths.com',
    host: 'bakersmaths.com',
    kind: 'web app',
    icon: bakersmaths,
    about:
      'A bread recipe library and baking calculator: sourdough recipes with baker’s percentages, and live bakes you follow step by step. It began as my own rabbit hole as a forgetful sourdough baker, so it catches you up on folds you forgot to time, and installed on your phone it buzzes your wrist when a timer ends.'
  },
  {
    slug: 'show-me-the-money',
    name: 'show me the money',
    href: 'https://showmethemoney.jnao.se',
    host: 'showmethemoney.jnao.se',
    kind: 'Mac app',
    status: 'in review',
    icon: showMeTheMoney,
    about:
      'Personal finance that never leaves your Mac. Import your bank exports, let patterns categorise every transaction, plan with envelopes, and trace where the money goes on visual dashboards: no account, no sync, no tracking. I made the app and its site, and it’s in App Store review now.'
  }
]
