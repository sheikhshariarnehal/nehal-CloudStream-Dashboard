/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base path for production deployment behind proxy (default empty for root access)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Asset prefix for static assets
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Standalone output for Docker deployment
  output: 'standalone',
};

export default nextConfig;
