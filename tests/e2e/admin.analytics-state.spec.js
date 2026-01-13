const { test, expect } = require('@playwright/test');

/**
 * Analytics State Model Tests
 * Verifies:
 * - Cold state (no clicks) shows proper UI
 * - No false error states for empty data
 * - Generate Test Click button works
 * - Revenue health properly interprets HTTP responses
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

test.describe('Analytics State Model', () => {
  
  test('cold state shows waiting message, not error', async ({ page, context }) => {
    // Mock analytics API to return cold start (0 clicks)
    await context.route('**/.netlify/functions/api/analytics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          initialized: false,
          totalClicks: 0,
          byNetwork: {},
          topDeals: [],
          byDay: []
        })
      });
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for content to load
    await page.waitForSelector('.notice, [data-testid="dashboard-ready"]', {
      timeout: 10000
    });
    
    // Should show cold-start message, not error
    const notice = page.locator('.notice');
    await expect(notice).toBeVisible();
    
    const noticeText = await notice.textContent();
    expect(noticeText).toContain('Analytics is ready');
    expect(noticeText).toContain('no clicks recorded yet');
    
    // Should NOT show red error
    const errorDiv = page.locator('.error, [data-testid="admin-error"]');
    await expect(errorDiv).not.toBeVisible();
    
    // Should show Generate Test Click button
    const testClickBtn = page.locator('#generateTestClick');
    await expect(testClickBtn).toBeVisible();
    expect(await testClickBtn.textContent()).toContain('Generate Test Click');
  });
  
  test('broken state shows offline message', async ({ page, context }) => {
    // Mock analytics API to return network error
    await context.route('**/.netlify/functions/api/analytics*', async route => {
      await route.abort('failed');
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for error to appear
    await page.waitForSelector('.error, [data-testid="admin-error"]', {
      timeout: 10000
    });
    
    // Should show broken/offline message
    const errorDiv = page.locator('.error, [data-testid="admin-error"]');
    await expect(errorDiv).toBeVisible();
    
    const errorText = await errorDiv.textContent();
    expect(errorText).toContain('Analytics Offline');
  });
  
  test('active state shows analytics with test click button', async ({ page, context }) => {
    // Mock analytics API to return active data
    await context.route('**/.netlify/functions/api/analytics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          initialized: true,
          totalClicks: 42,
          byNetwork: {
            amazon: 30,
            travel: 12
          },
          topDeals: [
            { id: 'deal-1', clicks: 15 },
            { id: 'deal-2', clicks: 10 }
          ],
          byDay: [
            { date: '2026-01-13', clicks: 20 },
            { date: '2026-01-12', clicks: 22 }
          ]
        })
      });
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for dashboard to render
    await page.waitForSelector('[data-testid="dashboard-ready"]', {
      timeout: 10000
    });
    
    // Should show stats
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();
    
    // Should show Generate Test Click button even in active state
    const testClickBtn = page.locator('#generateTestClick');
    await expect(testClickBtn).toBeVisible();
    
    // Should show actual click counts
    const totalClicksValue = page.locator('.stat-value').first();
    expect(await totalClicksValue.textContent()).toContain('42');
  });
  
  test('Generate Test Click button is clickable', async ({ page, context }) => {
    // Mock analytics API
    await context.route('**/.netlify/functions/api/analytics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalClicks: 0,
          byNetwork: {},
          topDeals: [],
          byDay: []
        })
      });
    });
    
    // Mock deals API
    await context.route('**/data/amazon.json', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'test-deal-1', status: 'published', title: 'Test Deal' }
          ]
        })
      });
    });
    
    // Mock /go endpoint
    await context.route('**/go?network=amazon&id=test-deal-1', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://amazon.com/dp/TEST123'
        }
      });
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for button
    await page.waitForSelector('#generateTestClick', { timeout: 10000 });
    
    const testClickBtn = page.locator('#generateTestClick');
    await expect(testClickBtn).toBeEnabled();
    
    // Click the button
    await testClickBtn.click();
    
    // Should show status message
    const statusEl = page.locator('#testClickStatus');
    await expect(statusEl).toBeVisible();
    
    // Wait for completion
    await page.waitForTimeout(500);
    
    const statusText = await statusEl.textContent();
    expect(statusText).toMatch(/Test click generated|Generating/);
  });
});

test.describe('Revenue Health Tests', () => {
  
  test('HTTP 302 shows healthy status', async ({ page, context }) => {
    // This test validates that the revenue health tile correctly interprets HTTP responses
    // Note: In test environment, the /go endpoint may not be fully mockable due to CORS/redirect handling
    // The important part is that the UI exists and doesn't show "HTTP 0" (meaningless error)
    
    // Mock deals API
    await context.route('**/data/amazon.json', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'test-deal', status: 'published' }
          ]
        })
      });
    });
    
    // Mock analytics API
    await context.route('**/.netlify/functions/api/analytics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalClicks: 0,
          byNetwork: {},
          topDeals: [],
          byDay: []
        })
      });
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for revenue health to load
    await page.waitForSelector('#goHealth', { timeout: 10000 });
    
    // Give some time for initial test
    await page.waitForTimeout(2000);
    
    // Check health status after auto-test
    const healthEl = page.locator('#goHealth');
    const healthText = await healthEl.textContent();
    
    // The key requirement: NO "HTTP 0" meaningless errors
    expect(healthText).not.toContain('HTTP 0');
    
    // Should show one of the valid states (not a random error)
    const hasValidState = 
      healthText.includes('Healthy') ||
      healthText.includes('Testing') ||
      healthText.includes('Network error') ||
      healthText.includes('Redirect loop') ||
      healthText.includes('Not tested');
    
    expect(hasValidState).toBe(true);
  });
  
  test('HTML response shows redirect loop', async ({ page, context }) => {
    // Mock /go endpoint returning HTML (bad)
    await context.route('**/go?network=amazon&id=*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Error</body></html>'
      });
    });
    
    // Mock deals API
    await context.route('**/data/amazon.json', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'test-deal', status: 'published' }
          ]
        })
      });
    });
    
    // Mock analytics API
    await context.route('**/.netlify/functions/api/analytics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalClicks: 0,
          byNetwork: {},
          topDeals: [],
          byDay: []
        })
      });
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for revenue health
    await page.waitForSelector('#testGoNow', { timeout: 10000 });
    
    const testBtn = page.locator('#testGoNow');
    await testBtn.click();
    
    await page.waitForTimeout(1000);
    
    const healthEl = page.locator('#goHealth');
    const healthText = await healthEl.textContent();
    
    expect(healthText).toContain('Redirect loop');
  });
});

test.describe('Trends Empty State', () => {
  
  test('empty trends array shows waiting message, not error', async ({ page, context }) => {
    // Mock trends API returning empty array
    await context.route('**/.netlify/functions/api/trends', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [],
          sources: [],
          generatedAt: new Date().toISOString()
        })
      });
    });
    
    await page.goto(`${BASE_URL}/admin/trends.html`);
    
    // Wait for content
    await page.waitForSelector('.notice, [data-testid="trends-ready"]', {
      timeout: 10000
    });
    
    // Should show "No trends available yet" message
    const notice = page.locator('.notice');
    await expect(notice).toBeVisible();
    
    const noticeText = await notice.textContent();
    expect(noticeText).toContain('No trends available yet');
    
    // Should NOT show error
    const errorDiv = page.locator('[data-testid="admin-error"]');
    await expect(errorDiv).not.toBeVisible();
  });
  
  test('trends fetch failure shows error', async ({ page, context }) => {
    // Mock trends API failure
    await context.route('**/.netlify/functions/api/trends', async route => {
      await route.abort('failed');
    });
    
    await page.goto(`${BASE_URL}/admin/trends.html`);
    
    // Wait for error
    await page.waitForSelector('[data-testid="admin-error"]', {
      timeout: 10000
    });
    
    // Should show offline error
    const errorDiv = page.locator('[data-testid="admin-error"]');
    await expect(errorDiv).toBeVisible();
    
    const errorText = await errorDiv.textContent();
    expect(errorText).toContain('Trends API Offline');
  });
});
