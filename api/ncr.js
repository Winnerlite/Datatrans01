import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  // --- KEY CHECK ---
  const apiKey = req.headers['x-api-key'];
  const mySecretKey = process.env.NCR_SECRET_KEY; // Set this in Vercel dashboard
  
  // If no key or wrong key, block access
  if (!mySecretKey || apiKey !== mySecretKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- CORS ---
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
