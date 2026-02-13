/**
 * Extract place coordinates from a Google Maps URL.
 * Handles full URLs with @lat,lng and short URLs (goo.gl/maps, maps.app.goo.gl).
 * Returns { lat, lng, name, address } or null.
 */
export async function extractPlaceFromUrl(url) {
  if (!url) return null;

  try {
    let resolvedUrl = url;

    // Resolve short URLs by following redirects
    if (url.includes('goo.gl') || url.includes('maps.app')) {
      try {
        const res = await fetch(url, { redirect: 'follow' });
        resolvedUrl = res.url || url;
      } catch {
        return null;
      }
    }

    // Extract lat,lng from @lat,lng pattern in URL
    const coordMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);

      // Extract place name from /place/Name/ pattern
      const placeMatch = resolvedUrl.match(/\/place\/([^/@]+)/);
      const name = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : null;

      return { lat, lng, name: name || null, address: null };
    }

    // Try ?q=lat,lng pattern
    const qMatch = resolvedUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      return {
        lat: parseFloat(qMatch[1]),
        lng: parseFloat(qMatch[2]),
        name: null,
        address: null,
      };
    }

    return null;
  } catch {
    return null;
  }
}
