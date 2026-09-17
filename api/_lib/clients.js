// ============================================================
// CLIENT API KEYS — THE ONLY FILE YOU EDIT TO MANAGE CLIENTS
// ============================================================
// Add a client: create a key, add the line below.
// Remove a client: delete their line.
// That's it. No other file needs to change.
// ============================================================
export const CLIENT_KEYS = {
  // --- Active clients ---
  'vyra_live_acme_8f3k2n9p4q':      'Acme Travels',
  'vyra_live_naija_2h7m5v1x8c':     'Naija Booking',
  'vyra_live_giglog_b4t9w6y3r7':    'GIG Logistics',
  'vyra_live_travelbud_9d2k7s5v1':  'TravelBuddy',
  'vyra_live_redline_6m1p4x9n3k':   'Redline Express'
  // 'vyra_live_oldclient_xxx':     'Former Client (removed)',
};

/**
 * Verifies access. Call at the top of every endpoint handler.
 * Returns true if the request should proceed, false if blocked.
 */
export function verifyClientKey(req, res) {
  const host = req.headers.host || '';

  // Your own domains — endpoint-level security handles these
  if (host.includes('intercityprices.com.ng') || host.includes('vyrametrics.vercel.app')) {
    return true;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    res.status(200).end();
    return false;
  }

  // CORS headers for the browser
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  if (origin) res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // Require a client key
  const key = req.headers['x-api-key'];

  if (!key) {
    res.status(401).json({
      error: 'Missing API key',
      message: 'Include your key in the x-api-key header.'
    });
    return false;
  }

  const clientName = CLIENT_KEYS[key];

  if (!clientName) {
    res.status(403).json({
      error: 'Invalid or revoked API key.'
    });
    return false;
  }

  // Log usage — helps you spot which client is hammering you
  console.log(`[${clientName}] ${req.method} ${req.url}`);

  return true;
}
