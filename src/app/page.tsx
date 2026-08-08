import BakersMathsLogo from '@/components/BakersMathsLogo/BakersMathsLogo'
import DMBLogo from '@/components/DMBLogo/DMBLogo'
import Eyes from '@/components/Eyes/Eyes'
import GoksoyraLogo from '@/components/GoksoyraLogo/GoksoyraLogo'
import JnaoLogo from '@/components/JnaoLogo/JnaoLogo'
import Logo from '@/components/Logo/Logo'
import styles from './page.module.scss'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.padder} />
      <h1 className={styles.title}>
        <Logo alt="jnaO AB" className={styles.logo} />
      </h1>
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
          I build sites for others, like{' '}
          <a className={styles.link} href="https://martakei.com">
            marta_kei_
          </a>
          .
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
      <section className={styles.segment}>
        <p className={styles.paragraph}>And apps.</p>
      </section>
      <section className={styles.segment}>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <a
              className={styles.listLink}
              href="https://bakersmaths.com"
            >
              <BakersMathsLogo />
            </a>
          </li>
        </ul>
      </section>
      <div className={styles.padder} />
      <JnaoLogo />
    </main>
  )
}
