export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/trips/', '/admin/', '/api/'] }],
    sitemap: 'https://andysantamaria.com/sitemap.xml',
  };
}
