// api/transport.js
import { readFileSync } from 'fs';
import { join } from 'path';

// Load JSON file once at startup (not on every request)
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
  // ✅ Enhanced CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-RapidAPI-Key');
  res.setHeader('Content-Type', 'application/json');
  
  // ✅ Add caching headers (improves performance)
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  // ✅ Check if data loaded successfully
  if (transportData.error) {
    return res.status(500).json(transportData);
  }

  // ✅ Optional: Query parameters for filtering
  const { state, company } = req.query;

  // Filter by state if requested
  if (state) {
    const stateData = transportData.states[state];
    if (!stateData) {
      return res.status(404).json({
        error: 'State not found',
        message: `State "${state}" does not exist in the database`,
        availableStates: Object.keys(transportData.states)
      });
    }
    return res.status(200).json({
      state: state,
      data: stateData,
      companies: stateData.companies.map(companyName => 
        transportData.transportCompanies[companyName]
      ).filter(Boolean)
    });
  }

  // Filter by company if requested
  if (company) {
    const companyData = transportData.transportCompanies[company];
    if (!companyData) {
      return res.status(404).json({
        error: 'Company not found',
        message: `Company "${company}" does not exist in the database`,
        availableCompanies: Object.keys(transportData.transportCompanies)
      });
    }
    return res.status(200).json({
      company: company,
      data: companyData
    });
  }

  // ✅ Return full data with proper status
  return res.status(200).json(transportData);
}
