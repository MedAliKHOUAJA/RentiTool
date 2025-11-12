const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // typedRoutes has moved out of experimental in Next 13.4+ / 15
  typedRoutes: true,
  // Fix workspace root inference when multiple lockfiles are present
  outputFileTracingRoot: __dirname,
  experimental: {
    // Remove appDir: the App Router is enabled by default
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a0.muscache.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gstatic.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
