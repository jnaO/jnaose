import DMBLogo from '@/components/DMBLogo/DMBLogo'
import Eyes from '@/components/Eyes/Eyes'
import GoksoyraLogo from '@/components/GoksoyraLogo/GoksoyraLogo'
import WorkLink from '@/components/WorkLink/WorkLink'
import styles from './page.module.scss'

export default function Home() {
  return (
    <>
      <section className={styles.segment}>
        <p className={styles.paragraph}>
          I&apos;m a web developer ( <Eyes /> ).
          <br />
          For contact you can{' '}
          <a
            className={styles.link}
            href="mailto:jan@jnao.se?subject=webdeveloper"
          >
            email
          </a>{' '}
          me.
        </p>
      </section>
      <section className={styles.segment}>
        <p className={styles.paragraph}>
          I build sites and apps, see the{' '}
          <WorkLink className={styles.link}>work</WorkLink>.
        </p>
      </section>
      <section className={styles.segment}>
        <p className={styles.paragraph}>
          I also make music.
        </p>
      </section>
      <section className={styles.segment}>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <a
              className={styles.listLink}
              href="https://goksøyra.com"
            >
              <GoksoyraLogo />
            </a>
          </li>
          <li className={styles.listItem}>
            <a
              className={styles.listLink}
              href="https://djupmyrberget.se"
            >
              <DMBLogo />
            </a>
          </li>
        </ul>
      </section>
    </>
  )
}
