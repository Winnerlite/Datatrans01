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

  const { q, query, attribute } = req.query;
  const searchQuery = (q || query || '').toLowerCase();

  if (!searchQuery && !attribute) {
    return res.status(400).json({
      error: 'Missing search query',
      message: 'Please provide a search term using ?q=searchterm'
    });
  }

  const results = { companies: [], states: [], routes: [] };

  Object.entries(transportData.transportCompanies || {}).forEach(([name, data]) => {
    if (name.toLowerCase().includes(searchQuery)) {
      results.companies.push({ name, ...data });
    }
  });

  Object.entries(transportData.states || {}).forEach(([name, data]) => {
    if (name.toLowerCase().includes(searchQuery)) {
      results.states.push({ name, ...data });
    }
  });

  Object.keys(transportData.routePrices || {}).forEach(route => {
    if (route.toLowerCase().includes(searchQuery)) {
      results.routes.push({
        route,
        prices: transportData.routePrices[route]
      });
    }
  });

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
