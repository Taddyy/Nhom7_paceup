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
    // Only rewrite in development - in production, Vercel handles it via vercel.json
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:8000/api/v1/:path*', // Proxy to local backend in dev
        },
      ]
    }
    // In production, return empty array - let Vercel rewrites handle it
    return []
  },
}

module.exports = nextConfig
