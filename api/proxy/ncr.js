// api/proxy/ncr.js
export default async function handler(req, res) {
  try {
    const response = await fetch('https://www.intercityprices.com.ng/api/ncr', {
      headers: {
        'x-api-key': 'Atticus' // Key hidden here
      }
    });
    
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
