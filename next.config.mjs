/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  images: {
    // Serve WebP/AVIF to browsers that support it (automatic via Next.js)
    formats: ['image/avif', 'image/webp'],
    // Breakpoints used for the srcset on responsive images
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 128, 256, 384, 512],
    // Cache optimized images for 60 days
    minimumCacheTTL: 60 * 60 * 24 * 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
