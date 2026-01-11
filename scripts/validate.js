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
  
  // Check for placeholder values
  if (deal.affiliate_url.includes('example.com') || deal.affiliate_url.includes('placeholder')) {
    error(`Deal #${index} "${deal.title}" has placeholder URL: ${deal.affiliate_url}`);
    return false;
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
  if (!redirects.includes('/go  /.netlify/functions/go  200!')) {
    error('public/_redirects missing required /go redirect with force flag (200!)');
  } else {
    success('Valid _redirects: /go routing enforced');
  }
  
  // Ensure /go rules come before catch-all
  const lines = redirects.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  const goIndex = lines.findIndex(l => l.includes('/go '));
  const catchAllIndex = lines.findIndex(l => l.trim().startsWith('/*'));
  if (catchAllIndex >= 0 && goIndex >= 0 && catchAllIndex < goIndex) {
    error('public/_redirects: catch-all /* appears BEFORE /go rule - will break routing');
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

// Check render.js doesn't generate broken links
if (fs.existsSync('public/js/render.js')) {
  const renderJs = fs.readFileSync('public/js/render.js', 'utf8');
  if (renderJs.includes('`/?network=') || renderJs.includes('"/?network=') || renderJs.includes("'/?network=")) {
    error('public/js/render.js generates broken /?network= URLs (should be /go?network=)');
  }
  if (!renderJs.includes('/go?network=')) {
    error('public/js/render.js missing expected /go?network= URL generation');
  } else {
    success('Valid render.js: generates /go?network= URLs');
  }
}

// 7. Summary
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
