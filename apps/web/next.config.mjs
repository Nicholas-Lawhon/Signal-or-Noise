/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prisma's generated client must load from node_modules at runtime instead
    // of being bundled into route handlers.
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
