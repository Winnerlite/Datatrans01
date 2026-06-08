// api/proxy/ncr.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // DEBUG: Log that the proxy was called
  console.log('Proxy called');

  try {
    const upstreamUrl = 'https://www.intercityprices.com.ng/api/ncr';
    
    // DEBUG: Log the key being sent
    console.log('Sending key: Atticus');
    
    const response = await fetch(upstreamUrl, {
      headers: {
        'x-api-key': 'Atticus'
      }
    });
    
    // DEBUG: Log upstream response status
    console.log('Upstream status:', response.status);
    
    if (!response.ok) {
      // DEBUG: Log the error response
      const errorText = await response.text();
      console.log('Upstream error response:', errorText);
      return res.status(response.status).json({ error: 'Upstream error: ' + errorText });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed: ' + error.message });
  }
}
