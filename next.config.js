/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/vialoure-design-options',
        destination: '/vialoure-design-options.html',
      },
      {
        source: '/vialoure-grand-tour-v2',
        destination: '/vialoure-grand-tour-v2.html',
      },
    ];
  },
};

module.exports = nextConfig;
