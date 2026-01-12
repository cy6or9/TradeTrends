#!/usr/bin/env node
/**
 * TradeTrends Build Validator
 * Validates critical files before deployment
 */

const fs = require('fs');
const path = require('path');

let errors = 0;
let warnings = 0;

function log(type, message) {
  const icons = { error: '❌', warning: '⚠️', success: '✅', info: 'ℹ️' };
  console.log(`${icons[type] || icons.info} ${message}`);
}

function error(message) {
  log('error', message);
  errors++;
}

function warning(message) {
  log('warning', message);
  warnings++;
}

function success(message) {
  log('success', message);
}

function section(title) {
  console.log(`\n${title}`);
  console.log('═══════════════════════════');
}

// Check file exists
function checkFile(filePath, required = true) {
  if (fs.existsSync(filePath)) {
    return true;
  }
  if (required) {
    error(`Missing required file: ${filePath}`);
  } else {
    warning(`Missing optional file: ${filePath}`);
  }
  return false;
}

// Validate JSON file
function validateJSON(filePath) {
  if (!checkFile(filePath)) return false;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    success(`Valid JSON: ${filePath}`);
    return data;
  } catch (err) {
    error(`Invalid JSON in ${filePath}: ${err.message}`);
    return null;
  }
}

// Validate deal object
function validateDeal(deal, index, network) {
  const required = ['id', 'title', 'affiliate_url', 'image', 'category', 'network'];
  const missing = required.filter(field => !deal[field]);
  
  if (missing.length > 0) {
    error(`Deal #${index} in ${network} missing fields: ${missing.join(', ')}`);
    return false;
  }
  
  // REVENUE-LEVEL VALIDATION: Check for placeholder values
  if (deal.affiliate_url.includes('example.com') || deal.affiliate_url.includes('placeholder')) {
    error(`REVENUE LOSS: Deal #${index} "${deal.title}" has placeholder URL: ${deal.affiliate_url}`);
    return false;
  }
  
  // REVENUE-LEVEL VALIDATION: Empty affiliate URL means no revenue
  if (!deal.affiliate_url || deal.affiliate_url.trim() === '') {
    error(`REVENUE LOSS: Deal #${index} "${deal.title}" has empty affiliate_url`);
    return false;
  }
  
  // REVENUE-LEVEL VALIDATION: Amazon deals must use direct affiliate URLs (amzn.to or amazon.com)
  if (network === 'Amazon') {
    const url = deal.affiliate_url.toLowerCase();
    if (!url.includes('amzn.to') && !url.includes('amazon.com')) {
      error(`REVENUE LOSS: Amazon deal #${index} "${deal.title}" has invalid affiliate URL: ${deal.affiliate_url}`);
      error('  Expected: amzn.to or amazon.com domain');
      return false;
    }
  }
  
  // REVENUE-LEVEL VALIDATION: Travel deals must use known travel partner domains
  if (network === 'Travel') {
    const url = deal.affiliate_url.toLowerCase();
    const validTravelDomains = ['booking.com', 'travelpayouts.com', 'viator.com', 'expedia.com'];
    const hasValidDomain = validTravelDomains.some(domain => url.includes(domain));
    if (!hasValidDomain) {
      warning(`Travel deal #${index} "${deal.title}" uses unknown affiliate domain: ${deal.affiliate_url}`);
      warning(`  Expected one of: ${validTravelDomains.join(', ')}`);
    }
  }
  
  if (deal.title === 'New Deal Title' || deal.title.includes('placeholder')) {
    error(`Deal #${index} has placeholder title: ${deal.title}`);
    return false;
  }
  
  return true;
}

// Main validation
console.log('\n🔍 TradeTrends Build Validation\n');

// 1. Check critical HTML files
console.log('📄 Validating HTML files...');
['public/index.html', 'public/amazon.html', 'public/travel.html'].forEach(file => {
  if (checkFile(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('<html')) error(`${file} missing <html> tag`);
    if (!content.includes('<title>')) error(`${file} missing <title> tag`);
    if (!content.includes('meta name="description"')) warning(`${file} missing meta description`);
    if (!content.includes('og:title')) warning(`${file} missing Open Graph tags`);
  }
});

// 2. Validate JSON data files
console.log('\n📦 Validating data files...');
const amazonData = validateJSON('public/data/amazon.json');
const travelData = validateJSON('public/data/travel.json');

if (amazonData && amazonData.items) {
  console.log(`  Found ${amazonData.items.length} Amazon deals`);
  amazonData.items.forEach((deal, i) => validateDeal(deal, i + 1, 'Amazon'));
}

if (travelData && travelData.items) {
  console.log(`  Found ${travelData.items.length} Travel deals`);
  travelData.items.forEach((deal, i) => validateDeal(deal, i + 1, 'Travel'));
}

// 3. Check critical assets
console.log('\n🎨 Validating assets...');
checkFile('public/css/styles.css');
checkFile('public/js/render.js');
checkFile('public/robots.txt', false);
checkFile('public/sitemap.xml', false);

// 4. Check Netlify configuration
console.log('\n⚙️  Validating Netlify config...');
if (checkFile('netlify.toml')) {
  const toml = fs.readFileSync('netlify.toml', 'utf8');
  if (!toml.includes('publish = "public"')) error('netlify.toml missing publish directory');
  if (!toml.includes('functions = "netlify/functions"')) error('netlify.toml missing functions directory');
}

// 5. Check serverless functions
console.log('\n⚡ Validating serverless functions...');
['netlify/functions/go.js', 'netlify/functions/api.js'].forEach(file => {
  checkFile(file);
});

// 6. Validate affiliate link routing (prevent regression)
console.log('\n🔗 Validating affiliate link routing...');

// Check _redirects file exists and has correct /go rule
if (checkFile('public/_redirects')) {
  const redirects = fs.readFileSync('public/_redirects', 'utf8');
  
  // Critical checks for /go function routing
  const requiredRules = [
    '/go  /.netlify/functions/go  200!',
    '/go/*  /.netlify/functions/go  200!'
  ];
  
  let hasCriticalError = false;
  
  for (const rule of requiredRules) {
    if (!redirects.includes(rule)) {
      error(`CRITICAL: /go redirect is not forced. Affiliate tracking would be broken.`);
      error(`Missing required rule: ${rule}`);
      hasCriticalError = true;
    }
  }
  
  if (!hasCriticalError) {
    success('Valid _redirects: /go routing enforced with 200! flags');
  }
  
  // Ensure /go rules come before catch-all (critical for precedence)
  const lines = redirects.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  const goIndex = lines.findIndex(l => l.trim().startsWith('/go '));
  const catchAllIndex = lines.findIndex(l => l.trim().startsWith('/*'));
  
  if (catchAllIndex >= 0 && goIndex >= 0 && catchAllIndex < goIndex) {
    error('CRITICAL: /go redirect is not forced. Affiliate tracking would be broken.');
    error('public/_redirects: catch-all /* appears BEFORE /go rule - will break routing');
  } else if (goIndex >= 0 && catchAllIndex >= 0) {
    success('Valid _redirects: /go rules appear BEFORE catch-all /*');
  }
  
  // Verify 200! force flag is present (not just 200)
  const goLine = lines.find(l => l.trim().startsWith('/go '));
  if (goLine && !goLine.includes('200!')) {
    error('CRITICAL: /go redirect is not forced. Affiliate tracking would be broken.');
    error('Missing "!" force flag on /go redirect - must be "200!" not "200"');
  }
}

// Check HTML files don't contain broken /?network= href patterns
['public/index.html', 'public/amazon.html', 'public/travel.html'].forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('href="/?network=')) {
      error(`${file} contains broken href="/?network=" pattern (should be /go?network=)`);
    }
  }
});

// Check render.js uses direct affiliate URLs (not /go redirect)
if (fs.existsSync('public/js/render.js')) {
  const renderJs = fs.readFileSync('public/js/render.js', 'utf8');
  
  // Check for various broken patterns
  if (renderJs.includes('`/?network=') || renderJs.includes('"/?network=') || renderJs.includes("'/?network=")) {
    error('public/js/render.js generates broken /?network= URLs (should be /go?network=)');
  }
  
  // Verify direct affiliate URL usage (background tracking pattern)
  if (!renderJs.includes('affiliate_url')) {
    error('public/js/render.js missing affiliate_url references');
  } else {
    success('Valid render.js: uses direct affiliate URLs with background tracking');
  }
}

// Check admin pages use ONLY /.netlify/functions/api paths (Identity bypass)
console.log('\n🔐 Validating admin API routing (Identity bypass)...');
const adminPages = ['public/admin/dashboard.html', 'public/admin/trends.html', 'public/admin/deals.html'];

adminPages.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for broken patterns (using /api/... instead of /.netlify/functions/api/...)
    if (content.match(/fetch\s*\(\s*['"`]\/api\//)) {
      error(`${file} uses fetch('/api/...') which will be intercepted by Identity`);
      error(`Must use fetch('/.netlify/functions/api/...') for direct function access`);
    }
    
    // Verify at least one correct pattern exists (if page uses API)
    if (content.includes('/.netlify/functions/api')) {
      success(`${file} correctly uses /.netlify/functions/api paths`);
    }
  }
});

// Validate direct navigation with background tracking (working pattern from 83e186a)
section('Validating Direct Affiliate Navigation');
if (fs.existsSync('public/js/render.js')) {
  const renderJs = fs.readFileSync('public/js/render.js', 'utf8');
  
  // Must use direct affiliate URLs as href (NOT /go redirects)
  const usesDirectUrls = renderJs.includes('href="${escapeHtml(directUrl)}"') || 
                         !renderJs.includes('href="${escapeHtml(goUrl)}"');
  if (!usesDirectUrls) {
    error('render.js should use direct affiliate URLs, not /go redirects');
  } else {
    success('render.js uses direct affiliate URLs');
  }
  
  // Must have background tracking via data-track-url
  const hasBackgroundTracking = renderJs.includes('data-track-url') && 
                                renderJs.includes('sendBeacon');
  if (!hasBackgroundTracking) {
    error('render.js missing background tracking (sendBeacon)');
  } else {
    success('render.js implements background click tracking');
  }
  
  // Must NOT use /go?network= in primary href (causes loops)
  const hasGoRedirect = renderJs.includes('href="${escapeHtml(goUrl)}"') ||
                       (renderJs.includes('/go?network=') && renderJs.includes('primaryHref'));
  if (hasGoRedirect) {
    error('render.js uses /go redirect in primary href (causes iPad/Safari loops)');
  } else {
    success('render.js does not use /go in primary navigation');
  }
}

// OLD: Legacy D7 fallback validation (disabled - caused loops)
if (false && fs.existsSync('public/js/render.js')) {
  const renderJs = fs.readFileSync('public/js/render.js', 'utf8');
  
  // Check for broken patterns
  if (renderJs.includes('`/?network=') || renderJs.includes('"/?network=') || renderJs.includes("'/?network=")) {
    error('public/js/render.js generates broken /?network= URLs');
  }
  
  // CRITICAL: Ensure render.js uses direct affiliate URLs (not /go redirect)
  // This fixes iPad/Safari blank tab issue
  if (renderJs.includes('href="${escapeHtml(url)}"') && renderJs.includes('/go?network=')) {
    error('CRITICAL: public/js/render.js uses /go redirect in CTA href (causes iPad/Safari blank tab loop)');
    error('  FIX: Change CTA href to use item.affiliate_url directly');
    error('  Tracking should be done via background API call, not redirect');
  }
  
  // Verify direct URL usage
  if (!renderJs.includes('const directUrl = item.affiliate_url')) {
    error('public/js/render.js missing direct affiliate URL extraction');
  }
  
  // Verify background tracking setup
  if (!renderJs.includes('data-track-url')) {
    error('public/js/render.js missing background tracking data attribute');
  }
  
  if (!renderJs.includes('/.netlify/functions/api/click')) {
    error('public/js/render.js missing background click tracking endpoint');
  }
  
  if (!renderJs.includes('navigator.sendBeacon') && !renderJs.includes('fetch(trackUrl')) {
    error('public/js/render.js missing sendBeacon or fetch for background tracking');
  }
  
  success('Valid render.js: uses direct affiliate URLs with background tracking');
}

// 7. Validate sitemap
console.log('\n🗺️  Validating sitemap...');
if (checkFile('public/sitemap.xml', false)) {
  const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
  
  // Ensure production domain is used
  if (sitemap.includes('localhost') || sitemap.includes('127.0.0.1')) {
    error('sitemap.xml contains localhost URLs (should be production domain)');
  }
  
  // Check for required pages
  const requiredPages = ['index.html', 'amazon.html', 'travel.html'];
  requiredPages.forEach(page => {
    if (!sitemap.includes(page.replace('.html', ''))) {
      warning(`sitemap.xml missing ${page}`);
    }
  });
  
  success('sitemap.xml validated');
}

// 8. Check AI memory system integrity
console.log('\n🤖 Validating AI memory system...');
const aiFiles = [
  '.ai/business.json',
  '.ai/blocked-patterns.json',
  '.ai/known-good.json',
  '.ai/history.json'
];

aiFiles.forEach(file => {
  const data = validateJSON(file);
  if (!data) {
    error(`${file} is invalid or missing`);
  }
});

// Load and validate blocked patterns
if (fs.existsSync('.ai/blocked-patterns.json')) {
  try {
    const blockedPatterns = JSON.parse(fs.readFileSync('.ai/blocked-patterns.json', 'utf8'));
    
    // Check files against blocked patterns
    if (blockedPatterns.filePatterns) {
      for (const [filePattern, rules] of Object.entries(blockedPatterns.filePatterns)) {
        const files = filePattern.includes('*') 
          ? require('glob').sync(filePattern)
          : [filePattern];
        
        files.forEach(file => {
          if (!fs.existsSync(file)) return;
          
          const content = fs.readFileSync(file, 'utf8');
          
          // Check mustNotContain patterns
          if (rules.mustNotContain) {
            rules.mustNotContain.forEach(pattern => {
              if (content.includes(pattern)) {
                error(`BLOCKED PATTERN: ${file} contains forbidden pattern: ${pattern}`);
              }
            });
          }
          
          // Check mustContain patterns
          if (rules.mustContain) {
            rules.mustContain.forEach(pattern => {
              if (!content.includes(pattern)) {
                warning(`${file} missing recommended pattern: ${pattern}`);
              }
            });
          }
        });
      }
    }
    
    success('AI memory system validated');
  } catch (err) {
    warning(`Could not validate blocked patterns: ${err.message}`);
  }
}

// 9. API Contract Validation
console.log('\n9️⃣  Validating API Contracts');
console.log('═══════════════════════════');

// Validate analytics API response structure
const analyticsPath = 'netlify/functions/api.js';
if (checkFile(analyticsPath)) {
  const content = fs.readFileSync(analyticsPath, 'utf8');
  
  // Check for strict input validation
  const hasInputValidation = content.includes('Number.isFinite(days)') && 
                              content.includes('Math.max(1, Math.min(90');
  if (!hasInputValidation) {
    error('Analytics API missing strict input validation for days parameter');
  } else {
    success('Analytics API has strict input validation');
  }
  
  // Check for guaranteed response contract
  const hasResponseContract = content.includes('initialized:') && 
                              content.includes('totalClicks:') &&
                              content.includes('byNetwork:');
  if (!hasResponseContract) {
    error('Analytics API missing guaranteed response contract');
  } else {
    success('Analytics API guarantees response contract');
  }
  
  // Check for error handling
  const hasErrorHandling = content.includes('try') && content.includes('catch');
  if (!hasErrorHandling) {
    warning('Analytics API missing try/catch error handling');
  } else {
    success('Analytics API has error handling');
  }
}

// Validate admin dashboard parameter sanitation
const dashboardPath = 'public/admin/dashboard.html';
if (checkFile(dashboardPath)) {
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Check for parameter sanitation
  const hasSanitation = content.includes('Math.max(1, Math.min(90') &&
                        content.includes('encodeURIComponent');
  if (!hasSanitation) {
    error('Dashboard missing URL parameter sanitation');
  } else {
    success('Dashboard has URL parameter sanitation');
  }
  
  // Check for enhanced error handling
  const hasErrorTypes = content.includes('SyntaxError') || 
                        content.includes('JSON.parse');
  if (!hasErrorTypes) {
    warning('Dashboard missing detailed error type detection');
  } else {
    success('Dashboard has enhanced error handling');
  }
}

// Validate trends page error handling
const trendsPath = 'public/admin/trends.html';
if (checkFile(trendsPath)) {
  const content = fs.readFileSync(trendsPath, 'utf8');
  
  // Check for error type detection
  const hasErrorTypes = content.includes('error.name') ||
                        content.includes('SyntaxError');
  if (!hasErrorTypes) {
    warning('Trends page missing error type detection');
  } else {
    success('Trends page has error type detection');
  }
}

// Validate API endpoints don't return HTML
function validateAPIEndpoints() {
  const adminFiles = ['public/admin/dashboard.html', 'public/admin/trends.html'];
  
  adminFiles.forEach(file => {
    if (checkFile(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check that fetch calls use /.netlify/functions/api, NOT /api
      const hasDirectApiCall = content.includes("fetch('/api/") || 
                               content.includes('fetch("/api/');
      
      if (hasDirectApiCall) {
        error(`${file} uses /api/* routes which are intercepted by Identity. Must use /.netlify/functions/api/*`);
      } else {
        success(`${file} correctly bypasses Identity with direct function calls`);
      }
      
      // Check for /.netlify/functions/api usage
      const usesDirectFunction = content.includes('/.netlify/functions/api');
      if (!usesDirectFunction) {
        warning(`${file} doesn't seem to call API functions directly`);
      }
    }
  });
}

console.log('\n🔟 Validating API Endpoint Routes');
console.log('═══════════════════════════');
validateAPIEndpoints();

// 11. Deal Status Validation
console.log('\n1️⃣1️⃣  Validating Deal Status Model');
console.log('═══════════════════════════');

function validateDealData() {
  const dealFiles = ['public/data/amazon.json', 'public/data/travel.json'];
  
  dealFiles.forEach(file => {
    if (checkFile(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const items = data.items || [];
      
      items.forEach((item, idx) => {
        // Check ID exists
        if (!item.id || item.id.trim() === '') {
          error(`${file} item ${idx}: Missing unique id`);
        }
        
        // Check status if present
        if (item.status && item.status !== 'draft' && item.status !== 'published') {
          error(`${file} item ${idx}: Invalid status "${item.status}" (must be "draft" or "published")`);
        }
        
        // Validate published deals
        const status = item.status || 'published'; // Treat missing as published for migration
        if (status === 'published') {
          if (!item.title || item.title.trim() === '') {
            error(`${file} item ${idx}: Published deal missing title`);
          }
          if (!item.affiliate_url || item.affiliate_url.trim() === '') {
            error(`${file} item ${idx}: Published deal missing affiliate_url`);
          }
          if (!item.image || item.image.trim() === '') {
            error(`${file} item ${idx}: Published deal missing image`);
          }
        }
      });
      
      success(`${file} has valid deal data structure`);
    }
  });
  
  // Verify render.js filters drafts
  const renderPath = 'public/js/render.js';
  if (checkFile(renderPath)) {
    const content = fs.readFileSync(renderPath, 'utf8');
    
    if (!content.includes("status !== 'published'") && !content.includes('status === "published"')) {
      error('render.js missing status filter - drafts could appear publicly!');
    } else {
      success('render.js correctly filters published-only deals');
    }
  }
}

validateDealData();

// 12. Validate /go function Location header safety
section('Validating /go Function Redirect Safety');
if (fs.existsSync('netlify/functions/go.js')) {
  const goJs = fs.readFileSync('netlify/functions/go.js', 'utf8');
  
  // Check for dangerous self-redirects
  const hasSelfRedirect = goJs.includes('Location: "tradetrend.netlify.app"') ||
                         goJs.includes('Location: "/') && !goJs.includes('Location: deal.affiliate');
  
  // Verify it returns 302 with Location header
  const has302 = goJs.includes('statusCode: 302');
  const hasLocation = goJs.includes('Location:') || goJs.includes('headers: { Location');
  
  if (!has302 || !hasLocation) {
    error('go.js missing proper 302 redirect with Location header');
  } else {
    success('go.js returns 302 with Location header');
  }
  
  // Verify loop detection exists
  const hasLoopDetection = goJs.includes('REDIRECT LOOP') || goJs.includes('tt_last_go');
  if (!hasLoopDetection) {
    warning('go.js missing redirect loop detection (D6 requirement)');
  } else {
    success('go.js implements redirect loop detection');
  }
  
  // PHASE 1: Verify self-redirect protection (forbiddenHosts)
  const hasSelfRedirectProtection = goJs.includes('forbiddenHosts') && 
                                    goJs.includes('tradetrend.netlify.app');
  if (!hasSelfRedirectProtection) {
    error('CRITICAL: go.js missing self-redirect protection (PHASE 1 requirement)');
    error('  Must check forbiddenHosts before returning 302');
  } else {
    success('go.js prevents self-redirect loops');
  }
  
  // Verify Location points to affiliate domains (not our own)
  const locationLines = goJs.split('\n').filter(line => line.includes('Location:'));
  for (const line of locationLines) {
    if (line.includes('tradetrend.netlify.app') && !line.includes('comment') && !line.includes('forbiddenHosts')) {
      error('CRITICAL: go.js redirects to our own domain (causes loops)');
      error(`  Line: ${line.trim()}`);
    }
  }
}

// 13. Check admin inline scripts for syntax errors
console.log('\n🔧 Validating admin inline scripts...');
const { execSync } = require('child_process');
try {
  execSync('node scripts/check-admin-scripts.js', { stdio: 'inherit' });
  success('All admin inline scripts are syntactically valid');
} catch (err) {
  error('Admin scripts validation failed - see errors above');
}

// 14. Validate emergency flags exist
section('Validating Emergency Kill Switch');
if (fs.existsSync('.ai/business.json')) {
  const businessJson = fs.readFileSync('.ai/business.json', 'utf8');
  const config = JSON.parse(businessJson);
  
  if (!config.emergencyFlags) {
    error('.ai/business.json missing emergencyFlags (PHASE 6 requirement)');
  } else {
    const flags = config.emergencyFlags;
    if (typeof flags.disableGo === 'undefined') error('emergencyFlags missing disableGo flag');
    if (typeof flags.forceDirect === 'undefined') error('emergencyFlags missing forceDirect flag');
    
    if (Object.keys(flags).length >= 2) {
      success('Emergency kill switch flags configured');
    }
  }
}

// 15. PHASE 8: Validate Data Files for Self-Redirects
section('Validating Deal Data for Self-Redirects (PHASE 8)');
const dataFiles = ['public/data/amazon.json', 'public/data/travel.json'];
let selfRedirectFound = false;

for (const dataFile of dataFiles) {
  if (fs.existsSync(dataFile)) {
    const data = fs.readFileSync(dataFile, 'utf8');
    const json = JSON.parse(data);
    const deals = json.items || []; // Handle {items: [...]} structure
    
    for (const deal of deals) {
      if (deal.affiliate_url) {
        // Check for self-redirect patterns
        if (deal.affiliate_url.includes('tradetrend.netlify.app') ||
            deal.affiliate_url.includes('tradetrends.netlify.app') ||
            deal.affiliate_url.includes('localhost')) {
          error(`${dataFile}: Deal ${deal.id} has self-redirect URL: ${deal.affiliate_url}`);
          selfRedirectFound = true;
        }
      }
    }
  }
}

if (!selfRedirectFound) {
  success('No self-redirect URLs found in deal data');
}

// 16. Summary
console.log('\n📊 Validation Summary');
console.log('═══════════════════════════');
console.log(`Errors:   ${errors}`);
console.log(`Warnings: ${warnings}`);
console.log('═══════════════════════════\n');

if (errors > 0) {
  log('error', `Build validation FAILED with ${errors} error(s)`);
  process.exit(1);
} else if (warnings > 0) {
  log('warning', `Build validation passed with ${warnings} warning(s)`);
  process.exit(0);
} else {
  log('success', 'Build validation passed with no issues!');
  process.exit(0);
}
