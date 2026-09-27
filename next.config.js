/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev server only: lets phones on the local network load dev assets.
  allowedDevOrigins: ['192.168.*.*']
}

module.exports = nextConfig
