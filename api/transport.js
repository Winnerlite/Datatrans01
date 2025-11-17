// api/transport.js
import transportData from '../ngr.json';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Remove API key check for now
  // const apiKey = req.headers['x-api-key'];
  // if (!apiKey || apiKey !== process.env.API_KEY) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  res.status(200).json({
    success: true,
    data: transportData,
    timestamp: new Date().toISOString()
  });
}
