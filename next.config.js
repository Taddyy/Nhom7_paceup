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
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8000/api/v1/:path*' // Proxy to local backend in dev
          : '/api/v1/:path*', // Vercel rewrites handle this in prod
      },
    ]
  },
}

module.exports = nextConfig
