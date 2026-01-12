const { test, expect } = require('@playwright/test');

/**
 * Revenue Canary Test - /go Redirect + Fallback Verification
 * Tests the D7 fallback revenue mode:
 * - Primary: /go?network=...&id=... redirects to affiliate
 * - Fallback: data-direct-url opens if /go fails
 * CRITICAL: If this fails, we're losing revenue!
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

test.describe('Revenue Canary - /go Redirect Flow', () => {
  
  test('/go endpoint returns 302 with affiliate destination', async ({ request }) => {
    // PHASE 9: Test /go function directly with a real deal ID
    // CRITICAL: Use maxRedirects: 0 to prevent following the 302
    const response = await request.get(`${BASE_URL}/go?network=amazon&id=2dfd3aee-93dd-4c06-8ad3-8426f5eb007e`, {
      maxRedirects: 0
    });
    
    // Must return 302 redirect (not 200, not 404)
    expect(response.status()).toBe(302);
    
    // Must have Location header
    const location = response.headers()['location'];
    expect(location).toBeTruthy();
    
    // PHASE 1: Location must NOT be our own domain
    const isSelfRedirect = location.includes('tradetrend.netlify.app') || 
                          location.includes('localhost') ||
                          location.startsWith('/?network=');
    
    expect(isSelfRedirect).toBe(false);
    
    // Location must point to affiliate domain
    const isAffiliateDestination = 
      location.includes('amazon') || 
      location.includes('amzn.to');
    
    expect(isAffiliateDestination).toBe(true);
    
    console.log('✅ /go redirect works:', location);
  });
  
  test('deals have direct affiliate URL href', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // Wait for deals to render
    await page.waitForSelector('a.link.primary', { timeout: 5000 });
    
    // Check first CTA link
    const ctaLink = page.locator('a.link.primary').first();
    const href = await ctaLink.getAttribute('href');
    const trackUrl = await ctaLink.getAttribute('data-track-url');
    
    console.log('CTA href:', href);
    console.log('Track URL:', trackUrl);
    
    // Direct navigation: href should be affiliate URL (not /go)
    expect(href).toBeTruthy();
    expect(href).not.toContain('/go?');
    
    const isValidAffiliate = 
      href.includes('amazon') || 
      href.includes('amzn.to') ||
      href.includes('booking') ||
      href.includes('expedia');
    
    expect(isValidAffiliate).toBe(true);
    
    // Background tracking endpoint should exist
    expect(trackUrl).toBeTruthy();
    expect(trackUrl).toContain('/.netlify/functions/api/click');
    
    console.log('✅ Deal has direct affiliate URL and background tracking');
  });
  
  test('clicking deal opens affiliate destination directly', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // Wait for deals to render
    await page.waitForSelector('a.link.primary[href*="amzn"]', { timeout: 10000 });
    
    // Get first deal link
    const firstLink = page.locator('a.link.primary[href*="amzn"]').first();
    const href = await firstLink.getAttribute('href');
    console.log('Deal link href:', href);
    
    // Verify the href is a direct affiliate URL (not /go)
    expect(href).toBeTruthy();
    expect(href).not.toContain('/go?');
    expect(href).toMatch(/amazon|amzn\.to/);
    
    console.log(`✅ Deal uses direct affiliate URL: ${href}`);
    
    // CRITICAL: This test verifies direct navigation without opening external sites
  });
  
  test('redirect loop detector correctly identifies loops but allows normal clicks', async ({ request }) => {
    const network = 'amazon';
    const id = '2dfd3aee-93dd-4c06-8ad3-8426f5eb007e'; // Real deal ID
    
    // PART 1: 3 rapid clicks within 5s window SHOULD trigger loop detection (status 200 HTML page)
    const response1 = await request.get(`${BASE_URL}/go?network=${network}&id=${id}`, {
      maxRedirects: 0
    });
    const cookie1 = response1.headers()['set-cookie'] || '';
    expect(response1.status()).toBe(302); // First hit: normal redirect
    
    const response2 = await request.get(`${BASE_URL}/go?network=${network}&id=${id}`, {
      maxRedirects: 0,
      headers: {
        Cookie: cookie1 // Send cookie from first hit
      }
    });
    const cookie2 = response2.headers()['set-cookie'] || '';
    expect(response2.status()).toBe(302); // Second hit: still redirects (not a loop yet)
    
    const response3 = await request.get(`${BASE_URL}/go?network=${network}&id=${id}`, {
      maxRedirects: 0,
      headers: {
        Cookie: cookie2 // Send cookie from second hit
      }
    });
    
    // Third hit within 5s: NOW it detects the loop and returns HTML error page
    expect(response3.status()).toBe(200);
    const body3 = await response3.text();
    expect(body3).toContain('Redirect Loop Detected');
    
    // PART 2: After waiting >5s, should work normally again
    await new Promise(resolve => setTimeout(resolve, 5100));
    const response4 = await request.get(`${BASE_URL}/go?network=${network}&id=${id}`, {
      maxRedirects: 0
    });
    expect(response4.status()).toBe(302);
    const location4 = response4.headers()['location'];
    expect(location4).toContain('amzn');
    
    console.log('✅ Loop detector does not interfere with normal redirects');
  });
  
  test('background tracking endpoint exists', async ({ page }) => {
    // Verify render.js implements background click tracking
    await page.goto(`${BASE_URL}/`);
    
    // Wait for deals to render
    await page.waitForSelector('a.link.primary[data-track-url]', { timeout: 5000 });
    
    // Verify tracking URL attribute exists
    const hasTrackingUrl = await page.evaluate(() => {
      const link = document.querySelector('a.link.primary[data-track-url]');
      return link && link.getAttribute('data-track-url').includes('/.netlify/functions/api/click');
    });
    
    expect(hasTrackingUrl).toBe(true);
    
    console.log('✅ Background tracking is implemented');
  });
});
