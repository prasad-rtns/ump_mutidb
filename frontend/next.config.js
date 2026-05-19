/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained build suitable for Docker (smaller image, no full node_modules needed)
  output: 'standalone',
  // Server-side only env vars — not baked into the client bundle
  serverRuntimeConfig: {
    authServiceUrl:   process.env.AUTH_SERVICE_URL   || 'http://localhost:3001/api/v1',
    masterServiceUrl: process.env.MASTER_SERVICE_URL || 'http://localhost:3002/api/v1',
    documentServiceUrl: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3003/api/v1',
  },
  // Rewrites run on the Next.js server — the browser only ever sees /proxy/*
  async rewrites() {
    const authUrl   = process.env.AUTH_SERVICE_URL   || 'http://localhost:3001/api/v1';
    const masterUrl = process.env.MASTER_SERVICE_URL || 'http://localhost:3002/api/v1';
    const documentUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3003/api/v1';
    return [
      { source: '/proxy/auth/:path*',   destination: `${authUrl}/:path*`   },
      { source: '/proxy/master/:path*', destination: `${masterUrl}/:path*` },
      { source: '/proxy/documents/:path*', destination: `${documentUrl}/:path*` },
    ];
  },
};

module.exports = nextConfig;
