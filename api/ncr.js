import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  const origin = req.headers.origin;
  
  // Allow localhost AND your live domains
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://intercityprices.com.ng',
    'https://www.intercityprices.com.ng'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, content-type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- KEY CHECK ---
  const apiKey = req.headers['x-api-key'];
  const mySecretKey = process.env.NCR_Secret_Key;
  
  if (!mySecretKey || apiKey !== mySecretKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const filePath = join(process.cwd(), 'NCR.json');
    const data = readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load data' });
  }
}
