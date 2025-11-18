import { readFileSync } from 'fs';
import { join } from 'path';

const jsonPath = join(process.cwd(), 'ngr.json');
let transportData;

try {
  transportData = JSON.parse(readFileSync(jsonPath, 'utf8'));
} catch (error) {
  transportData = { error: 'Failed to load data' };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { state } = req.query;

  // If specific state requested
  if (state) {
    const stateData = transportData.states?.[state];
    if (!stateData) {
      return res.status(404).json({
        error: 'State not found',
        availableStates: Object.keys(transportData.states || {})
      });
    }
    return res.status(200).json({
      state: state,
      ...stateData
    });
  }

  // Return all states
  return res.status(200).json(transportData.states || {});
                                 }
