// api/proxy/ncr.js
export default async function handler(req, res) {
  // --- BLOCK DIRECT BROWSER ACCESS ---
  const referer = req.headers.referer || '';
  const userAgent = req.headers['user-agent'] || '';
  
  // Allow only requests from your website
  if (!referer.includes('intercityprices.com.ng') && !referer.includes('localhost')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Block common browser user agents (optional)
  const browserUA = ['Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge'];
  if (browserUA.some(ua => userAgent.includes(ua)) && !referer) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://www.intercityprices.com.ng/api/ncr', {
      headers: { 'x-api-key': 'Atticus' }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy failed' });
  }
}
