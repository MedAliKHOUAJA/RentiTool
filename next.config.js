// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [({ asset, compilation }) => {
    return asset.name.startsWith('server/') || asset.name.startsWith('static/chunks/') || asset.name === 'app-build-manifest.json' || asset.name === 'build-manifest.json' || asset.name === 'react-loadable-manifest.json' || asset.name === 'react-ssr-manifest.json';
  }],
  runtimeCaching: [
    // ... (gardez tout votre cache existant)
  ],
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig = {
  reactStrictMode: false,
  typedRoutes: true,
  outputFileTracingRoot: __dirname,
  
  experimental: {
    serverComponentsExternalPackages: [],
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
  
  // ✅ CONFIGURATION WEBPACK CORRIGÉE
  webpack: (config, { isServer }) => {
    // ✅ CORRECTION : Configuration différente pour serveur vs client
    if (isServer) {
      // Configuration SERVEUR (build time)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
        util: require.resolve('util/'),
        buffer: require.resolve('buffer/'),
        encoding: false,
        querystring: require.resolve('querystring-es3'),
      };
    } else {
      // Configuration CLIENT (browser)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        encoding: false,
        util: false,
        buffer: false,
        querystring: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        net: false,
        tls: false,
      };
    }

    // Alias pour résoudre les problèmes de modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'encoding': false,
      'node:buffer': false,
      'node:stream': false,
      'node:util': false,
    };

    // Ignorer les warnings
    config.ignoreWarnings = [
      { module: /node_modules\/jsonwebtoken/ },
      { module: /node_modules\/jose/ },
      { module: /node_modules\/bcrypt/ },
      { module: /node_modules\/face-api\.js/ },
      { module: /node_modules\/@tensorflow\/tfjs/ },
    ];

    return config;
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: false,
};

module.exports = withPWA(nextConfig);