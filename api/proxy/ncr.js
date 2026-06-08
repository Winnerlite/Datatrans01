// api/proxy/ncr.js
export default async function handler(req, res) {
  // Allow all origins for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://www.intercityprices.com.ng/api/ncr', {
      headers: {
        'x-api-key': 'Atticus'
      }
    });
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
