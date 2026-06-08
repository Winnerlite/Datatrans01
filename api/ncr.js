import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  // Set CORS to block localhost
  const origin = req.headers.origin;
  
  if (origin === 'http://localhost:8080') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Allow your live domain
  if (origin === 'https://intercityprices.com.ng' || origin === 'https://www.intercityprices.com.ng') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Read NCR.json from root
  const filePath = join(process.cwd(), 'NCR.json');
  const data = readFileSync(filePath, 'utf8');
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(data);
}
