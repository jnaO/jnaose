import Image from 'next/image'

import background from '@/assets/images/bg.jpg'
import DMBLogo from '@/components/DMBLogo/DMBLogo'
import GoksoyraLogo from '@/components/GoksoyraLogo/GoksoyraLogo'
import Logo from '@/components/Logo/Logo'

import styles from './page.module.scss'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.padder} />
      <Image
        src={background}
        alt="Marseille"
        width={2000}
        height={1126}
        className={styles.bgImage}
      />
      <Logo className={styles.logo} />
      <section className={styles.segment}>
        <p className={styles.paragraph}>
          I&apos;m a web developer ( ◘-◘ ).
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
        <p className={styles.paragraph}>I also make music.</p>
      </section>
      <section className={styles.segment}>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <a className={styles.listLink} href="https://goksøyra.com">
              <GoksoyraLogo />
            </a>
          </li>
          <li className={styles.listItem}>
            <a className={styles.listLink} href="https://djupmyrberget.se">
              <DMBLogo />
            </a>
          </li>
        </ul>
      </section>
    </main>
  )
}
