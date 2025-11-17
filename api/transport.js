// api/transport.js

// First, let's make sure we can import the JSON properly
let transportData;

try {
  // Try to import the JSON file
  transportData = require('../ngr.json');
} catch (error) {
  // If import fails, use a fallback or fetch it
  console.error('Failed to import ngr.json:', error);
  // You might need to use dynamic import or read the file differently
}

export default async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if data is loaded
    if (!transportData) {
      return res.status(500).json({
        success: false,
        error: 'Data not loaded',
        message: 'Transport data could not be loaded'
      });
    }

    res.status(200).json({
      success: true,
      data: transportData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
