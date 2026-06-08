// api/proxy/ncr.js
export default async function handler(req, res) {
  // Set CORS headers for all responses
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, content-type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://www.intercityprices.com.ng/api/ncr', {
      headers: {
        'x-api-key': 'Atticus'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream error' });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data from upstream' });
  }
        }
