// Click tracking redirect function
// Logs clicks and redirects to affiliate URLs

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { createStorage, atomicUpdate } = require('./lib/storage');

// Hash IP with salt for privacy
function hashIp(ip, salt) {
  return crypto.createHash('sha256').update(ip + (salt || 'default-salt')).digest('hex').substring(0, 16);
}

// Rate limiting: max 30 clicks per 10 minutes per IP
async function checkRateLimit(storage, ipHash) {
  const now = Date.now();
  const window = 10 * 60 * 1000; // 10 minutes
  const maxClicks = 30;
  
  try {
    const rateLimits = await storage.get('rate_limits') || {};
    const userLimits = rateLimits[ipHash] || { clicks: [], lastReset: now };
    
    // Filter out old clicks
    userLimits.clicks = userLimits.clicks.filter(t => now - t < window);
    
    if (userLimits.clicks.length >= maxClicks) {
      return { allowed: false, remaining: 0 };
    }
    
    userLimits.clicks.push(now);
    rateLimits[ipHash] = userLimits;
    
    // Clean up old entries (keep last 1000 IPs)
    const entries = Object.entries(rateLimits);
    if (entries.length > 1000) {
      const sorted = entries.sort((a, b) => {
        const aLast = Math.max(...(a[1].clicks || [0]));
        const bLast = Math.max(...(b[1].clicks || [0]));
        return bLast - aLast;
      });
      const cleaned = Object.fromEntries(sorted.slice(0, 1000));
      await storage.set('rate_limits', cleaned);
    } else {
      await storage.set('rate_limits', rateLimits);
    }
    
    return { allowed: true, remaining: maxClicks - userLimits.clicks.length };
  } catch (err) {
    console.error('Rate limit check error:', err);
    return { allowed: true, remaining: maxClicks }; // Fail open
  }
}

// Load deals data
async function loadDeals() {
  try {
    const amazonPath = path.join(process.cwd(), 'public', 'data', 'amazon.json');
    const travelPath = path.join(process.cwd(), 'public', 'data', 'travel.json');
    
    const [amazon, travel] = await Promise.all([
      fs.readFile(amazonPath, 'utf-8').then(JSON.parse).catch(() => ({ items: [] })),
      fs.readFile(travelPath, 'utf-8').then(JSON.parse).catch(() => ({ items: [] }))
    ]);
    
    return {
      amazon: amazon.items || [],
      travel: travel.items || []
    };
  } catch (err) {
    console.error('Failed to load deals:', err);
    return { amazon: [], travel: [] };
  }
}

exports.handler = async (event) => {
  try {
    // Parse query params
    const params = event.queryStringParameters || {};
    const network = params.network || 'amazon';
    const id = params.id;
    
    if (!id) {
      return {
        statusCode: 302,
        headers: { Location: '/' },
        body: ''
      };
    }
    
    // Load deals
    const deals = await loadDeals();
    const allDeals = [...deals.amazon, ...deals.travel];
    const deal = allDeals.find(d => d.id === id);
    
    if (!deal) {
      console.warn(`Deal not found: ${id}`);
      return {
        statusCode: 302,
        headers: { Location: '/' },
        body: ''
      };
    }
    
    // Get IP and hash it
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    const salt = process.env.TT_SALT || 'default-salt';
    const ipHash = hashIp(ip, salt);
    
    // Initialize storage
    const storage = await createStorage();
    
    // Check rate limit
    const rateCheck = await checkRateLimit(storage, ipHash);
    if (!rateCheck.allowed) {
      console.warn(`Rate limit exceeded for ${ipHash}`);
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Too many requests. Please try again later.'
      };
    }
    
    // Log click event
    const clickEvent = {
      ts: new Date().toISOString(),
      id: id,
      network: network,
      referrer: event.headers.referer || event.headers.referrer || 'direct',
      ua: event.headers['user-agent'] || 'unknown',
      ipHash: ipHash
    };
    
    try {
      await atomicUpdate(storage, 'tt_clicks', (current) => {
        const clicks = current.clicks || [];
        clicks.push(clickEvent);
        
        // Keep last 10,000 clicks
        if (clicks.length > 10000) {
          clicks.splice(0, clicks.length - 10000);
        }
        
        return { clicks, lastUpdated: new Date().toISOString() };
      });
    } catch (err) {
      console.error('Failed to log click:', err);
      // Continue with redirect even if logging fails
    }
    
    // Redirect to affiliate URL
    const affiliateUrl = deal.affiliate_url || deal.affiliateUrl || '/';
    
    return {
      statusCode: 302,
      headers: {
        Location: affiliateUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: ''
    };
    
  } catch (err) {
    console.error('Go function error:', err);
    return {
      statusCode: 302,
      headers: { Location: '/' },
      body: ''
    };
  }
};
