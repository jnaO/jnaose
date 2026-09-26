import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/constants'

// Every route in src/app.
const PATHS = ['/', '/work']

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({
    url: new URL(path, SITE_URL).toString()
  }))
}
