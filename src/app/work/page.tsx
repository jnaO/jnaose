import classNames from 'classnames'
import Image from 'next/image'

import forest from '@/assets/images/forest.jpg'
import ExternalIcon from '@/components/ExternalIcon/ExternalIcon'
import ProjectNav from '@/components/ProjectNav/ProjectNav'
import ScrollIn from '@/components/ScrollIn/ScrollIn'
import { SITE_NAME } from '@/constants'
import { projectNumber, projects } from '@/data/projects'

import styles from '../page.module.scss'
import { pageMetadata } from '../pageMetadata'
import workStyles from './work.module.scss'

export const metadata = pageMetadata({
  path: '/work',
  title: `work · ${SITE_NAME}`,
  description: `Sites and apps built by ${SITE_NAME}`,
  image: forest
})

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
              work · {projectNumber(i + 1)} /{' '}
              {projectNumber(projects.length)} ·{' '}
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
              {project.host}
              <ExternalIcon />
            </a>
          </div>
        </section>
      ))}
      <ProjectNav projects={projects} />
      <ScrollIn />
    </>
  )
}
