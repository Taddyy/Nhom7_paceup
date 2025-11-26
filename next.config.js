/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  // Ensure standalone output is NOT used for Vercel (it handles it automatically)
  // output: 'standalone', 
  rewrites: async () => {
    const sharedRewrites = [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
      },
    ]

    if (process.env.NODE_ENV === 'development') {
      sharedRewrites.push({
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*', // Proxy to local backend in dev
      })
    }

    return sharedRewrites
  },
}

module.exports = nextConfig
