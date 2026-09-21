/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://static.cloudflareinsights.com https://vercel.live https://us-assets.i.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://*.supabase.co https://maps.googleapis.com wss://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com",
              "media-src 'self' https://*.supabase.co",
              "frame-src https://www.openstreetmap.org",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // /product was the old consulting page; it lives at /consulting now.
      { source: '/product', destination: '/consulting', permanent: true },
    ];
  },
};

module.exports = nextConfig;
