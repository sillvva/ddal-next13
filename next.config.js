/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        // The `src` property hostname must end with `.googleusercontent.com`,
        // otherwise the API will respond with 400 Bad Request.
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  }
}

module.exports = nextConfig
