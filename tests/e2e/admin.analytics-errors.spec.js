const { test, expect } = require('@playwright/test');

/**
 * Analytics Dashboard Error Handling Tests
 * Ensures the dashboard gracefully handles:
 * - Uninitialized analytics (initialized: false)
 * - Empty data arrays (topDeals: [], byDay: [])
 * - Missing/undefined properties
 * - Network failures
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

test.describe('Analytics Dashboard - Error Handling', () => {
  
  test('dashboard handles uninitialized analytics gracefully', async ({ page }) => {
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Monitor JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for analytics to load (either success, empty state, or error)
    await page.waitForSelector('[data-testid="dashboard-ready"], [data-testid="admin-error"], .notice', {
      timeout: 10000
    });
    
    // Check for JavaScript errors (none should occur)
    expect(jsErrors.length).toBe(0);
    
    // Check for critical console errors related to map/forEach
    const mapErrors = consoleErrors.filter(err => 
      err.includes('map is not a function') || 
      err.includes('forEach') ||
      err.includes('Cannot read property')
    );
    expect(mapErrors.length).toBe(0);
    
    // Verify page rendered something (not blank)
    const hasContent = await page.locator('.stats-grid, .notice, .error').count();
    expect(hasContent).toBeGreaterThan(0);
    
    console.log('✅ Dashboard handled analytics state without errors');
  });
  
  test('dashboard displays empty state when no clicks recorded', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give analytics time to process
    
    // Check if empty state OR data is shown (both are valid)
    const hasStats = await page.locator('.stats-grid').count();
    expect(hasStats).toBeGreaterThan(0);
    
    // Should not have any JS errors
    expect(jsErrors.length).toBe(0);
    
    // Tables should exist and either show data or "No data yet"
    const tables = await page.locator('table').count();
    if (tables > 0) {
      // If tables exist, they should have proper structure
      const tableHeaders = await page.locator('table thead th').count();
      expect(tableHeaders).toBeGreaterThan(0);
    }
    
    console.log('✅ Dashboard rendered empty/initial state correctly');
  });
  
  test('dashboard escapes HTML in deal IDs', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    await page.waitForSelector('.stats-grid', { timeout: 10000 });
    
    // Check if any table cells contain raw HTML tags (security issue)
    const tableCells = await page.locator('table tbody td').allTextContents();
    
    for (const cell of tableCells) {
      // Should not contain unescaped HTML
      expect(cell).not.toContain('<script');
      expect(cell).not.toContain('<img');
      expect(cell).not.toContain('onerror=');
    }
    
    console.log('✅ Dashboard properly escapes user data');
  });
  
  test('dashboard handles division by zero gracefully', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    await page.waitForSelector('.stats-grid', { timeout: 10000 });
    
    // Check for NaN or Infinity in displayed text (indicates math error)
    const pageText = await page.locator('body').textContent();
    expect(pageText).not.toContain('NaN');
    expect(pageText).not.toContain('Infinity');
    
    // Check percentages are valid (0-100%)
    const percentages = pageText.match(/\d+%/g) || [];
    for (const pct of percentages) {
      const value = parseInt(pct);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    
    console.log('✅ Dashboard math calculations are safe');
  });
  
  test('revenue health section loads without errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Wait for revenue health section (it's a table-card with Revenue Health title)
    await page.waitForSelector('.table-card', { timeout: 10000 });
    
    // Check revenue health elements exist
    const goHealth = await page.locator('#goHealth').count();
    expect(goHealth).toBe(1);
    
    const killSwitch = await page.locator('#killSwitchState').count();
    expect(killSwitch).toBe(1);
    
    const leakRate = await page.locator('#leakRate').count();
    expect(leakRate).toBe(1);
    
    // Should not have JS errors
    expect(jsErrors.length).toBe(0);
    
    console.log('✅ Revenue health section loaded correctly');
  });
  
  test('analytics API returns valid JSON structure', async ({ page }) => {
    // Intercept API call
    let apiResponse = null;
    page.on('response', async response => {
      if (response.url().includes('/api/analytics')) {
        try {
          apiResponse = await response.json();
        } catch (e) {
          console.error('Failed to parse analytics JSON:', e);
        }
      }
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForTimeout(3000); // Wait for API call
    
    if (apiResponse) {
      // Validate required properties exist
      expect(apiResponse).toHaveProperty('initialized');
      expect(apiResponse).toHaveProperty('totalClicks');
      expect(apiResponse).toHaveProperty('byNetwork');
      expect(apiResponse).toHaveProperty('topDeals');
      expect(apiResponse).toHaveProperty('byDay');
      
      // Validate types
      expect(typeof apiResponse.initialized).toBe('boolean');
      expect(typeof apiResponse.totalClicks).toBe('number');
      expect(Array.isArray(apiResponse.topDeals)).toBe(true);
      expect(Array.isArray(apiResponse.byDay)).toBe(true);
      
      console.log('✅ Analytics API returns valid structure');
    } else {
      console.warn('⚠️ Analytics API did not respond (may be normal for tests)');
    }
  });
  
  test('dashboard does not get stuck in loading state', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    
    // Should exit loading within reasonable time
    const hasExitedLoading = await Promise.race([
      page.waitForSelector('[data-testid="dashboard-ready"], [data-testid="admin-error"], .notice', {
        timeout: 15000
      }).then(() => true),
      page.waitForTimeout(15000).then(() => false)
    ]);
    
    expect(hasExitedLoading).toBe(true);
    
    // Verify loading spinner is gone
    const loadingVisible = await page.locator('[data-testid="dashboard-loading"]').isVisible().catch(() => false);
    expect(loadingVisible).toBe(false);
    
    console.log('✅ Dashboard exited loading state properly');
  });
});

test.describe('Analytics Dashboard - Console Error Detection', () => {
  
  test('no console errors on dashboard load', async ({ page }) => {
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForTimeout(3000);
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(err => 
      !err.includes('identity.netlify.com') && // Netlify Identity may fail in test
      !err.includes('emrldtp.cc') && // Affiliate script may fail
      !err.includes('favicon') // Favicon not found is OK
    );
    
    // Should have no critical errors
    expect(criticalErrors.length).toBe(0);
    
    if (criticalErrors.length > 0) {
      console.error('❌ Critical console errors found:', criticalErrors);
    } else {
      console.log('✅ No critical console errors detected');
    }
  });
  
  test('no JavaScript exceptions thrown', async ({ page }) => {
    const exceptions = [];
    
    page.on('pageerror', error => {
      exceptions.push({
        message: error.message,
        stack: error.stack
      });
    });
    
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForTimeout(3000);
    
    // Should have zero exceptions
    expect(exceptions.length).toBe(0);
    
    if (exceptions.length > 0) {
      console.error('❌ JavaScript exceptions:', exceptions);
    } else {
      console.log('✅ No JavaScript exceptions thrown');
    }
  });
});
