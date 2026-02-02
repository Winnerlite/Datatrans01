import { readFileSync } from 'fs';
import { join } from 'path';

// Load the data once
const jsonPath = join(process.cwd(), 'ngr.json');
let transportData;

try {
  transportData = JSON.parse(readFileSync(jsonPath, 'utf8'));
} catch (error) {
  transportData = { error: 'Failed to load data' };
}

export default async function handler(req, res) {
  // ---------------------------------------------------------
  // SECURITY GATEWAY
  // ---------------------------------------------------------
  const host = req.headers.host;
  
  // Identify where the request is hitting
  const isWebsite = host && host.includes('intercityprices.com.ng');
  const isApiProduct = host && host.includes('vyrametrics.vercel.app');

  // --- SCENARIO A: Your Website (Strict Whitelist) ---
  if (isWebsite) {
    const allowedOrigins = [
      'https://www.intercityprices.com.ng',
      'https://intercityprices.com.ng',
      'http://localhost:3000', // For local testing
      'http://localhost:5500'
    ];

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    let isAllowed = false;

    // Check Origin or Referer
    if (origin && allowedOrigins.includes(origin)) {
      isAllowed = true;
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (referer && allowedOrigins.some(d => referer.startsWith(d))) {
      isAllowed = true;
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Allow Preflight (OPTIONS) to pass check
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      return res.status(200).end();
    }

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Access denied.' });
    }
  } 
  
  // --- SCENARIO B: RapidAPI / Zyla (Secret Token) ---
  else if (isApiProduct) {
    // 1. Check for the Secret Password
    const secretReceived = req.headers['x-proxy-secret'];
    const myRealSecret = process.env.PROXY_SECRET; 

    // 2. Reject if missing or wrong
    if (!myRealSecret || secretReceived !== myRealSecret) {
      return res.status(401).json({ 
        error: 'Unauthorized: Direct access not allowed. Use RapidAPI or Zyla.' 
      });
    }

    // 3. Allow if correct
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  } 
  
  // --- SCENARIO C: Fallback / Unknown Host ---
  else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  // ---------------------------------------------------------
  // END SECURITY GATEWAY
  // ---------------------------------------------------------

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
