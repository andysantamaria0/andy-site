/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/vialoure-design-options',
        destination: '/vialoure-design-options.html',
      },
    ];
  },
};

module.exports = nextConfig;
