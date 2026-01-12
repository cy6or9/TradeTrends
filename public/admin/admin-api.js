/**
 * Admin API Helper
 * Provides safe fetch wrapper that detects HTML-instead-of-JSON errors
 * Prevents "Unexpected token <" crashes in admin pages
 */

/**
 * Fetch JSON with content-type validation
 * @param {string} url - API endpoint URL
 * @param {object} opts - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} Clear error if HTML/text returned instead of JSON
 */
async function fetchJson(url, opts = {}) {
  // Force no-store to bypass caching issues
  const options = {
    ...opts,
    cache: 'no-store',
    headers: {
      ...opts.headers,
      'Accept': 'application/json'
    }
  };
  
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error(`Network error: ${err.message}`);
  }
  
  const contentType = response.headers.get('content-type') || '';
  const status = response.status;
  
  // Read response text (limited to avoid memory issues)
  let responseText;
  try {
    const fullText = await response.text();
    responseText = fullText.substring(0, 500); // Limit preview
  } catch (err) {
    throw new Error(`Failed to read response: ${err.message}`);
  }
  
  // Check if we got HTML instead of JSON (common with Identity redirects)
  if (!contentType.includes('application/json') && responseText.trim().startsWith('<')) {
    const preview = responseText.substring(0, 120).replace(/\n/g, ' ').trim();
    throw new Error(
      `Expected JSON but got HTML/text (Status: ${status}, Content-Type: ${contentType}). ` +
      `This likely means Netlify Identity intercepted the request. ` +
      `Preview: ${preview}...`
    );
  }
  
  // Try to parse JSON
  try {
    // Handle empty responses
    if (!responseText.trim()) {
      if (!response.ok) {
        throw new Error(`HTTP ${status}: ${response.statusText} (empty response)`);
      }
      return {};
    }
    
    const data = JSON.parse(responseText);
    
    // Check for error responses
    if (!response.ok) {
      throw new Error(
        data.error || data.message || `HTTP ${status}: ${response.statusText}`
      );
    }
    
    return data;
  } catch (err) {
    // If it's already our error, rethrow
    if (err.message.includes('Expected JSON but got')) {
      throw err;
    }
    
    // JSON parse error
    const preview = responseText.substring(0, 120).replace(/\n/g, ' ').trim();
    throw new Error(
      `Invalid JSON response (Status: ${status}). ` +
      `Parse error: ${err.message}. ` +
      `Preview: ${preview}...`
    );
  }
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Export for use in admin pages
window.AdminAPI = { fetchJson, escapeHtml };
