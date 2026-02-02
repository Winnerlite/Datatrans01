import { readFileSync } from 'fs';
import { join } from 'path';

// Load JSON file once at startup
const jsonPath = join(process.cwd(), 'ngr.json');
let transportData;

try {
  const jsonContent = readFileSync(jsonPath, 'utf8');
  transportData = JSON.parse(jsonContent);
  console.log('✅ Transport data loaded successfully');
} catch (error) {
  console.error('❌ Failed to load ngr.json:', error);
  transportData = { 
    error: 'Failed to load transport data',
    message: error.message 
  };
}

export default async function handler(req, res) {
  // ---------------------------------------------------------
  // SECURITY GATEWAY
  // ---------------------------------------------------------
  const host = req.headers.host;
  
  const isWebsite = host && host.includes('intercityprices.com.ng');
  const isApiProduct = host && host.includes('vyrametrics.vercel.app');

  // --- SCENARIO A: Your Website (Strict Whitelist) ---
  if (isWebsite) {
    const allowedOrigins = [
      'https://www.intercityprices.com.ng',
      'https://intercityprices.com.ng',
      'http://localhost:3000',
      'http://localhost:5500'
    ];

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    let isAllowed = false;

    if (origin && allowedOrigins.includes(origin)) {
      isAllowed = true;
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (referer && allowedOrigins.some(d => referer.startsWith(d))) {
      isAllowed = true;
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    }

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
    const secretReceived = req.headers['x-proxy-secret'];
    const myRealSecret = process.env.PROXY_SECRET; 

    if (!myRealSecret || secretReceived !== myRealSecret) {
      return res.status(401).json({ 
        error: 'Unauthorized: Direct access not allowed. Use RapidAPI or Zyla.' 
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  } 
  
  // --- SCENARIO C: Fallback ---
  else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  // ---------------------------------------------------------
  // END SECURITY GATEWAY
  // ---------------------------------------------------------

  // Common Headers
  res.setHeader('Content-Type', 'application/json');
  // Keep your caching headers
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  // Check if data loaded successfully
  if (transportData.error) {
    return res.status(500).json(transportData);
  }

  const { state, company } = req.query;

  // Filter by state
  if (state) {
    const stateData = transportData.states?.[state];
    if (!stateData) {
      return res.status(404).json({
        error: 'State not found',
        message: `State "${state}" does not exist in the database`,
        availableStates: Object.keys(transportData.states || {})
      });
    }
    
    // Map company names to actual company data if possible
    const companyDetails = stateData.companies
      ? stateData.companies.map(companyName => transportData.transportCompanies?.[companyName]).filter(Boolean)
      : [];

    return res.status(200).json({
      state: state,
      data: stateData,
      companies: companyDetails
    });
  }

  // Filter by company
  if (company) {
    const companyData = transportData.transportCompanies?.[company];
    if (!companyData) {
      return res.status(404).json({
        error: 'Company not found',
        message: `Company "${company}" does not exist in the database`,
        availableCompanies: Object.keys(transportData.transportCompanies || {})
      });
    }
    return res.status(200).json({
      company: company,
      data: companyData
    });
  }

  // Return full data
  return res.status(200).json(transportData);
}
