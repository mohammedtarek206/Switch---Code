/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'switchcode.tech'],
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
