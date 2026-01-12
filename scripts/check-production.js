#!/usr/bin/env node
/**
 * TradeTrends Production Revenue Monitor
 * 
 * This script verifies that the production /go function is working correctly.
 * Run this after every deployment to ensure affiliate links are not broken.
 * 
 * CRITICAL: If this fails, we are losing revenue.
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://tradetrend.netlify.app';
const TEST_NETWORKS = ['amazon', 'travel'];

let failures = 0;

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function error(message) {
  log('❌', message);
  failures++;
}

function success(message) {
  log('✅', message);
}

/**
 * Make HTTP request without following redirects
 */
function checkRedirect(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { 
      headers: {
        'User-Agent': 'TradeTrends-Monitor/1.0'
      }
    }, (res) => {
      resolve({
        status: res.statusCode,
        location: res.headers.location,
        headers: res.headers
      });
    }).on('error', reject);
  });
}

/**
 * Follow redirect chain to final destination
 */
async function followRedirects(url, maxRedirects = 5) {
  let currentUrl = url;
  let redirectCount = 0;
  
  while (redirectCount < maxRedirects) {
    const response = await checkRedirect(currentUrl);
    
    if (response.status >= 300 && response.status < 400 && response.location) {
      redirectCount++;
      currentUrl = response.location;
    } else {
      return { finalUrl: currentUrl, status: response.status };
    }
  }
  
  throw new Error('Too many redirects');
}

/**
 * Verify /go function for a specific network
 */
async function testNetwork(network) {
  const testUrl = `${PRODUCTION_URL}/go?network=${network}&id=test-${Date.now()}`;
  
  log('🔍', `Testing ${network} network...`);
  console.log(`   URL: ${testUrl}`);
  
  try {
    // Step 1: Check initial redirect
    const response = await checkRedirect(testUrl);
    
    if (response.status !== 302 && response.status !== 307) {
      error(`${network}: Expected 302/307 redirect, got ${response.status}`);
      return false;
    }
    
    if (!response.location) {
      error(`${network}: No Location header in redirect response`);
      return false;
    }
    
    success(`${network}: Returns ${response.status} redirect`);
    console.log(`   Location: ${response.location}`);
    
    // Step 2: Follow redirects to final destination
    const { finalUrl } = await followRedirects(testUrl);
    
    // Step 3: Verify final destination is correct partner
    let isValidDestination = false;
    
    if (network === 'amazon') {
      isValidDestination = finalUrl.includes('amazon.com') || 
                          finalUrl.includes('amazon.') || 
                          finalUrl.includes('amzn.to');
    } else if (network === 'travel') {
      isValidDestination = finalUrl.includes('booking.com') || 
                          finalUrl.includes('travelpayouts.com') ||
                          finalUrl.includes('viator.com') ||
                          finalUrl.includes('expedia.com');
    }
    
    if (!isValidDestination) {
      error(`${network}: Final destination does not match expected partner`);
      console.log(`   Final URL: ${finalUrl}`);
      return false;
    }
    
    success(`${network}: Final destination is valid affiliate partner`);
    console.log(`   Final URL: ${finalUrl.substring(0, 80)}...`);
    
    return true;
    
  } catch (err) {
    error(`${network}: Request failed - ${err.message}`);
    return false;
  }
}

/**
 * Verify homepage is accessible
 */
async function testHomepage() {
  log('🔍', 'Testing homepage...');
  
  try {
    const response = await checkRedirect(PRODUCTION_URL);
    
    if (response.status !== 200) {
      error(`Homepage returned ${response.status}, expected 200`);
      return false;
    }
    
    success('Homepage is accessible');
    return true;
    
  } catch (err) {
    error(`Homepage request failed - ${err.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🚨 TradeTrends Production Revenue Monitor');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Target: ${PRODUCTION_URL}\n`);
  
  // Test homepage
  await testHomepage();
  console.log('');
  
  // Test each network
  for (const network of TEST_NETWORKS) {
    await testNetwork(network);
    console.log('');
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 Results');
  console.log('═══════════════════════════════════════════════════');
  
  if (failures > 0) {
    console.log(`❌ ${failures} CRITICAL FAILURE(S) DETECTED`);
    console.log('');
    console.log('⚠️  REVENUE IS AT RISK - AFFILIATE LINKS ARE BROKEN');
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ All checks passed - Revenue flow is healthy');
    console.log('');
    process.exit(0);
  }
}

// Run
main().catch(err => {
  console.error('');
  console.error('❌ Fatal error:', err.message);
  console.error('');
  process.exit(1);
});
