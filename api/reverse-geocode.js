export default async function handler(req, res) {
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

  const { lat, lng, apiKey } = req.body;

  if (!apiKey || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const cityComponent = result.address_components.find(
        component => component.types.includes('locality') || 
                    component.types.includes('administrative_area_level_1')
      );

      const cityName = cityComponent ? cityComponent.long_name : 'Your Location';

      res.status(200).json({ cityName });
    } else {
      res.status(200).json({ cityName: 'Your Location' });
    }

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}