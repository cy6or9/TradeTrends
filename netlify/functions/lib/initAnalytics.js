/**
 * Analytics Initialization Module
 * Ensures analytics storage keys exist with proper schema
 */

/**
 * Initialize analytics storage with default structures
 * @param {Object} storage - Storage instance
 * @returns {Promise<boolean>} - Success status
 */
async function initializeAnalytics(storage) {
  try {
    console.log('Initializing analytics storage...');
    
    // ALWAYS ensure all storage keys exist with proper structure
    // Never allow undefined/null storage - create empty if missing
    
    // 1. Initialize summary (or create if missing)
    let summary = await storage.get('analytics:summary');
    if (!summary || !summary.initialized) {
      summary = {
        initialized: true,
        initializedAt: new Date().toISOString(),
        totalClicks: 0,
        clicksByNetwork: {},
        version: 1
      };
      await storage.set('analytics:summary', summary);
      console.log('Created empty analytics:summary');
    }
    
    // 2. Initialize daily buckets (or create if missing)
    let daily = await storage.get('analytics:daily');
    if (!daily || !daily.buckets) {
      daily = {
        buckets: {},
        lastUpdated: new Date().toISOString()
      };
      await storage.set('analytics:daily', daily);
      console.log('Created empty analytics:daily');
    }
    
    // 3. Initialize deal counters (or create if missing)
    let deals = await storage.get('analytics:deals');
    if (!deals || !deals.deals) {
      deals = {
        deals: {},
        lastUpdated: new Date().toISOString()
      };
      await storage.set('analytics:deals', deals);
      console.log('Created empty analytics:deals');
    }
    
    // 4. Initialize clicks log (or create if missing)
    let clicks = await storage.get('tt_clicks');
    if (!clicks || !clicks.clicks) {
      clicks = {
        clicks: [],
        lastUpdated: new Date().toISOString()
      };
      await storage.set('tt_clicks', clicks);
      console.log('Created empty tt_clicks');
    }
    
    console.log('✅ Analytics initialized successfully');
    return true;
    
  } catch (err) {
    console.error('Failed to initialize analytics:', err);
    return false;
  }
}

/**
 * Get or create today's analytics bucket
 * @param {Object} storage - Storage instance
 * @returns {Promise<string>} - Today's bucket key (YYYY-MM-DD)
 */
function getTodayBucket() {
  const now = new Date();
  return now.toISOString().substring(0, 10); // YYYY-MM-DD
}

/**
 * Record a click event with proper schema
 * @param {Object} storage - Storage instance
 * @param {Object} event - Click event data
 * @returns {Promise<boolean>} - Success status
 */
async function recordClick(storage, event) {
  const timeout = 5000; // 5 second timeout for write
  
  try {
    // Validate event schema
    if (!event.network || !event.deal_id) {
      console.error('Invalid click event schema:', event);
      return false;
    }
    
    const writePromise = (async () => {
      const bucket = getTodayBucket();
      
      // 1. Update summary
      const summary = await storage.get('analytics:summary') || {
        initialized: true,
        totalClicks: 0,
        clicksByNetwork: {}
      };
      
      summary.totalClicks = (summary.totalClicks || 0) + 1;
      summary.clicksByNetwork[event.network] = (summary.clicksByNetwork[event.network] || 0) + 1;
      summary.lastUpdated = new Date().toISOString();
      
      await storage.set('analytics:summary', summary);
      
      // 2. Update daily bucket
      const daily = await storage.get('analytics:daily') || { buckets: {} };
      if (!daily.buckets[bucket]) {
        daily.buckets[bucket] = { date: bucket, clicks: 0, byNetwork: {} };
      }
      
      daily.buckets[bucket].clicks += 1;
      daily.buckets[bucket].byNetwork[event.network] = 
        (daily.buckets[bucket].byNetwork[event.network] || 0) + 1;
      daily.lastUpdated = new Date().toISOString();
      
      await storage.set('analytics:daily', daily);
      
      // 3. Update deal counters
      const deals = await storage.get('analytics:deals') || { deals: {} };
      if (!deals.deals[event.deal_id]) {
        deals.deals[event.deal_id] = { id: event.deal_id, clicks: 0 };
      }
      
      deals.deals[event.deal_id].clicks += 1;
      deals.lastUpdated = new Date().toISOString();
      
      await storage.set('analytics:deals', deals);
      
      // 4. Append to clicks log (for backward compatibility)
      const clicks = await storage.get('tt_clicks') || { clicks: [] };
      clicks.clicks = clicks.clicks || [];
      clicks.clicks.push({
        ts: event.timestamp,
        id: event.deal_id,
        network: event.network,
        referrer: event.referrer,
        ua: event.user_agent,
        ipHash: event.ip_hash
      });
      
      // Keep last 10,000 clicks
      if (clicks.clicks.length > 10000) {
        clicks.clicks = clicks.clicks.slice(-10000);
      }
      
      clicks.lastUpdated = new Date().toISOString();
      await storage.set('tt_clicks', clicks);
      
      return true;
    })();
    
    // Race against timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Write timeout')), timeout)
    );
    
    await Promise.race([writePromise, timeoutPromise]);
    
    console.log(`✅ Click recorded: ${event.network}/${event.deal_id}`);
    return true;
    
  } catch (err) {
    console.error('Failed to record click:', err);
    return false;
  }
}

/**
 * Get analytics summary
 * @param {Object} storage - Storage instance
 * @returns {Promise<Object>} - Analytics summary with guaranteed schema
 */
async function getAnalyticsSummary(storage) {
  try {
    await initializeAnalytics(storage);
    
    const summary = await storage.get('analytics:summary') || {};
    const daily = await storage.get('analytics:daily') || { buckets: {} };
    const deals = await storage.get('analytics:deals') || { deals: {} };
    
    // Ensure proper response contract
    return {
      initialized: summary.initialized || false,
      totalClicks: summary.totalClicks || 0,
      clicksByNetwork: summary.clicksByNetwork || {},
      clicksByDay: Object.values(daily.buckets || {}).sort((a, b) => 
        a.date.localeCompare(b.date)
      ),
      topDeals: Object.values(deals.deals || {})
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10),
      lastUpdated: summary.lastUpdated || null
    };
  } catch (err) {
    console.error('Failed to get analytics summary:', err);
    // Return safe defaults
    return {
      initialized: false,
      totalClicks: 0,
      clicksByNetwork: {},
      clicksByDay: [],
      topDeals: [],
      error: err.message
    };
  }
}

module.exports = {
  initializeAnalytics,
  getTodayBucket,
  recordClick,
  getAnalyticsSummary
};
