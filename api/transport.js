// api/transport.js
import { readFileSync } from 'fs';
import { join } from 'path';

// Load JSON file
const jsonPath = join(process.cwd(), 'ngr.json');
let transportData;

try {
  const jsonContent = readFileSync(jsonPath, 'utf8');
  transportData = JSON.parse(jsonContent);
} catch (error) {
  console.error('Failed to load ngr.json:', error);
  transportData = { error: 'Failed to load data' };
}

export default async function handler(req, res) {
  // ✅ CORS headers - THIS IS CRITICAL
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ Return direct JSON (same as ngr.json) BUT with CORS headers
  res.status(200).json(transportData);
}
