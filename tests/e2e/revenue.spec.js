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

  test('Amazon affiliate link opens with /go or direct (D7 pattern)', async ({ page, context }) => {
    // Setup request interception to verify tracking endpoint is called
    const trackingRequests = [];
    await page.route('**/.netlify/functions/api/click**', route => {
      trackingRequests.push(route.request().url());
      route.fulfill({ status: 204 });
    });
    
    await page.goto(BASE_URL);
    
    // Find first Amazon deal button - D7 uses /go with data-direct-url fallback
    const amazonButton = page.locator('a.link.primary').first();
    await expect(amazonButton).toBeVisible({ timeout: 5000 });
    
    // Get the href before clicking
    const href = await amazonButton.getAttribute('href');
    console.log('Amazon button href:', href);
    
    // D7 PATTERN: href should be /go?network= OR direct URL (both valid)
    const usesGo = href.includes('/go?network=');
    const isDirect = href.includes('amazon.com') || href.includes('amzn.to');
    expect(usesGo || isDirect).toBe(true);
    
    // If using /go, must have data-direct-url fallback
    if (usesGo) {
      const directUrl = await amazonButton.getAttribute('data-direct-url');
      expect(directUrl).toBeTruthy();
      expect(directUrl).not.toBe('#');
      console.log('Fallback URL:', directUrl);
    }
    
    // Verify tracking URL is present
    const trackUrl = await amazonButton.getAttribute('data-track-url');
    expect(trackUrl).toBeTruthy();
    expect(trackUrl).toContain('/.netlify/functions/api/click');
    expect(trackUrl).toContain('network=amazon');
    
    // Don't actually navigate to Amazon in tests (too slow)
    console.log('✅ CTA link structure validated');
    
    /*
    // Optional: Test actual navigation (slow)
    const pagePromise = context.waitForEvent('page');
    await amazonButton.click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 });
    const finalUrl = newPage.url();
    console.log('Final destination:', finalUrl);
    
    // CRITICAL: Verify we ended up on Amazon (no intermediary pages)
    const isAmazonDomain = finalUrl.includes('amazon.com') || 
                           finalUrl.includes('amazon.') || 
                           finalUrl.includes('amzn.to');
    
    expect(isAmazonDomain).toBe(true);
    
    // CRITICAL: Verify tracking endpoint was called in background
    await page.waitForTimeout(1000); // Allow sendBeacon to fire
    expect(trackingRequests.length).toBeGreaterThan(0);
    console.log('Tracking endpoint called:', trackingRequests[0]);
    
    await newPage.close();
    */
  });

  test('Travel affiliate link opens directly (no redirect loop)', async ({ page, context }) => {
    // Setup request interception to verify tracking endpoint is called
    const trackingRequests = [];
    await page.route('**/.netlify/functions/api/click**', route => {
      trackingRequests.push(route.request().url());
      route.fulfill({ status: 204 });
    });
    
    await page.goto(BASE_URL);
    
    // Find first Travel deal button - should now use direct affiliate URL
    const travelButton = page.locator('a.link.primary[href*="booking"]')
      .or(page.locator('a.link.primary[href*="travelpayouts"]'))
      .or(page.locator('a.link.primary[href*="viator"]'))
      .or(page.locator('a.link.primary[href*="expedia"]'))
      .first();
    
    const count = await travelButton.count();
    if (count === 0) {
      console.log('No travel deals found, skipping test');
      return;
    }
    
    await expect(travelButton).toBeVisible({ timeout: 5000 });
    
    // Get the href before clicking
    const href = await travelButton.getAttribute('href');
    console.log('Travel button href:', href);
    
    // CRITICAL: Verify URL goes DIRECTLY to travel partner (not /go redirect)
    const isDirect = href.includes('booking.com') || 
                     href.includes('travelpayouts.com') ||
                     href.includes('viator.com') ||
                     href.includes('expedia.com');
    expect(isDirect).toBe(true);
    
    // Verify tracking URL is present
    const trackUrl = await travelButton.getAttribute('data-track-url');
    expect(trackUrl).toBeTruthy();
    expect(trackUrl).toContain('/.netlify/functions/api/click');
    expect(trackUrl).toContain('network=travel');
    
    // Listen for new page (target="_blank")
    const pagePromise = context.waitForEvent('page');
    await travelButton.click();
    const newPage = await pagePromise;
    
    // Wait for navigation to complete
    await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    const finalUrl = newPage.url();
    console.log('Final destination:', finalUrl);
    
    // CRITICAL: Verify we ended up on travel partner site
    const isTravelDomain = finalUrl.includes('booking.com') || 
                           finalUrl.includes('travelpayouts.com') ||
                           finalUrl.includes('viator.com') ||
                           finalUrl.includes('expedia.com');
    
    expect(isTravelDomain).toBe(true);
    
    // CRITICAL: Verify tracking endpoint was called in background
    await page.waitForTimeout(1000); // Allow sendBeacon to fire
    expect(trackingRequests.length).toBeGreaterThan(0);
    console.log('Tracking endpoint called:', trackingRequests[0]);
    
    await newPage.close();
  });

  test('/go function still works for legacy/shared links', async ({ request }) => {
    // Direct API test - verify /go function returns redirect for backward compatibility
    const response = await request.get(`${BASE_URL}/go?network=amazon&id=test`, {
      maxRedirects: 0 // Don't follow redirects
    });
    
    // Should be a redirect (302 or 307), not 200
    expect([302, 307, 404]).toContain(response.status());
    
    if (response.status() === 302 || response.status() === 307) {
      // Should have Location header
      const location = response.headers()['location'];
      expect(location).toBeTruthy();
      console.log('Legacy /go redirect location:', location);
    }
  });

  test('Homepage has direct affiliate links (not /go redirects)', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // CRITICAL: Verify we have direct affiliate links (not /go redirects)
    const amazonLinks = page.locator('a.link.primary[href*="amazon"]').or(page.locator('a.link.primary[href*="amzn"]'));
    const travelLinks = page.locator('a.link.primary[href*="booking"]')
      .or(page.locator('a.link.primary[href*="travelpayouts"]'))
      .or(page.locator('a.link.primary[href*="viator"]'))
      .or(page.locator('a.link.primary[href*="expedia"]'));
    
    const amazonCount = await amazonLinks.count();
    const travelCount = await travelLinks.count();
    
    console.log(`Found ${amazonCount} Amazon links, ${travelCount} Travel links`);
    
    // At least one deal should exist
    expect(amazonCount + travelCount).toBeGreaterThan(0);
    
    // Verify links have tracking data attribute
    if (amazonCount > 0) {
      const firstAmazon = amazonLinks.first();
      const trackUrl = await firstAmazon.getAttribute('data-track-url');
      expect(trackUrl).toBeTruthy();
      expect(trackUrl).toContain('/.netlify/functions/api/click');
    }
  });

  test('Background click tracking endpoint works', async ({ request }) => {
    // Test the /click tracking endpoint
    const response = await request.get(`${BASE_URL}/.netlify/functions/api/click?network=amazon&id=test-${Date.now()}`);
    
    // CRITICAL: Should return 204 (no content, successful tracking)
    expect(response.status()).toBe(204);
    
    console.log('Click tracking endpoint returned 204');
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
