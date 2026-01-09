// API function for analytics and trends
// Routes: /api/analytics, /api/trends, /api/refresh-trends

const { createStorage, atomicUpdate } = require('./lib/storage');
const { fetchTrends, isCacheValid } = require('./lib/trends');

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
  const match = path.match(/^\/api\/(.+)/);
  return match ? match[1] : '';
}

// Analytics handler
async function handleAnalytics(event, storage) {
  try {
    const params = event.queryStringParameters || {};
    const days = parseInt(params.days) || 7;
    
    const clicksData = await storage.get('tt_clicks') || { clicks: [] };
    const clicks = clicksData.clicks || [];
    
    // Filter by date range
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recentClicks = clicks.filter(c => new Date(c.ts) >= cutoff);
    
    // Aggregate stats
    const byNetwork = {};
    const byDeal = {};
    const byDay = {};
    
    recentClicks.forEach(click => {
      // By network
      byNetwork[click.network] = (byNetwork[click.network] || 0) + 1;
      
      // By deal
      byDeal[click.id] = (byDeal[click.id] || 0) + 1;
      
      // By day
      const day = click.ts.substring(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });
    
    // Top deals
    const topDeals = Object.entries(byDeal)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, clicks: count }));
    
    // By day array (sorted)
    const byDayArray = Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, clicks: count }));
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalClicks: recentClicks.length,
        days: days,
        byNetwork: byNetwork,
        topDeals: topDeals,
        byDay: byDayArray
      })
    };
  } catch (err) {
    console.error('Analytics error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch analytics' })
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
  if (!isAdmin(event)) {
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

exports.handler = async (event) => {
  try {
    const route = parseRoute(event.path);
    const storage = await createStorage();
    
    // Route handlers
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
    console.error('API error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
