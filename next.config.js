// Pages that answer `Accept: text/markdown` with /index.md.
const NEGOTIATED_PATHS = ['/', '/work']

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev server only: lets phones on the local network load dev assets.
  allowedDevOrigins: ['192.168.*.*'],
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value:
              '</llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="describedby"; type="application/xml"'
          }
        ]
      },
      ...NEGOTIATED_PATHS.map((source) => ({
        source,
        headers: [{ key: 'Vary', value: 'Accept' }]
      }))
    ]
  },
  async rewrites() {
    return {
      beforeFiles: NEGOTIATED_PATHS.map((source) => ({
        source,
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '.*text/markdown.*'
          }
        ],
        destination: '/index.md'
      }))
    }
  }
}

module.exports = nextConfig
