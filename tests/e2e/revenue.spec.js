/**
 * TradeTrends Revenue Protection E2E Tests
 * 
 * These tests verify that affiliate links work correctly and redirect users
 * to the proper destinations. If ANY of these tests fail, it means we are
 * losing revenue - this is a CRITICAL failure.
 */

const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';
const PRODUCTION_URL = 'https://tradetrend.netlify.app';

test.describe('Revenue Protection - Affiliate Link Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Block external requests to speed up tests (we only care about redirects)
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg}', route => route.abort());
  });

  test('Amazon affiliate link redirects correctly', async ({ page, context }) => {
    await page.goto(BASE_URL);
    
    // Find first Amazon deal button
    const amazonButton = page.locator('a[href*="/go?network=amazon"]').first();
    await expect(amazonButton).toBeVisible({ timeout: 5000 });
    
    // Get the href before clicking
    const href = await amazonButton.getAttribute('href');
    console.log('Amazon button href:', href);
    
    // Verify URL structure
    expect(href).toContain('/go?network=amazon');
    expect(href).toContain('&id=');
    
    // Listen for new page (target="_blank")
    const pagePromise = context.waitForEvent('page');
    await amazonButton.click();
    const newPage = await pagePromise;
    
    // Wait for navigation to complete (following redirects)
    await newPage.waitForLoadState('networkidle', { timeout: 10000 });
    
    const finalUrl = newPage.url();
    console.log('Final destination:', finalUrl);
    
    // CRITICAL: Verify we ended up on Amazon
    const isAmazonDomain = finalUrl.includes('amazon.com') || 
                           finalUrl.includes('amazon.') || 
                           finalUrl.includes('amzn.to');
    
    expect(isAmazonDomain).toBe(true);
    
    await newPage.close();
  });

  test('Travel affiliate link redirects correctly', async ({ page, context }) => {
    await page.goto(BASE_URL);
    
    // Find first Travel deal button
    const travelButton = page.locator('a[href*="/go?network=travel"]').first();
    await expect(travelButton).toBeVisible({ timeout: 5000 });
    
    // Get the href before clicking
    const href = await travelButton.getAttribute('href');
    console.log('Travel button href:', href);
    
    // Verify URL structure
    expect(href).toContain('/go?network=travel');
    expect(href).toContain('&id=');
    
    // Listen for new page (target="_blank")
    const pagePromise = context.waitForEvent('page');
    await travelButton.click();
    const newPage = await pagePromise;
    
    // Wait for navigation to complete (following redirects)
    await newPage.waitForLoadState('networkidle', { timeout: 10000 });
    
    const finalUrl = newPage.url();
    console.log('Final destination:', finalUrl);
    
    // CRITICAL: Verify we ended up on travel partner site
    const isTravelDomain = finalUrl.includes('booking.com') || 
                           finalUrl.includes('travelpayouts.com') ||
                           finalUrl.includes('viator.com') ||
                           finalUrl.includes('expedia.com');
    
    expect(isTravelDomain).toBe(true);
    
    await newPage.close();
  });

  test('/go function returns 302 redirect (not 200)', async ({ request }) => {
    // Direct API test - verify /go function returns redirect, not content
    const response = await request.get(`${BASE_URL}/go?network=amazon&id=test`, {
      maxRedirects: 0 // Don't follow redirects
    });
    
    // CRITICAL: Must be a redirect (302 or 307), not 200
    expect([302, 307]).toContain(response.status());
    
    // Should have Location header
    const location = response.headers()['location'];
    expect(location).toBeTruthy();
    console.log('Redirect location:', location);
  });

  test('Homepage has affiliate links (not broken)', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // CRITICAL: Verify we have working affiliate links
    const amazonLinks = page.locator('a[href*="/go?network=amazon"]');
    const travelLinks = page.locator('a[href*="/go?network=travel"]');
    
    const amazonCount = await amazonLinks.count();
    const travelCount = await travelLinks.count();
    
    console.log(`Found ${amazonCount} Amazon links, ${travelCount} Travel links`);
    
    // At least one deal should exist
    expect(amazonCount + travelCount).toBeGreaterThan(0);
  });

  test('Affiliate links do NOT use /?network= pattern (old bug)', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // CRITICAL: Old bug check - ensure we're not using broken /?network= pattern
    const brokenLinks = page.locator('a[href*="/?network="]');
    const brokenCount = await brokenLinks.count();
    
    expect(brokenCount).toBe(0);
  });

  test('Analytics records clicks correctly', async ({ page, request }) => {
    // CRITICAL: Verify analytics system records clicks
    
    // Get baseline analytics
    const beforeResponse = await request.get(`${BASE_URL}/api/analytics`);
    expect(beforeResponse.ok()).toBeTruthy();
    const beforeData = await beforeResponse.json();
    
    console.log('Analytics before click:', beforeData);
    
    // Ensure we have a valid baseline
    expect(beforeData).toHaveProperty('initialized');
    expect(beforeData).toHaveProperty('totalClicks');
    expect(beforeData).toHaveProperty('byNetwork');
    
    const baselineClicks = beforeData.totalClicks || 0;
    
    // Click an affiliate link
    await page.goto(BASE_URL);
    const amazonButton = page.locator('a[href*="/go?network=amazon"]').first();
    await expect(amazonButton).toBeVisible({ timeout: 5000 });
    
    // Get the href for later verification
    const href = await amazonButton.getAttribute('href');
    expect(href).toContain('/go?network=amazon');
    
    // Click the link (will open new tab, but we don't follow it)
    const pagePromise = page.context().waitForEvent('page');
    await amazonButton.click();
    const newPage = await pagePromise;
    await newPage.close(); // Close immediately, we just need the click
    
    // Wait for analytics to process (async write)
    await page.waitForTimeout(2000);
    
    // Check analytics again
    const afterResponse = await request.get(`${BASE_URL}/api/analytics`);
    expect(afterResponse.ok()).toBeTruthy();
    const afterData = await afterResponse.json();
    
    console.log('Analytics after click:', afterData);
    
    // CRITICAL: Verify click was recorded
    expect(afterData.totalClicks).toBeGreaterThanOrEqual(baselineClicks + 1);
    expect(afterData.byNetwork).toHaveProperty('amazon');
    expect(afterData.byNetwork.amazon).toBeGreaterThanOrEqual(1);
    
    console.log(`✅ Click recorded: ${baselineClicks} → ${afterData.totalClicks}`);
  });

});

test.describe('Production Deployment Verification', () => {
  
  test.skip(({ page }, testInfo) => {
    // Only run in CI or when explicitly testing production
    return !process.env.CI && !process.env.TEST_PRODUCTION;
  });

  test('Production /go function is live and working', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/go?network=amazon&id=test`, {
      maxRedirects: 0
    });
    
    // CRITICAL: Production redirect must work
    expect([302, 307]).toContain(response.status());
    
    const location = response.headers()['location'];
    expect(location).toBeTruthy();
    expect(location).toContain('amazon');
    
    console.log('✅ Production /go is working:', location);
  });

});
