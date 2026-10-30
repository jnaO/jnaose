import { siteSummary } from '@/lib/siteSummary'

export const dynamic = 'force-static'

export function GET() {
  return new Response(siteSummary(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
