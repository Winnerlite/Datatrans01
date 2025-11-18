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

  const { q, query, attribute } = req.query;
  const searchQuery = (q || query || '').toLowerCase();

  if (!searchQuery) {
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
