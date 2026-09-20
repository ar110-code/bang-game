/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate socket connections in dev
  compress: true, // Enable gzip and brotli compression for all routes and assets
  poweredByHeader: false,
};

export default nextConfig;
