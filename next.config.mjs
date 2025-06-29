import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // 確保路徑別名在所有環境中正常工作
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd()),
    }
    return config
  },
}

export default nextConfig
