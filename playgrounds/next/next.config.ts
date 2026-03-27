import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@reactive/react', '@reactive/core'],
}

export default nextConfig
