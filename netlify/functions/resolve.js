/**
 * Netlify Function: Resolve affiliate URLs and extract metadata
 * 
 * Purpose: Follow redirects to get final URL and extract useful metadata
 * without scraping or violating Amazon ToS.
 * 
 * Input: ?url=<encoded_url>
 * Output: { ok, finalUrl, hostname, asin, keywords, network }
 */

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Get URL from query params
  const url = event.queryStringParameters?.url;
  
  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        ok: false, 
        error: 'Missing url parameter' 
      })
    };
  }

  try {
    // Validate URL
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          ok: false, 
          error: 'Invalid URL format' 
        })
      };
    }

    // Follow redirects to get final URL
    const finalUrl = await resolveFinalUrl(url);
    const finalUrlObj = new URL(finalUrl);
    const hostname = finalUrlObj.hostname.replace('www.', '');
    
    // Detect network
    const network = detectNetwork(hostname);
    
    // Extract ASIN for Amazon links
    const asin = network === 'amazon' ? extractAsin(finalUrl) : null;
    
    // Extract keywords from URL path
    const keywords = extractKeywords(finalUrlObj.pathname);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        finalUrl,
        hostname,
        network,
        asin,
        keywords
      })
    };
    
  } catch (error) {
    console.error('Resolve error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: error.message || 'Failed to resolve URL'
      })
    };
  }
};

/**
 * Follow HTTP redirects to get final URL
 */
async function resolveFinalUrl(url, maxRedirects = 5) {
  let currentUrl = url;
  let redirectCount = 0;
  
  while (redirectCount < maxRedirects) {
    try {
      // Use HEAD request to avoid downloading content
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TradeTrendsBot/1.0)'
        }
      });
      
      // Check for redirect status codes
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          // Handle relative redirects
          currentUrl = new URL(location, currentUrl).href;
          redirectCount++;
          continue;
        }
      }
      
      // No more redirects
      return currentUrl;
      
    } catch (error) {
      // If HEAD fails, try GET
      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TradeTrendsBot/1.0)'
          }
        });
        return response.url; // Fetch automatically follows redirects with 'follow'
      } catch (getFallbackError) {
        // If both fail, return current URL
        return currentUrl;
      }
    }
  }
  
  return currentUrl;
}

/**
 * Detect network type from hostname
 */
function detectNetwork(hostname) {
  const lower = hostname.toLowerCase();
  
  if (lower.includes('amazon.')) return 'amazon';
  if (lower.includes('booking.') || 
      lower.includes('expedia.') || 
      lower.includes('hotels.') || 
      lower.includes('airbnb.')) return 'travel';
  
  return 'other';
}

/**
 * Extract Amazon ASIN from URL
 */
function extractAsin(url) {
  // Amazon ASIN patterns:
  // /dp/ASIN/
  // /gp/product/ASIN/
  // /ASIN/
  
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/([A-Z0-9]{10})(?:\/|\?|$)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const asin = match[1].toUpperCase();
      // Validate ASIN format (10 alphanumeric characters)
      if (/^[A-Z0-9]{10}$/.test(asin)) {
        return asin;
      }
    }
  }
  
  return null;
}

/**
 * Extract keywords from URL path
 */
function extractKeywords(pathname) {
  // Split path and filter out common URL parts
  const parts = pathname.toLowerCase()
    .split('/')
    .filter(part => part.length > 2)
    .filter(part => !['dp', 'gp', 'product', 'ref', 'tag'].includes(part));
  
  // Extract words from hyphenated slugs
  const words = parts
    .flatMap(part => part.split('-'))
    .filter(word => word.length > 2)
    .slice(0, 10); // Limit to 10 keywords
  
  return words;
}
