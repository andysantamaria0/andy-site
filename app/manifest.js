export default function manifest() {
  return {
    name: 'Vialoure',
    short_name: 'Vialoure',
    description: 'Travel planning for friends',
    start_url: '/trips',
    display: 'standalone',
    background_color: '#0A1628',
    theme_color: '#0A1628',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
