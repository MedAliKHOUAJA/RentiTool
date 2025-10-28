/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
<<<<<<< HEAD
  buildExcludes: [({ asset }) => {
    return (
      asset.name.startsWith('server/') ||
      asset.name.startsWith('static/chunks/') ||
      [
        'app-build-manifest.json',
        'build-manifest.json',
        'react-loadable-manifest.json',
        'react-ssr-manifest.json'
      ].includes(asset.name)
    );
  }],
  runtimeCaching: [
=======
  buildExcludes: [({ asset, compilation }) => {
    return asset.name.startsWith('server/') || asset.name.startsWith('static/chunks/') || asset.name === 'app-build-manifest.json' || asset.name === 'build-manifest.json' || asset.name === 'react-loadable-manifest.json' || asset.name === 'react-ssr-manifest.json';
  }],
  runtimeCaching: [
    // Cache pages - IMPORTANT for offline
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
    {
      urlPattern: ({ request, url }) => {
        const isSameOrigin = self.origin === url.origin;
        const isNavigationRequest = request.mode === 'navigate';
        const isAPIRequest = url.pathname.startsWith('/api/');
        return isSameOrigin && isNavigationRequest && !isAPIRequest;
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 50,
<<<<<<< HEAD
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
        networkTimeoutSeconds: 5,
      },
    },
=======
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
        networkTimeoutSeconds: 5, // Fall back to cache after 5s
      },
    },
    // Cache static assets (JS, CSS)
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-cache",
        expiration: {
          maxEntries: 60,
<<<<<<< HEAD
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
=======
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Cache images
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
<<<<<<< HEAD
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
=======
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Cache fonts
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "font-cache",
        expiration: {
          maxEntries: 20,
<<<<<<< HEAD
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
=======
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Cache Google Fonts
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
<<<<<<< HEAD
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
=======
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Cache remote images (Pexels, Unsplash, etc.)
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
    {
      urlPattern: /^https:\/\/(images\.pexels\.com|images\.unsplash\.com|a0\.muscache\.com|www\.gstatic\.com)\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "remote-images-cache",
        expiration: {
          maxEntries: 50,
<<<<<<< HEAD
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
=======
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    // Cache API calls with network first strategy
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 50,
<<<<<<< HEAD
          maxAgeSeconds: 60 * 60 * 24,
=======
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
<<<<<<< HEAD
=======
    // Cache business card data specifically
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
    {
      urlPattern: /\/api\/cards\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "cards-api-cache",
        expiration: {
          maxEntries: 100,
<<<<<<< HEAD
          maxAgeSeconds: 60 * 60 * 24 * 7,
=======
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
        },
        networkTimeoutSeconds: 5,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
<<<<<<< HEAD
=======
  // Fallback for offline
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig = {
  reactStrictMode: false,
  experimental: {
    appDir: true,
    typedRoutes: true,
    serverActions: true,
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

<<<<<<< HEAD
module.exports = withPWA(nextConfig);
=======
module.exports = withPWA(nextConfig);
>>>>>>> 483b216603e0874878410ba5642775041e3b3757
