import { readFileSync } from 'fs';
import { join } from 'path';
import { verifyAccess } from './_lib/clients.js';

const jsonPath = join(process.cwd(), 'ngr.json');
let transportData;

try {
  transportData = JSON.parse(readFileSync(jsonPath, 'utf8'));
} catch (error) {
  transportData = { error: 'Failed to load data' };
}

export default async function handler(req, res) {
  if (!verifyAccess(req, res)) return;

  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { state } = req.query;

  if (state) {
    const stateData = transportData.states?.[state];
    if (!stateData) {
      return res.status(404).json({
        error: 'State not found',
        availableStates: Object.keys(transportData.states || {})
      });
    }
    return res.status(200).json({ state, ...stateData });
  }

  return res.status(200).json(transportData.states || {});
}
