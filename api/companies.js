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

  const { company, name } = req.query;
  const searchName = company || name;

  if (searchName) {
    const companyData = transportData.transportCompanies?.[searchName];
    if (!companyData) {
      return res.status(404).json({
        error: 'Company not found',
        availableCompanies: Object.keys(transportData.transportCompanies || {})
      });
    }
    return res.status(200).json(companyData);
  }

  return res.status(200).json(transportData.transportCompanies || {});
}
