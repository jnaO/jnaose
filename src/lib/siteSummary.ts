import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL
} from '@/constants'
import { music } from '@/data/music'
import { projects } from '@/data/projects'

// Markdown summary of the whole site, served by /llms.txt and /index.md.
export function siteSummary() {
  const work = projects.map(
    ({ name, href, kind, status, about }) =>
      `- [${name}](${href}): ${[kind, status].filter(Boolean).join(', ')}. ${about}`
  )
  const releases = Object.values(music).map(
    ({ name, href }) => `- [${name}](${href})`
  )

  const body = [
    `# ${SITE_NAME}`,
    `> ${SITE_DESCRIPTION}`,
    '## Work',
    `Sites and apps, also listed at ${new URL('/work', SITE_URL)}`,
    work.join('\n'),
    '## Music',
    releases.join('\n'),
    '## Contact',
    `- [Email](mailto:${CONTACT_EMAIL})`
  ].join('\n\n')

  return `${body}\n`
}
