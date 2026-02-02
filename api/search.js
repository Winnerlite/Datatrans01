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
      'http://localhost:8080'  // Common local server port
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
      // If we verified via referer, we can set the specific origin allowed, 
      // but for simplicity, we often just allow the request to proceed.
      // If strict CORS is needed on response, we'd need to mirror the origin.
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Allow Preflight (OPTIONS) to pass, but block actual data if not allowed
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
  
  // --- SCENARIO C: Unknown Host (Fallback Safety) ---
  else {
    // If it's hitting some other Vercel URL you didn't plan for
    // You can choose to allow or block. Usually safe to block.
    if (req.method !== 'OPTIONS') {
       // Optional: Uncomment to block unknown hosts
       // return res.status(403).json({ error: 'Forbidden: Unknown host.' });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // ---------------------------------------------------------
  // END SECURITY GATEWAY
  // ---------------------------------------------------------

  // Common Headers
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, query, attribute } = req.query;
  const searchQuery = (q || query || '').toLowerCase();

  if (!searchQuery && !attribute) {
    return res.status(400).json({
      error: 'Missing search query',
      message: 'Please provide a search term using ?q=searchterm'
    });
  }

  const results = {
    companies: [],
    states: [],
    routes: []
  };

  // Search companies
  Object.entries(transportData.transportCompanies || {}).forEach(([name, data]) => {
    if (name.toLowerCase().includes(searchQuery)) {
      results.companies.push({ name, ...data });
    }
  });

  // Search states
  Object.entries(transportData.states || {}).forEach(([name, data]) => {
    if (name.toLowerCase().includes(searchQuery)) {
      results.states.push({ name, ...data });
    }
  });

  // Search routes
  Object.keys(transportData.routePrices || {}).forEach(route => {
    if (route.toLowerCase().includes(searchQuery)) {
      results.routes.push({
        route,
        route, // Redundant key, but harmless
        prices: transportData.routePrices[route]
      });
    }
  });

  // If searching by attribute
  if (attribute) {
    const companiesWithAttribute = Object.entries(transportData.transportCompanies || {})
      .filter(([, data]) => 
        data.serviceAttributes?.some(attr => 
          attr.toLowerCase().includes(attribute.toLowerCase())
        )
      )
      .map(([name, data]) => ({ name, ...data }));

    return res.status(200).json({
      attribute,
      companies: companiesWithAttribute,
      count: companiesWithAttribute.length
    });
  }

  return res.status(200).json({
    query: searchQuery,
    results,
    totalFound: results.companies.length + results.states.length + results.routes.length
  });
}
