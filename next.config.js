/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent-iad4-1.choicecdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '*.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      }
    ],
    unoptimized: true
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 