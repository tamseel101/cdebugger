/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Skip TypeScript build errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Skip ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
