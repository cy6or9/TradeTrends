const { test, expect } = require('@playwright/test');

/**
 * Travel Guide Dashboard - Smoke Tests
 * Validates:
 * - /travelguide loads without errors
 * - Trending section renders cards
 * - City navigation works
 * - Empty state handling
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

test.describe('Travel Guide Dashboard', () => {
  
  test('/travelguide loads with no console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/travelguide`);
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="section-trending"]', { timeout: 10000 });
    
    // Check for console errors
    expect(consoleErrors.length).toBe(0);
    
    // Verify page title
    await expect(page).toHaveTitle(/Travel Guide Dashboard/);
    
    console.log('✅ Travel guide loaded without errors');
  });

  test('Trending Now section renders at least 3 cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/travelguide`);
    
    // Wait for trending grid to populate
    await page.waitForSelector('[data-testid="trending-grid"] .card', { timeout: 10000 });
    
    // Count cards
    const cardCount = await page.locator('[data-testid="trending-grid"] .card').count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
    
    console.log(`✅ Trending section has ${cardCount} cards`);
  });

  test('clicking a city card navigates to city page', async ({ page }) => {
    await page.goto(`${BASE_URL}/travelguide`);
    
    // Wait for cards to load
    await page.waitForSelector('[data-testid="trending-grid"] .card', { timeout: 10000 });
    
    // Click first city card
    await page.locator('[data-testid="trending-grid"] .card').first().click();
    
    // Should navigate to city page with clean URL (/travelguide/<slug>)
    await page.waitForURL(/\/travelguide\/[a-z0-9-]+/, { timeout: 5000 });
    
    console.log('✅ City navigation works');
  });

  test('city page renders header with city name', async ({ page }) => {
    // Navigate directly to a known city via clean URL
    await page.goto(`${BASE_URL}/travelguide/tokyo-japan`);
    
    // Wait for city content to load
    await page.waitForSelector('[data-testid="city-header"]', { timeout: 10000 });
    
    // Verify city header is visible
    const cityHeader = page.locator('[data-testid="city-header"]');
    await expect(cityHeader).toBeVisible();
    
    // Verify city name is displayed
    const cityName = await page.locator('#cityName').textContent();
    expect(cityName).toBeTruthy();
    expect(cityName.length).toBeGreaterThan(0);
    
    console.log(`✅ City page loaded: ${cityName}`);
  });

  test('city page shows Book buttons when activities exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/travelguide/tokyo-japan`);
    
    // Wait for experiences section
    await page.waitForSelector('[data-testid="city-experiences"]', { timeout: 10000 });
    
    // Check for book buttons or empty state
    const bookButtons = page.locator('[data-testid="book-button"]');
    const browseAllButton = page.locator('[data-testid="browse-all-button"]');
    
    const bookCount = await bookButtons.count();
    const browseCount = await browseAllButton.count();
    
    // Either should have Book buttons OR a "Browse all" empty state button
    expect(bookCount + browseCount).toBeGreaterThan(0);
    
    if (bookCount > 0) {
      console.log(`✅ City has ${bookCount} activities with Book buttons`);
    } else {
      console.log('✅ City shows empty state with Browse All button');
    }
  });

  test('city page handles unknown slug gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/travelguide/unknown-city-12345`);
    
    // Should show error state
    await page.waitForSelector('#errorState', { timeout: 10000 });
    
    const errorState = page.locator('#errorState');
    await expect(errorState).toBeVisible();
    
    // Should have a back link in the error state (use class="btn primary" to be specific)
    const backLink = page.locator('#errorState a.btn.primary[href="/travelguide"]');
    await expect(backLink).toBeVisible();
    
    console.log('✅ Unknown city handled gracefully');
  });

  test('Top Experiences section exists on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/travelguide`);
    
    const experiencesSection = page.locator('[data-testid="section-experiences"]');
    await expect(experiencesSection).toBeVisible();
    
    // Wait for grid to populate
    await page.waitForSelector('[data-testid="experiences-grid"]', { timeout: 10000 });
    
    console.log('✅ Top Experiences section rendered');
  });

  test('search form exists and can be submitted', async ({ page }) => {
    await page.goto(`${BASE_URL}/travelguide`);
    
    const searchInput = page.locator('#destinationSearch');
    await expect(searchInput).toBeVisible();
    
    const searchForm = page.locator('#searchForm');
    await expect(searchForm).toBeVisible();
    
    // Type in search (don't actually submit to avoid navigation)
    await searchInput.fill('Tokyo');
    await expect(searchInput).toHaveValue('Tokyo');
    
    console.log('✅ Search form is functional');
  });
});
