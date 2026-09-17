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

  const { from, to, route } = req.query;

  if (route) {
    const routeData = transportData.routePrices?.[route];
    if (!routeData) {
      return res.status(404).json({
        error: 'Route not found',
        availableRoutes: Object.keys(transportData.routePrices || {})
      });
    }
    return res.status(200).json({ route, prices: routeData });
  }

  if (from && to) {
    const routeKey = `${from}-${to}`;
    const routeData = transportData.routePrices?.[routeKey];
    if (!routeData) {
      return res.status(404).json({
        error: 'Route not found',
        searchedRoute: routeKey,
        availableRoutes: Object.keys(transportData.routePrices || {})
      });
    }
    return res.status(200).json({
      route: routeKey,
      from,
      to,
      prices: routeData
    });
  }

  return res.status(200).json(transportData.routePrices || {});
}
