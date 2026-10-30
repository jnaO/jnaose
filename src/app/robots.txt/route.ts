import { SITE_URL } from '@/constants'

export const dynamic = 'force-static'

export function GET() {
  const body = [
    'User-Agent: *',
    'Content-Signal: ai-train=no, search=yes, ai-input=yes',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap.xml', SITE_URL)}`
  ].join('\n')

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
