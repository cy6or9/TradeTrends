// ═══════════════════════════════════════════════════════════
// CMS-SAFE URL-FIRST AUTO-FILL SYSTEM FOR DECAP CMS
// ═══════════════════════════════════════════════════════════

console.log('🚀 Loading CMS customization...');

// Track fields that have been manually edited (never overwrite these)
const touchedFieldsMap = new Map();

// ─── UTILITY FUNCTIONS ───

function generateId(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

function generateIdFromAsin(asin) {
  return `amz-${asin.toLowerCase()}`;
}

function generateIdFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const hash = Math.random().toString(36).substring(2, 8);
    return `${hostname.split('.')[0]}-${hash}`;
  } catch {
    return 'deal-' + Math.random().toString(36).substring(2, 10);
  }
}

// ─── CATEGORY INFERENCE (CONSERVATIVE) ───

function inferCategory(keywords, network) {
  if (network === 'amazon') {
    const keywordStr = keywords.join(' ').toLowerCase();
    
    if (keywordStr.match(/electronic|power|charging|battery|usb|tech/)) return 'Electronics';
    if (keywordStr.match(/kitchen|cooking|cook|food|recipe/)) return 'Kitchen';
    if (keywordStr.match(/home|decor|furniture|living/)) return 'Home';
    if (keywordStr.match(/outdoor|camping|hiking|tent|backpack/)) return 'Outdoors';
    if (keywordStr.match(/beauty|skin|makeup|cosmetic/)) return 'Beauty';
    if (keywordStr.match(/toy|game|play/)) return 'Toys';
    if (keywordStr.match(/book|read/)) return 'Books';
    if (keywordStr.match(/cloth|fashion|apparel|wear/)) return 'Fashion';
    if (keywordStr.match(/pet|dog|cat/)) return 'Pets';
    if (keywordStr.match(/health|fitness|workout|exercise/)) return 'Health';
    
    return '';
  } else if (network === 'travel') {
    return 'Hotels';
  }
  
  return '';
}

// ─── RESOLVE URL VIA NETLIFY FUNCTION ───

async function resolveUrl(url) {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`/.netlify/functions/resolve?url=${encodedUrl}`);
    
    if (!response.ok) {
      throw new Error('Resolution failed');
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || 'Unknown error');
    }
    
    return data;
  } catch (error) {
    console.warn('URL resolution failed, using direct parsing:', error);
    return fallbackResolve(url);
  }
}

function fallbackResolve(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '').toLowerCase();
    
    let network = 'other';
    if (hostname.includes('amazon.')) network = 'amazon';
    else if (hostname.includes('booking.') || hostname.includes('expedia.') || 
             hostname.includes('hotels.') || hostname.includes('airbnb.')) network = 'travel';
    
    return {
      ok: true,
      finalUrl: url,
      hostname,
      network,
      asin: null,
      keywords: []
    };
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }
}

// ─── CMS-SAFE AUTO-FILL USING EVENT LISTENERS ───

async function processUrlAndSuggestValues(entry) {
  const affiliateUrl = entry.getIn(['data', 'affiliate_url']);
  
  if (!affiliateUrl) return entry;
  
  // Check if we've already processed this entry
  const entryId = entry.getIn(['slug']) || Math.random().toString(36).substring(2, 10);
  if (touchedFieldsMap.has(entryId)) {
    console.log('Entry already processed, skipping autofill');
    return entry;
  }
  
  console.log('🎯 Processing URL for autofill:', affiliateUrl);
  
  const resolved = await resolveUrl(affiliateUrl);
  
  if (!resolved.ok) {
    console.warn('Could not resolve URL:', resolved.error);
    return entry;
  }
  
  const { finalUrl, hostname, network, asin, keywords } = resolved;
  console.log('✓ Resolved:', { finalUrl, hostname, network, asin, keywords });
  
  // Build suggestions object (never overwrite existing values)
  let modified = entry;
  
  // Auto-fill ID if empty
  if (!modified.getIn(['data', 'id'])) {
    let newId = '';
    if (asin && network === 'amazon') {
      newId = generateIdFromAsin(asin);
    } else {
      newId = generateIdFromUrl(finalUrl);
    }
    if (newId) {
      modified = modified.setIn(['data', 'id'], newId);
      console.log('  ✓ Auto-filled ID:', newId);
    }
  }
  
  // Auto-fill network if empty
  if (!modified.getIn(['data', 'network'])) {
    modified = modified.setIn(['data', 'network'], network);
    console.log('  ✓ Auto-filled Network:', network);
  }
  
  // Suggest category if empty (medium confidence)
  if (!modified.getIn(['data', 'category'])) {
    const category = inferCategory(keywords, network);
    if (category) {
      modified = modified.setIn(['data', 'category'], category);
      console.log('  ✓ Suggested Category:', category);
    }
  }
  
  // Auto-fill brand for travel if empty
  if (network === 'travel' && !modified.getIn(['data', 'brand'])) {
    const brand = hostname.split('.')[0];
    const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
    modified = modified.setIn(['data', 'brand'], brandName);
    console.log('  ✓ Auto-filled Brand:', brandName);
  }
  
  // Mark this entry as processed
  touchedFieldsMap.set(entryId, true);
  
  return modified;
}

// ─── INITIALIZE DECAP CMS WITH EVENT LISTENERS ───

// Track if already initialized to prevent double-registration
let cmsCustomizationsInitialized = false;

function initCMSCustomizations() {
  if (!window.CMS) {
    console.error('❌ CMS not available');
    return;
  }
  
  // Prevent double initialization
  if (cmsCustomizationsInitialized) {
    console.warn('⚠️ CMS customizations already initialized, skipping');
    return;
  }
  
  console.log('🚀 Initializing CMS-safe autofill system...');
  
  // Listen for preSave events to process affiliate URLs
  CMS.registerEventListener({
    name: 'preSave',
    handler: async ({ entry }) => {
      return await processUrlAndSuggestValues(entry);
    }
  });
  
  cmsCustomizationsInitialized = true;
  console.log('✓ CMS autofill system ready (no DOM manipulation)');
}

// ─── NETLIFY IDENTITY INTEGRATION ───

function normalizeUserMetadata(user) {
  if (!user) return;
  
  // Ensure user_metadata exists
  if (!user.user_metadata) {
    user.user_metadata = {};
  }
  
  // Fix missing full_name (common with Google login)
  if (!user.user_metadata.full_name) {
    const fallbackName = user.email ? user.email.split('@')[0] : 'User';
    user.user_metadata.full_name = fallbackName;
    
    console.log('Normalized missing full_name:', fallbackName);
    
    // Try to persist the update (may fail silently if permissions don't allow)
    try {
      if (user.update && typeof user.update === 'function') {
        user.update({ user_metadata: user.user_metadata });
      }
    } catch (err) {
      console.warn('Could not persist user_metadata update:', err);
    }
  }
}

function checkAdminAccess(user) {
  if (!user) {
    console.error('❌ checkAdminAccess called without user');
    return;
  }
  
  const accessDenied = document.getElementById('accessDenied');
  
  // Get user roles from app_metadata (reliable source)
  const roles = user.app_metadata?.roles || [];
  const isAdmin = roles.includes('admin');
  
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  
  if (!isAdmin) {
    // Not an admin - show access denied overlay (don't touch #nc-root)
    if (accessDenied) {
      accessDenied.style.display = 'flex';
      accessDenied.style.zIndex = '99999';
    }
    console.log('❌ Access denied:', displayName, '(roles:', roles.join(', ') || 'none', ')');
  } else {
    // Admin - hide access denied overlay
    if (accessDenied) accessDenied.style.display = 'none';
    console.log('✓ Admin access:', displayName);
  }
}

function initNetlifyIdentity() {
  if (!window.netlifyIdentity) {
    console.warn('Netlify Identity widget not loaded');
    return;
  }

  window.netlifyIdentity.on("init", user => {
    if (!user) {
      // Not logged in - open login modal
      window.netlifyIdentity.open("login");
    } else {
      // User is logged in - normalize metadata and check role
      normalizeUserMetadata(user);
      checkAdminAccess(user);
    }
  });

  window.netlifyIdentity.on("login", user => {
    // After login, normalize metadata to prevent widget crashes
    normalizeUserMetadata(user);
    
    // Then check admin access
    checkAdminAccess(user);
    
    // Close the widget modal
    window.netlifyIdentity.close();
  });

  window.netlifyIdentity.init();
}

// ─── INITIALIZATION ───

// Wait for CMS to load, then initialize customizations
if (window.CMS) {
  initCMSCustomizations();
} else {
  // Wait for CMS script to load
  const checkCMS = setInterval(() => {
    if (window.CMS) {
      clearInterval(checkCMS);
      initCMSCustomizations();
    }
  }, 100);
  
  // Timeout after 10 seconds
  setTimeout(() => clearInterval(checkCMS), 10000);
}

// Initialize Netlify Identity
if (window.netlifyIdentity) {
  initNetlifyIdentity();
} else {
  // Wait for Identity widget to load
  const checkIdentity = setInterval(() => {
    if (window.netlifyIdentity) {
      clearInterval(checkIdentity);
      initNetlifyIdentity();
    }
  }, 100);
  
  // Timeout after 10 seconds
  setTimeout(() => clearInterval(checkIdentity), 10000);
}

console.log('✓ CMS customization loaded');
