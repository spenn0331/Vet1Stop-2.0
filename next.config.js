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
  // Allow dev proxy origins (Windsurf browser preview, etc.)
  allowedDevOrigins: ['http://127.0.0.1:*', 'http://localhost:*', '127.0.0.1', 'localhost'],
  // Disable typed routes
  typedRoutes: false,
  // Improve compatibility with older TypeScript versions
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  // Increase timeout for builds
  staticPageGenerationTimeout: 180,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Increase body size limit for Medical Detective large PDF uploads (50MB base64)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;

    if (!isServer) {
      // pdfjs-dist references Node built-ins that webpack 5 won't polyfill —
      // tell it to silently ignore them on the client side.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        stream: false,
        path: false,
        util: false,
      };
      // The @react-pdf-viewer chunk is very large in dev; extend the
      // default 120 000 ms timeout so it doesn't abort during first compile.
      config.output = {
        ...config.output,
        chunkLoadTimeout: 300000,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
