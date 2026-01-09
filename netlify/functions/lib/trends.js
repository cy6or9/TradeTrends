// Trends fetcher - fetches public trending data from Amazon and Travel sites

const https = require('https');
const http = require('http');

// Fetch with timeout
function fetchWithTimeout(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    
    protocol.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; TradeTrends/1.0; +https://tradetrend.netlify.app)'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        resolve(data);
      });
    }).on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Minimal parser - just extract basic trend signals
function parseAmazonTrends(html, source) {
  const items = [];
  
  try {
    // Very basic extraction - looking for product titles
    // Amazon HTML structure varies, so this is intentionally minimal
    const titlePattern = /aria-label="([^"]{10,100})"/g;
    let match;
    let count = 0;
    
    while ((match = titlePattern.exec(html)) && count < 10) {
      const title = match[1];
      if (title && !title.includes('Skip to') && !title.includes('Amazon.com')) {
        items.push({
          title: title.substring(0, 80),
          source: source,
          category: 'Amazon Trending',
          link: null // We don't extract links to avoid scraping issues
        });
        count++;
      }
    }
  } catch (err) {
    console.error('Parse error:', err);
  }
  
  return items;
}

function parseTravelTrends(html, source) {
  const items = [];
  
  try {
    // Even more minimal - just capture any destination/hotel mentions
    // This is intentionally simplistic to avoid scraping issues
    const patterns = [
      /destination[^>]*>([^<]{5,50})</gi,
      /hotel[^>]*>([^<]{5,50})</gi,
      /deals?[^>]*>([^<]{5,50})</gi
    ];
    
    let count = 0;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) && count < 10) {
        const text = match[1].trim();
        if (text.length > 5 && text.length < 50 && !text.includes('<')) {
          items.push({
            title: text,
            source: source,
            category: 'Travel Trending',
            link: null
          });
          count++;
        }
      }
    }
  } catch (err) {
    console.error('Parse error:', err);
  }
  
  return items;
}

async function fetchTrends() {
  const sources = [
    { 
      url: 'https://www.amazon.com/gp/movers-and-shakers',
      name: 'Amazon Movers & Shakers',
      type: 'amazon'
    },
    {
      url: 'https://www.amazon.com/gp/bestsellers',
      name: 'Amazon Best Sellers',
      type: 'amazon'
    }
  ];
  
  const results = {
    generatedAt: new Date().toISOString(),
    sources: [],
    items: []
  };
  
  for (const source of sources) {
    try {
      console.log(`Fetching ${source.name}...`);
      const html = await fetchWithTimeout(source.url, 8000);
      
      const items = source.type === 'amazon' 
        ? parseAmazonTrends(html, source.name)
        : parseTravelTrends(html, source.name);
      
      results.sources.push({
        name: source.name,
        fetchedAt: new Date().toISOString(),
        itemCount: items.length
      });
      
      results.items.push(...items);
    } catch (err) {
      console.error(`Failed to fetch ${source.name}:`, err.message);
      results.sources.push({
        name: source.name,
        error: err.message,
        fetchedAt: new Date().toISOString()
      });
    }
  }
  
  // Add some synthetic travel trends as fallback
  if (results.items.filter(i => i.category === 'Travel Trending').length === 0) {
    results.items.push(
      { title: 'Hawaii Resort Packages', source: 'Curated', category: 'Travel Trending', link: null },
      { title: 'European City Breaks', source: 'Curated', category: 'Travel Trending', link: null },
      { title: 'All-Inclusive Caribbean', source: 'Curated', category: 'Travel Trending', link: null }
    );
  }
  
  return results;
}

// Check if cache is still valid (< 6 hours old)
function isCacheValid(cachedData, maxAgeHours = 6) {
  if (!cachedData || !cachedData.generatedAt) return false;
  
  const generated = new Date(cachedData.generatedAt);
  const now = new Date();
  const ageHours = (now - generated) / (1000 * 60 * 60);
  
  return ageHours < maxAgeHours;
}

module.exports = { fetchTrends, isCacheValid };
