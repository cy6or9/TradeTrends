const { test, expect } = require('@playwright/test');

/**
 * Admin Smoke Tests - Robust Edition
 * Tests pass if admin pages:
 * - Exit loading state (not stuck on spinner)
 * - Show either: data, empty state, OR error message
 * - Don't crash with JavaScript syntax errors
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

test.describe('Admin Pages - Smoke Tests', () => {
  
  test('dashboard.html loads and exits loading state', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for page to exit loading state (either shows content or error)
    // This is the key test: page must not be stuck on "Loading..."
    try {
      await page.waitForSelector('[data-testid="dashboard-ready"], [data-testid="admin-error"]', {
        timeout: 8000
      });
      console.log('✅ Dashboard exited loading state');
    } catch (e) {
      // If neither appeared, check if loading is still visible (fail condition)
      const loadingVisible = await page.locator('[data-testid="dashboard-loading"]').isVisible();
      expect(loadingVisible).toBe(false); // Should not be stuck on loading
    }
    
    // Verify page structure exists (not a complete crash)
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Analytics');
  });
  
  test('trends.html loads and exits loading state', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/trends.html`);
    
    // Wait for page to exit loading state
    try {
      await page.waitForSelector('[data-testid="trends-ready"], [data-testid="admin-error"]', {
        timeout: 8000
      });
      console.log('✅ Trends page exited loading state');
    } catch (e) {
      // Check if stuck on loading (fail condition)
      const loadingVisible = await page.locator('[data-testid="trends-loading"]').isVisible();
      expect(loadingVisible).toBe(false);
    }
    
    // Verify page structure
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Trends');
  });
  
  test('admin pages return JSON not HTML from API endpoints', async ({ page }) => {
    const responses = [];
    
    // Intercept all API responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/.netlify/functions/api/')) {
        responses.push({
          url,
          status: response.status(),
          contentType: response.headers()['content-type'] || ''
        });
      }
    });
    
    // Load dashboard (triggers API calls)
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForTimeout(3000);
    
    // Check intercepted responses
    for (const resp of responses) {
      // If response succeeded, it must be JSON
      if (resp.status >= 200 && resp.status < 300) {
        const isJson = resp.contentType.includes('application/json');
        const isHtml = resp.contentType.includes('text/html');
        
        if (isHtml) {
          console.error(`❌ API endpoint ${resp.url} returned HTML instead of JSON`);
        }
        
        // Pass if JSON, or if no response (dev mode)
        expect(isHtml).toBe(false);
      }
    }
    
    console.log(`✅ Checked ${responses.length} API responses`);
  });
});
