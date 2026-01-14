#!/usr/bin/env node

/**
 * Share Functionality Test Script
 * Tests that share buttons and menus are working correctly across the site
 */

const fs = require('fs');
const path = require('path');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

console.log('🧪 Testing Share Functionality...\n');

// Test 1: Check render.js has share button HTML
function testRenderJsShareHTML() {
  const renderPath = path.join(__dirname, '../public/js/render.js');
  
  if (!fs.existsSync(renderPath)) {
    results.failed.push('render.js not found');
    return;
  }
  
  const content = fs.readFileSync(renderPath, 'utf8');
  
  // Check for share button
  if (!content.includes('share-btn')) {
    results.failed.push('render.js: Missing share-btn class');
    return;
  }
  
  // Check for share menu
  if (!content.includes('share-menu')) {
    results.failed.push('render.js: Missing share-menu HTML');
    return;
  }
  
  // Check for share platforms
  const requiredPlatforms = [
    'facebook', 'twitter', 'messenger', 'pinterest', 
    'whatsapp', 'linkedin', 'reddit', 'telegram', 
    'email', 'sms'
  ];
  
  const missingPlatforms = requiredPlatforms.filter(platform => 
    !content.includes(`data-platform="${platform}"`) && 
    !content.includes(`data-platform='${platform}'`)
  );
  
  if (missingPlatforms.length > 0) {
    results.failed.push(`render.js: Missing platforms: ${missingPlatforms.join(', ')}`);
    return;
  }
  
  // Check for copy-link separately (it's a button, not anchor)
  if (!content.includes('copy-link') || !content.includes('data-copy-url')) {
    results.failed.push('render.js: Missing copy-link functionality');
    return;
  }
  
  // Check for share URLs
  const requiredShareVars = [
    'facebookShare', 'twitterShare', 'messengerShare', 
    'pinterestShare', 'whatsappShare', 'linkedinShare',
    'redditShare', 'telegramShare', 'emailShare', 'smsShare'
  ];
  
  const missingVars = requiredShareVars.filter(v => !content.includes(v));
  
  if (missingVars.length > 0) {
    results.failed.push(`render.js: Missing share URL variables: ${missingVars.join(', ')}`);
    return;
  }
  
  results.passed.push('render.js: Share button HTML complete');
}

// Test 2: Check render.js has initShareButtons function
function testShareButtonInit() {
  const renderPath = path.join(__dirname, '../public/js/render.js');
  const content = fs.readFileSync(renderPath, 'utf8');
  
  if (!content.includes('function initShareButtons()')) {
    results.failed.push('render.js: Missing initShareButtons function');
    return;
  }
  
  if (!content.includes('initShareButtons()')) {
    results.failed.push('render.js: initShareButtons not being called');
    return;
  }
  
  // Check for event handlers
  if (!content.includes('.share-btn') && !content.includes('.closest(\'.share-btn\')')) {
    results.failed.push('render.js: Missing share button click handler');
    return;
  }
  
  if (!content.includes('.share-close')) {
    results.failed.push('render.js: Missing share close button handler');
    return;
  }
  
  if (!content.includes('.copy-link')) {
    results.failed.push('render.js: Missing copy link handler');
    return;
  }
  
  results.passed.push('render.js: Share button initialization complete');
}

// Test 3: Check styles.css has share menu styling
function testShareMenuCSS() {
  const cssPath = path.join(__dirname, '../public/css/styles.css');
  
  if (!fs.existsSync(cssPath)) {
    results.failed.push('styles.css not found');
    return;
  }
  
  const content = fs.readFileSync(cssPath, 'utf8');
  
  if (!content.includes('.share-menu')) {
    results.failed.push('styles.css: Missing .share-menu class');
    return;
  }
  
  if (!content.includes('.share-menu-header')) {
    results.failed.push('styles.css: Missing .share-menu-header class');
    return;
  }
  
  if (!content.includes('.share-option')) {
    results.failed.push('styles.css: Missing .share-option class');
    return;
  }
  
  if (!content.includes('.share-btn')) {
    results.failed.push('styles.css: Missing .share-btn class');
    return;
  }
  
  // Check for platform-specific hover states
  const platforms = ['facebook', 'twitter', 'messenger', 'pinterest', 'whatsapp', 'linkedin', 'reddit', 'telegram', 'email', 'sms'];
  const missingHovers = platforms.filter(p => 
    !content.includes(`.share-option.${p}:hover`)
  );
  
  if (missingHovers.length > 0) {
    results.warnings.push(`styles.css: Missing hover states for: ${missingHovers.join(', ')}`);
  }
  
  // Check for z-index on share-menu (must be high for visibility)
  if (!content.match(/\.share-menu\s*{[^}]*z-index:\s*\d+/)) {
    results.warnings.push('styles.css: .share-menu might be missing z-index');
  }
  
  // Check for overflow visible on containers
  const itemBodyMatch = content.match(/\.itemBody\s*{[^}]*}/);
  if (itemBodyMatch && !itemBodyMatch[0].includes('overflow: visible')) {
    results.warnings.push('styles.css: .itemBody should have overflow: visible for dropdown');
  }
  
  results.passed.push('styles.css: Share menu styling present');
}

// Test 4: Check HTML pages load render.js
function testHTMLIncludesRender() {
  const htmlFiles = [
    '../public/index.html',
    '../public/activities.html', 
    '../public/products.html',
    '../public/amazon.html'
  ];
  
  for (const file of htmlFiles) {
    const fullPath = path.join(__dirname, file);
    
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (!content.includes('/js/render.js') && !content.includes('render.js')) {
      results.warnings.push(`${path.basename(file)}: Doesn't include render.js`);
    }
  }
  
  results.passed.push('HTML files: render.js inclusion checked');
}

// Test 5: Validate share URL formats
function testShareURLFormats() {
  const renderPath = path.join(__dirname, '../public/js/render.js');
  const content = fs.readFileSync(renderPath, 'utf8');
  
  const urlTests = [
    { name: 'Facebook', pattern: /facebook\.com\/sharer/ },
    { name: 'Twitter', pattern: /twitter\.com\/intent\/tweet/ },
    { name: 'LinkedIn', pattern: /linkedin\.com\/sharing/ },
    { name: 'Reddit', pattern: /reddit\.com\/submit/ },
    { name: 'Pinterest', pattern: /pinterest\.com\/pin\/create/ },
    { name: 'WhatsApp', pattern: /wa\.me/ },
    { name: 'Telegram', pattern: /t\.me\/share/ },
    { name: 'Messenger', pattern: /fb-messenger:\/\/share/ }
  ];
  
  for (const test of urlTests) {
    if (!test.pattern.test(content)) {
      results.failed.push(`Share URL: Invalid/missing ${test.name} URL format`);
    }
  }
  
  results.passed.push('Share URLs: All platform URLs validated');
}

// Test 6: Check for common issues
function testCommonIssues() {
  const renderPath = path.join(__dirname, '../public/js/render.js');
  const content = fs.readFileSync(renderPath, 'utf8');
  
  // Check for display:none in HTML (should be in style attribute)
  const shareMenuMatches = content.match(/id="share-menu-[^"]+"/g);
  if (shareMenuMatches) {
    const hasDisplayNone = content.includes('style="display:none;"') || 
                           content.includes("style='display:none;'") ||
                           content.includes('style=\"display:none\"');
    if (!hasDisplayNone) {
      results.warnings.push('render.js: Share menus might not have display:none by default');
    }
  }
  
  // Check for event.preventDefault() in share button handler
  if (!content.includes('preventDefault')) {
    results.warnings.push('render.js: Missing preventDefault() in share button handler');
  }
  
  // Check for stopPropagation to prevent card click
  if (!content.includes('stopPropagation')) {
    results.warnings.push('render.js: Missing stopPropagation() - may trigger card click');
  }
  
  results.passed.push('Common issues: Checked for typical problems');
}

// Run all tests
try {
  testRenderJsShareHTML();
  testShareButtonInit();
  testShareMenuCSS();
  testHTMLIncludesRender();
  testShareURLFormats();
  testCommonIssues();
} catch (error) {
  results.failed.push(`Test execution error: ${error.message}`);
}

// Print results
console.log('✅ PASSED TESTS:');
results.passed.forEach(msg => console.log(`   ✓ ${msg}`));

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  results.warnings.forEach(msg => console.log(`   ⚠ ${msg}`));
}

if (results.failed.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.failed.forEach(msg => console.log(`   ✗ ${msg}`));
  console.log('\n❌ Share functionality tests FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ All share functionality tests PASSED\n');
  process.exit(0);
}
