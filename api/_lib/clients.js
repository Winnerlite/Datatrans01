// ============================================================
// VYRA API ACCESS CONTROL
// ------------------------------------------------------------
// THE ONLY FILE YOU EDIT TO MANAGE CLIENTS.
//
// To add a client: create a key, add a line below.
// To remove a client: delete their line.
// ============================================================

const CLIENT_KEYS = {
  // --- Active clients ---
  // 'vyra_live_acme_8f3k2n9p4q':   'Acme Travels',
  // 'vyra_live_naija_2h7m5v1x8c':  'Naija Booking',
  // 'vyra_live_giglog_b4t9w6y3r7': 'GIG Logistics',

  // --- Removed clients (keep as backup comment) ---
  // 'vyra_live_oldclient_xxx':     'Former Client (removed 2026-06-01)',
};

// Browser whitelist — for YOUR OWN website only
const ALLOWED_ORIGINS = [
  'https://www.intercityprices.com.ng',
  'https://intercityprices.com.ng',
  'http://localhost:3000',
  'http://localhost:5500',
];

// ============================================================
// verifyAccess — call at the top of every endpoint
// Returns true if allowed, false if the request was blocked.
// ============================================================
export function verifyAccess(req, res) {
  const host = req.headers.host || '';
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // --- CORS preflight (always answer) ---
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    res.status(200).end();
    return false;
  }

  // --- Common CORS headers ---
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // ============================================================
  // PATH 1: Zyla / RapidAPI (proxy secret)
  // ============================================================
  if (host.includes('vyrametrics.vercel.app')) {
    const secret = req.headers['x-proxy-secret'];
    if (process.env.PROXY_SECRET && secret === process.env.PROXY_SECRET) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return true;
    }
    // No valid secret — fall through to key check below
  }

  // ============================================================
  // PATH 2: Client API key (works from any host)
  // ============================================================
  const key = req.headers['x-api-key'];
  if (key && CLIENT_KEYS[key]) {
    console.log(`[${CLIENT_KEYS[key]}] ${req.method} ${req.url}`);
    return true;
  }

  // ============================================================
  // PATH 3: Your own website (origin whitelist)
  // ============================================================
  if (host.includes('intercityprices.com.ng')) {
    const isAllowed =
      (origin && ALLOWED_ORIGINS.includes(origin)) ||
      (referer && ALLOWED_ORIGINS.some(d => referer.startsWith(d)));

    if (isAllowed) return true;
  }

  // ============================================================
  // REJECT
  // ============================================================
  if (key) {
    res.status(403).json({ error: 'Invalid or revoked API key.' });
  } else {
    res.status(401).json({
      error: 'Missing API key',
      message: 'Include your key in the x-api-key header.'
    });
  }
  return false;
}
