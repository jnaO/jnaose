import { siteSummary } from '@/lib/siteSummary'

export const dynamic = 'force-static'

// next.config.js rewrites `Accept: text/markdown` page requests here.
export function GET() {
  return new Response(siteSummary(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  })
}
