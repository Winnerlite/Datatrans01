import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  // --- HANDLE OPTIONS PREFLIGHT ---
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin === 'https://intercityprices.com.ng' || origin === 'https://www.intercityprices.com.ng' || origin === 'http://localhost:8080') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'x-api-key, content-type');
    }
    return res.status(200).end();
  }

  // --- KEY CHECK ---
  const apiKey = req.headers['x-api-key'];
  const mySecretKey = process.env.NCR_Secret_Key;
  
  if (!mySecretKey || apiKey !== mySecretKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- CORS FOR ACTUAL REQUEST ---
  const origin = req.headers.origin;
  
  if (origin === 'http://localhost:8080') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (origin === 'https://intercityprices.com.ng' || origin === 'https://www.intercityprices.com.ng') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // --- SERVE DATA ---
  try {
    const filePath = join(process.cwd(), 'NCR.json');
    const data = readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load data' });
  }
}
