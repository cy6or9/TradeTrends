// API function for analytics and trends
// Routes: /api/analytics, /api/trends, /api/refresh-trends

const { createStorage, atomicUpdate } = require('./lib/storage');
const { fetchTrends, isCacheValid } = require('./lib/trends');
const { initializeAnalytics, getAnalyticsSummary } = require('./lib/initAnalytics');

// Check if user is admin
function isAdmin(event) {
  try {
    const context = event.clientContext;
    if (!context || !context.user) return false;
    
    const roles = context.user.app_metadata?.roles || [];
    return roles.includes('admin');
  } catch (err) {
    console.error('Auth check error:', err);
    return false;
  }
}

// Parse route from path
function parseRoute(path) {
  // Handle both /api/route and /.netlify/functions/api/route
  const match = path.match(/^\/(?:\.netlify\/functions\/)?api\/(.+)/);
  return match ? match[1] : '';
}

// Analytics handler
async function handleAnalytics(event, storage) {
  try {
    // Ensure analytics are initialized
    await initializeAnalytics(storage);
    
    // Get analytics summary with guaranteed schema
    const summary = await getAnalyticsSummary(storage);
    
    // STRICT INPUT VALIDATION - Never trust query parameters
    const rawDays = event.queryStringParameters?.days;
    let days = Math.max(1, Math.min(90, Number(rawDays) || 7));
    
    // Double-check days is a safe number
    if (!Number.isFinite(days) || days < 1 || days > 90) {
      console.warn(`Invalid days parameter: ${rawDays}, using default 7`);
      days = 7;
    }
    
    // Filter daily data by date range
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().substring(0, 10);
    
    const filteredDays = summary.clicksByDay.filter(day => day.date >= cutoffStr);
    
    // GUARANTEED response contract - never return undefined/null
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        initialized: summary.initialized,
        totalClicks: summary.totalClicks,
        days: days,
        byNetwork: summary.clicksByNetwork,
        topDeals: summary.topDeals,
        byDay: filteredDays,
        lastUpdated: summary.lastUpdated
      })
    };
  } catch (err) {
    console.error('Analytics error:', err);
    // Return safe defaults even on error
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initialized: false,
        totalClicks: 0,
        days: parseInt(event.queryStringParameters?.days) || 7,
        byNetwork: {},
        topDeals: [],
        byDay: [],
        error: 'Failed to fetch analytics',
        errorMessage: err.message
      })
    };
  }
}

// Trends handler (GET)
async function handleTrends(event, storage) {
  try {
    const cached = await storage.get('tt_trends');
    
    if (cached && isCacheValid(cached, 6)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cached)
      };
    }
    
    // If no valid cache, return stale data with note
    if (cached) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cached,
          stale: true,
          message: 'Data is stale. Trigger refresh to update.'
        })
      };
    }
    
    // No cache at all - return empty
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedAt: null,
        sources: [],
        items: [],
        message: 'No trends data available. Trigger a refresh.'
      })
    };
  } catch (err) {
    console.error('Trends fetch error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch trends' })
    };
  }
}

// Refresh trends handler (POST, admin-only)
async function handleRefreshTrends(event, storage) {
  // Skip admin check in dev/local mode
  const isLocal = !process.env.CONTEXT || process.env.CONTEXT === 'dev';
  
  if (!isLocal && !isAdmin(event)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Admin access required' })
    };
  }
  
  try {
    // Check if we should respect cache
    const cached = await storage.get('tt_trends');
    const params = event.queryStringParameters || {};
    const force = params.force === 'true';
    
    if (!force && cached && isCacheValid(cached, 6)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cached,
          message: 'Cache still valid. Use ?force=true to refresh anyway.'
        })
      };
    }
    
    // Fetch fresh trends
    console.log('Fetching fresh trends data...');
    const trends = await fetchTrends();
    
    // Save to storage
    await storage.set('tt_trends', trends);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...trends,
        message: 'Trends refreshed successfully'
      })
    };
  } catch (err) {
    console.error('Refresh trends error:', err);
    
    // Try to return cached data on error
    const cached = await storage.get('tt_trends');
    if (cached) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cached,
          error: 'Refresh failed, returning cached data',
          errorMessage: err.message
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to refresh trends', message: err.message })
    };
  }
}

// Click tracking handler (no redirect, returns 204)
async function handleClickTracking(event, storage) {
  try {
    // Validate network and id
    const params = event.queryStringParameters || {};
    const network = params.network;
    const id = params.id;
    
    if (!network || !['amazon', 'travel'].includes(network)) {
      console.warn('Invalid network:', network);
      return { statusCode: 204, headers: { 'Cache-Control': 'no-store' }, body: '' };
    }
    
    if (!id || id.trim() === '') {
      console.warn('Missing deal id');
      return { statusCode: 204, headers: { 'Cache-Control': 'no-store' }, body: '' };
    }
    
    // Ensure analytics are initialized
    await initializeAnalytics(storage);
    
    // Get IP and hash it
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    const crypto = require('crypto');
    const salt = process.env.TT_SALT || 'default-salt';
    const ipHash = crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 16);
    
    // Create click event
    const clickEvent = {
      timestamp: new Date().toISOString(),
      network: network,
      deal_id: id,
      user_agent: event.headers['user-agent'] || 'unknown',
      referrer: event.headers.referer || event.headers.referrer || 'direct',
      ip_hash: ipHash
    };
    
    // Record click (best effort, don't block)
    console.log(`Background click tracking: ${network}/${id}`);
    await recordClick(storage, clickEvent).catch(err => {
      console.error('Click tracking failed:', err);
    });
    
    // Always return 204 (no content)
    return {
      statusCode: 204,
      headers: { 
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      },
      body: ''
    };
    
  } catch (err) {
    console.error('Click tracking error:', err);
    // Still return 204 even on error
    return {
      statusCode: 204,
      headers: { 'Cache-Control': 'no-store' },
      body: ''
    };
  }
}

exports.handler = async (event) => {
  // CRASH-PROOF: Wrap entire handler to never throw uncaught errors
  try {
    console.log('API function called:', {
      path: event.path,
      method: event.httpMethod,
      query: event.queryStringParameters
    });
    
    const route = parseRoute(event.path);
    console.log('Parsed route:', route);
    
    const storage = await createStorage();
    
    // Route handlers
    if (route === 'click' && (event.httpMethod === 'GET' || event.httpMethod === 'POST')) {
      return await handleClickTracking(event, storage);
    }
    
    if (route === 'analytics' && event.httpMethod === 'GET') {
      return await handleAnalytics(event, storage);
    }
    
    if (route === 'trends' && event.httpMethod === 'GET') {
      return await handleTrends(event, storage);
    }
    
    if (route === 'refresh-trends' && event.httpMethod === 'POST') {
      return await handleRefreshTrends(event, storage);
    }
    
    // Unknown route
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (err) {
    console.error('API CRASH PREVENTED:', err);
    
    // NEVER return 500 or throw - always return 200 with safe defaults
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: err.message || 'Internal error',
        safe: true,
        clicks: [],
        totals: { amazon: 0, travel: 0 },
        days: 7,
        initialized: false,
        totalClicks: 0,
        byNetwork: {},
        topDeals: [],
        byDay: []
      })
    };
  }
};
