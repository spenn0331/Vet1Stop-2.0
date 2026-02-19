/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  reactStrictMode: true,
  // Add experimental features to improve compatibility
  experimental: {
    // Disable type checking during build to avoid issues
    typedRoutes: false,
  },
  // Improve compatibility with older TypeScript versions
  serverExternalPackages: ['pdf-parse'],
  // Increase timeout for builds
  staticPageGenerationTimeout: 180,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Increase body size limit for Medical Detective large PDF uploads (50MB base64)
  serverActions: {
    bodySizeLimit: '50mb',
  },
};

module.exports = nextConfig;
