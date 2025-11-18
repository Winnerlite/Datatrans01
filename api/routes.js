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

  const { from, to, route } = req.query;

  // If specific route requested
  if (route) {
    const routeData = transportData.routePrices?.[route];
    if (!routeData) {
      return res.status(404).json({
        error: 'Route not found',
        availableRoutes: Object.keys(transportData.routePrices || {})
      });
    }
    return res.status(200).json({
      route: route,
      prices: routeData
    });
  }

  // If from-to format
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
      from: from,
      to: to,
      prices: routeData
    });
  }

  // Return all routes
  return res.status(200).json(transportData.routePrices || {});
}
