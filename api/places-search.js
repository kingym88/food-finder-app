export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, location, radius, apiKey } = req.body;

  if (!apiKey || !location || !query) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const searchQuery = `${query} restaurant`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=${encodeURIComponent(searchQuery)}&` +
      `location=${location.latitude},${location.longitude}&` +
      `radius=${radius}&` +
      `key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(400).json({ error: `Google Places API error: ${data.status}` });
    }

    const restaurants = data.results.slice(0, 20).map(place => {
      // Calculate distance
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      );

      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || 0,
        priceLevel: place.price_level || 0,
        image: place.photos && place.photos.length > 0 ? 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}` :
          null,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        openNow: place.opening_hours?.open_now,
        types: place.types || [],
        distance: distance.toFixed(2)
      };
    });

    res.status(200).json({ restaurants });

  } catch (error) {
    console.error('Places search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}