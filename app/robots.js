export default function robots() {
  return {
    // /trips is kept out of search results by the noindex in its layout, not
    // by a disallow here — a disallow would also stop link unfurlers (X,
    // LinkedIn) fetching /trips/opengraph-image for shared invite links.
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] }],
    sitemap: 'https://andysantamaria.com/sitemap.xml',
  };
}
