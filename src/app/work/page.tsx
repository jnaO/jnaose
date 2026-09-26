import classNames from 'classnames'
import type { Metadata } from 'next'
import Image from 'next/image'

import ProjectNav from '@/components/ProjectNav/ProjectNav'
import ScrollIn from '@/components/ScrollIn/ScrollIn'
import { projects } from '@/data/projects'

import styles from '../page.module.scss'
import workStyles from './work.module.scss'

export const metadata: Metadata = {
  title: 'work · jnaO',
  description: 'Sites and apps built by jnaO'
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function Work() {
  return (
    <>
      {projects.map((project, i) => (
        <section
          key={project.slug}
          id={project.slug}
          className={workStyles.project}
        >
          <Image
            src={project.icon}
            alt=""
            width={88}
            height={88}
            loading="eager"
            className={workStyles.icon}
          />
          <div className={workStyles.text}>
            <p className={workStyles.meta}>
              work · {pad(i + 1)} / {pad(projects.length)} ·{' '}
              {project.kind}
            </p>
            <h2 className={workStyles.heading}>
              <a
                className={classNames(
                  styles.link,
                  workStyles.name
                )}
                href={project.href}
              >
                {project.name}
              </a>
            </h2>
            <p className={workStyles.about}>
              {project.about}
            </p>
            <a className={styles.link} href={project.href}>
              {project.host} ↗
            </a>
          </div>
        </section>
      ))}
      <ProjectNav projects={projects} />
      <ScrollIn />
    </>
  )
}
