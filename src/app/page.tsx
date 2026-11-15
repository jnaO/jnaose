import bg from '@/assets/images/bg.jpg'
import DMBLogo from '@/components/DMBLogo/DMBLogo'
import Eyes from '@/components/Eyes/Eyes'
import GoksoyraLogo from '@/components/GoksoyraLogo/GoksoyraLogo'
import Ruler from '@/components/Ruler/Ruler'
import WorkLink from '@/components/WorkLink/WorkLink'
import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME
} from '@/constants'
import { music } from '@/data/music'
import styles from './page.module.scss'
import { pageMetadata } from './pageMetadata'

export const metadata = pageMetadata({
  path: '/',
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  image: bg
})

// Ids of the home segments, top to bottom; the Ruler's rows.
const SECTIONS = ['hello', 'sites', 'music', 'listen']

export default function Home() {
  return (
    <>
      <section id={SECTIONS[0]} className={styles.segment}>
        <p className={styles.paragraph}>
          I&apos;m a web developer ( <Eyes /> ).
          <br />
          For contact you can{' '}
          <a
            className={styles.link}
            href={`mailto:${CONTACT_EMAIL}?subject=webdeveloper`}
          >
            email
          </a>{' '}
          me.
        </p>
      </section>
      <section id={SECTIONS[1]} className={styles.segment}>
        <p className={styles.paragraph}>
          I build sites and apps, see the{' '}
          <WorkLink className={styles.link}>work</WorkLink>.
        </p>
      </section>
      <section id={SECTIONS[2]} className={styles.segment}>
        <p className={styles.paragraph}>
          I also make music.
        </p>
      </section>
      <section id={SECTIONS[3]} className={styles.segment}>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <a
              className={styles.listLink}
              href={music.goksoyra.href}
            >
              <GoksoyraLogo />
            </a>
          </li>
          <li className={styles.listItem}>
            <a
              className={styles.listLink}
              href={music.dmb.href}
            >
              <DMBLogo />
            </a>
          </li>
        </ul>
      </section>
      <Ruler
        label="Sections"
        items={SECTIONS.map((id) => ({ id }))}
      />
    </>
  )
}
