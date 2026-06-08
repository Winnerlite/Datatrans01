// api/proxy/ncr.js
export default async function handler(req, res) {
  // Optional: Add a simple referer check for extra protection
  const referer = req.headers.referer || '';
  if (!referer.includes('intercityprices.com.ng') && !referer.includes('localhost')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const response = await fetch('https://www.intercityprices.com.ng/api/ncr', {
      headers: {
        'x-api-key': 'Atticus' // Key hidden here
      }
    });
    
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
