import type { Metadata } from 'next'
import type { StaticImageData } from 'next/image'

import { SITE_NAME } from '@/constants'

interface PageMetadataInput {
  path: string
  title: string
  description: string
  image: StaticImageData
}

// Next replaces the layout's `openGraph` wholesale when a page sets
// one, so every page builds its complete set here.
export function pageMetadata({
  path,
  title,
  description,
  image
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: image.src,
          width: image.width,
          height: image.height
        }
      ]
    }
  }
}
