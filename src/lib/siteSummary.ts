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
    ({ name, links, kind, status, about }) => {
      const meta = [kind, status].filter(Boolean).join(', ')
      if (links.length === 1)
        return `- [${name}](${links[0].href}): ${meta}. ${about}`
      const sites = links
        .map(({ href, host }) => `[${host}](${href})`)
        .join(', ')
      return `- ${name}: ${meta}. ${about} Sites: ${sites}`
    }
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
