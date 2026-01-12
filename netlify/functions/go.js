// Click tracking redirect function
// Logs clicks and redirects to affiliate URLs

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { createStorage } = require('./lib/storage');
const { initializeAnalytics, recordClick, recordRedirectFailure } = require('./lib/initAnalytics');

// PHASE 8: AI Self-Healing - Log incidents to history.json
async function logIncident(incident) {
  try {
    const historyPath = path.join(__dirname, '../../.ai/history.json');
    const historyData = await fs.readFile(historyPath, 'utf8');
    const history = JSON.parse(historyData);
    
    history.incidents.push({
      timestamp: new Date().toISOString(),
      ...incident
    });
    
    // Keep last 1000 incidents
    if (history.incidents.length > 1000) {
      history.incidents = history.incidents.slice(-1000);
    }
    
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to log incident:', error);
    // Don't fail the request if logging fails
  }
}

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
    
    // REDIRECT LOOP DETECTION
    // Check cookie to detect rapid repeated redirects to same destination
    const cookies = event.headers.cookie || '';
    const cookieMatch = cookies.match(/tt_last_go=([^;]+)/);
    
    if (cookieMatch) {
      try {
        const lastGo = JSON.parse(decodeURIComponent(cookieMatch[1]));
        const now = Date.now();
        const timeDiff = now - (lastGo.time || 0);
        
        // If same ID within 2 seconds, likely a redirect loop
        if (lastGo.id === id && timeDiff < 2000) {
          console.error(`REDIRECT LOOP DETECTED: id=${id}, timeDiff=${timeDiff}ms`);
          
          // Load deals to get direct URL as fallback
          const deals = await loadDeals();
          const allDeals = [...deals.amazon, ...deals.travel];
          const deal = allDeals.find(d => d.id === id);
          
          const fallbackUrl = deal?.affiliate_url || '/';
          
          // Return HTML page explaining the issue
          return {
            statusCode: 200,
            headers: { 
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: `<!DOCTYPE html>
<html>
<head>
  <title>Redirect Loop Detected</title>
  <meta name="robots" content="noindex">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .error { background: #fee; border: 2px solid #c00; padding: 20px; border-radius: 8px; }
    .btn { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="error">
    <h1>⚠️ Redirect Loop Detected</h1>
    <p>Our affiliate routing system detected a redirect loop and stopped to prevent infinite redirects.</p>
    <p><strong>What happened:</strong> You were redirected to this deal multiple times in rapid succession.</p>
    ${deal ? `<p><a href="${fallbackUrl}" class="btn" target="_blank" rel="nofollow sponsored">→ Continue to Deal (Direct Link)</a></p>` : ''}
    <p><a href="/">← Return to Homepage</a></p>
  </div>
</body>
</html>`
          };
        }
      } catch (err) {
        // Cookie parsing failed, ignore and continue
        console.warn('Failed to parse tt_last_go cookie:', err);
      }
    }
    
    // Load deals
    const deals = await loadDeals();
    const allDeals = [...deals.amazon, ...deals.travel];
    const deal = allDeals.find(d => d.id === id);
    
    if (!deal) {
      console.warn(`Deal not found: ${id}`);
      
      // Fallback: check for direct URL parameter (for shared links)
      const directUrl = params.u;
      if (directUrl) {
        // Allowlist of trusted affiliate domains
        const allowedHosts = [
          'amzn.to',
          'amazon.com',
          'www.amazon.com',
          'booking.com',
          'www.booking.com',
          'travelpayouts.com'
        ];
        
        try {
          const url = new URL(directUrl);
          const hostname = url.hostname.toLowerCase();
          
          // Check if hostname or any parent domain is in allowlist
          const isAllowed = allowedHosts.some(allowed => 
            hostname === allowed || hostname.endsWith('.' + allowed)
          );
          
          if (isAllowed) {
            console.log(`Redirecting to allowed domain: ${hostname}`);
            return {
              statusCode: 302,
              headers: { 
                Location: directUrl,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              },
              body: ''
            };
          }
        } catch (err) {
          console.error('Invalid direct URL:', err);
        }
      }
      
      // No valid deal or fallback - redirect to home
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
    
    // Ensure analytics are initialized
    await initializeAnalytics(storage);
    
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
    
    // Create click event with enforced schema
    const clickEvent = {
      timestamp: new Date().toISOString(),
      network: network,
      deal_id: id,
      user_agent: event.headers['user-agent'] || 'unknown',
      referrer: event.headers.referer || event.headers.referrer || 'direct',
      ip_hash: ipHash
    };
    
    // Record click BEFORE redirect (with timeout protection)
    console.log(`Recording click: ${network}/${id}`);
    const recorded = await recordClick(storage, clickEvent);
    
    if (!recorded) {
      console.error('⚠️  Click recording failed, but continuing redirect');
    } else {
      console.log('✅ Click recorded successfully');
    }
    
    // Redirect to affiliate URL
    const affiliateUrl = deal.affiliate_url || deal.affiliateUrl || '/';
    
    // PHASE 1: PREVENT SELF-REDIRECT LOOPS
    const forbiddenHosts = [
      'tradetrend.netlify.app',
      'tradetrends.netlify.app',
      'localhost',
      '127.0.0.1'
    ];
    
    try {
      const targetUrl = new URL(affiliateUrl, 'https://tradetrend.netlify.app');
      
      if (forbiddenHosts.includes(targetUrl.hostname)) {
        console.error('🚨 FATAL: /go attempted to redirect to own domain:', affiliateUrl);
        
        // PHASE 5: Record redirect failure in analytics
        await recordRedirectFailure(storage, {
          dealId: id,
          network: network,
          reason: 'self-redirect',
          affiliate_url: affiliateUrl,
          hostname: targetUrl.hostname,
          timestamp: new Date().toISOString()
        });
        
        // PHASE 8: Log to history.json for AI self-healing
        await logIncident({
          severity: 'CRITICAL',
          type: 'redirect_failure',
          description: `Self-redirect loop detected: /go attempted to redirect to own domain (${targetUrl.hostname})`,
          affectedFiles: ['public/data/amazon.json', 'public/data/travel.json'],
          dealId: id,
          network: network,
          affiliate_url: affiliateUrl,
          rootCause: 'Deal affiliate_url points to own domain instead of external affiliate network',
          fix: 'forbiddenHosts check prevented redirect, returned HTML error page',
          preventionAdded: 'validate.js checks forbiddenHosts exists, canary test verifies no self-redirects'
        });
        
        // Log the error for analysis
        const errorLog = {
          type: 'redirect-loop',
          dealId: id,
          network: network,
          affiliate_url: affiliateUrl,
          userAgent: event.headers['user-agent'] || 'unknown',
          timestamp: new Date().toISOString()
        };
        console.error('Redirect loop error:', JSON.stringify(errorLog));
        
        // Return HTML fallback page with direct link
        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          body: `<!DOCTYPE html>
<html>
<head>
  <title>Redirect Error</title>
  <meta name="robots" content="noindex">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #1a1a2e; color: #fff; }
    .error { background: rgba(255,80,80,0.2); border: 2px solid #ff5050; padding: 20px; border-radius: 8px; }
    .btn { display: inline-block; margin-top: 15px; padding: 12px 24px; background: #00d2ff; color: #000; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="error">
    <h1>⚠️ Redirect Configuration Error</h1>
    <p>This deal link is misconfigured and would cause a redirect loop.</p>
    <p><strong>Deal ID:</strong> ${id}</p>
    <p>We've notified our team to fix this issue.</p>
    <p><a href="/" class="btn">← Return to Homepage</a></p>
  </div>
</body>
</html>`
        };
      }
    } catch (urlError) {
      console.error('Failed to parse affiliate URL:', affiliateUrl, urlError);
      // Invalid URL - fall through to normal redirect and let browser handle it
    }
    
    // Success - redirect to affiliate URL
    // Set cookie to track this redirect for loop detection
    const trackingCookie = encodeURIComponent(JSON.stringify({
      id: id,
      time: Date.now()
    }));
    
    return {
      statusCode: 302,
      headers: {
        Location: affiliateUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Set-Cookie': `tt_last_go=${trackingCookie}; Path=/; Max-Age=5; SameSite=Lax`
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
