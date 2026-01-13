const { test, expect } = require('@playwright/test');

test.describe('Homepage Carousels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage loads and all carousel sections exist', async ({ page }) => {
    // Check that main sections exist (shop and activities)
    await expect(page.locator('[data-testid="section-shop"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-activities"]')).toBeVisible();
    
    // Check carousel containers exist
    await expect(page.locator('[data-testid="carousel-shop"]')).toBeVisible();
    await expect(page.locator('[data-testid="carousel-activities"]')).toBeVisible();
    
    // Check that carousels have content (at least one card each)
    const shopCards = page.locator('[data-testid="carousel-shop"] .item');
    const activityCards = page.locator('[data-testid="carousel-activities"] .item');
    
    await expect(shopCards.first()).toBeVisible();
    await expect(activityCards.first()).toBeVisible();
  });

  test('shop carousel right arrow scrolls content', async ({ page }) => {
    const carousel = page.locator('[data-testid="carousel-shop"]');
    const nextBtn = page.locator('.carousel-next[data-carousel="shop"]');
    
    // Get initial scroll position
    const initialScrollLeft = await carousel.evaluate((el) => el.scrollLeft);
    
    // Click next button
    await nextBtn.click();
    
    // Wait for scroll animation
    await page.waitForTimeout(400);
    
    // Verify scroll position changed
    const newScrollLeft = await carousel.evaluate((el) => el.scrollLeft);
    expect(newScrollLeft).toBeGreaterThan(initialScrollLeft);
  });

  test.skip('travel carousel navigation works - section removed from homepage', async ({ page }) => {
    const carousel = page.locator('[data-testid="carousel-travel"]');
    const nextBtn = page.locator('.carousel-next[data-carousel="travel"]');
    const prevBtn = page.locator('.carousel-prev[data-carousel="travel"]');
    
    // Click next
    await nextBtn.click();
    await page.waitForTimeout(400);
    
    const scrolledLeft = await carousel.evaluate((el) => el.scrollLeft);
    expect(scrolledLeft).toBeGreaterThan(0);
    
    // Click prev - should scroll back
    await prevBtn.click();
    await page.waitForTimeout(400);
    
    const backToStart = await carousel.evaluate((el) => el.scrollLeft);
    expect(backToStart).toBeLessThan(scrolledLeft);
  });

  test('activities carousel navigation works', async ({ page }) => {
    const carousel = page.locator('[data-testid="carousel-activities"]');
    const nextBtn = page.locator('.carousel-next[data-carousel="activities"]');
    
    const initialScrollLeft = await carousel.evaluate((el) => el.scrollLeft);
    
    await nextBtn.click();
    await page.waitForTimeout(400);
    
    const newScrollLeft = await carousel.evaluate((el) => el.scrollLeft);
    expect(newScrollLeft).toBeGreaterThan(initialScrollLeft);
  });

  test('see more links exist and have correct URLs', async ({ page }) => {
    // Shop see more link (now goes to products.html)
    const shopSeeMore = page.locator('[data-testid="see-more-shop"]');
    await expect(shopSeeMore).toBeVisible();
    await expect(shopSeeMore).toHaveAttribute('href', '/products.html');
    
    // Activities see more link
    const activitiesSeeMore = page.locator('[data-testid="see-more-activities"]');
    await expect(activitiesSeeMore).toBeVisible();
    await expect(activitiesSeeMore).toHaveAttribute('href', '/activities.html');
  });

  test('clicking see more shop navigates to full products page', async ({ page }) => {
    await page.click('[data-testid="see-more-shop"]');
    await page.waitForURL('**/products.html');
    expect(page.url()).toContain('/products.html');
  });

  test.skip('clicking see more travel navigates to full travel page - section removed', async ({ page }) => {
    await page.click('[data-testid="see-more-travel"]');
    await page.waitForURL('**/travel.html');
    expect(page.url()).toContain('/travel.html');
  });

  test('clicking see more activities navigates to full activities page', async ({ page }) => {
    await page.click('[data-testid="see-more-activities"]');
    await page.waitForURL('**/activities.html');
    expect(page.url()).toContain('/activities.html');
  });

  test.skip('rentals section exists with proper elements - section removed from homepage', async ({ page }) => {
    // Check rentals section exists
    await expect(page.locator('[data-testid="section-rentals"]')).toBeVisible();
    
    // Check input exists
    const rentalsInput = page.locator('[data-testid="rentals-input"]');
    await expect(rentalsInput).toBeVisible();
    await expect(rentalsInput).toHaveAttribute('placeholder', /city or airport/i);
    
    // Check buttons exist
    await expect(page.locator('[data-testid="rentals-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="rentals-near-me"]')).toBeVisible();
  });

  test.skip('rentals search button opens external URL with location - section removed', async ({ page, context }) => {
    const rentalsInput = page.locator('[data-testid="rentals-input"]');
    const searchBtn = page.locator('[data-testid="rentals-search"]');
    
    // Mock window.open to capture the URL without actually navigating
    await page.evaluate(() => {
      window.capturedRentalsUrl = null;
      window.open = (url) => {
        window.capturedRentalsUrl = url;
        return null;
      };
    });
    
    // Enter a location
    await rentalsInput.fill('Paris');
    await searchBtn.click();
    
    // Wait a moment for the click handler
    await page.waitForTimeout(200);
    
    // Verify URL was generated
    const capturedUrl = await page.evaluate(() => window.capturedRentalsUrl);
    expect(capturedUrl).toBeTruthy();
    expect(capturedUrl).toContain('getrenta');
    expect(capturedUrl).toContain('shmarker=487456');
    expect(capturedUrl).toContain('Paris');
  });

  test.skip('rentals search without input shows hint - section removed', async ({ page }) => {
    const searchBtn = page.locator('[data-testid="rentals-search"]');
    const hint = page.locator('#rentalsHint');
    
    // Click search without entering location
    await searchBtn.click();
    
    // Hint should become visible
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(/enter a city/i);
  });

  test('carousel cards preserve affiliate links', async ({ page }) => {
    // Check that shop cards have proper affiliate links
    const shopCard = page.locator('[data-testid="carousel-shop"] .item').first();
    const shopLink = shopCard.locator('a.link.primary');
    
    await expect(shopLink).toBeVisible();
    const href = await shopLink.getAttribute('href');
    
    // Should have a valid affiliate URL (not empty, not #)
    expect(href).toBeTruthy();
    expect(href).not.toBe('#');
    expect(href.length).toBeGreaterThan(10);
  });

  test('carousel cards have share buttons', async ({ page }) => {
    // Check that cards in carousel have share buttons
    const shopCard = page.locator('[data-testid="carousel-shop"] .item').first();
    const shareBtn = shopCard.locator('.share-btn');
    
    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toContainText('Share');
  });

  test('more menu toggle works', async ({ page }) => {
    const moreBtn = page.locator('#moreMenuBtn');
    const moreMenu = page.locator('#moreMenu');
    
    // Initially hidden
    await expect(moreMenu).toBeHidden();
    
    // Click to open
    await moreBtn.click();
    await expect(moreMenu).toBeVisible();
    
    // Click again to close
    await moreBtn.click();
    await expect(moreMenu).toBeHidden();
  });

  test('header navigation uses anchor links', async ({ page }) => {
    // Check that header links use anchors for sections that exist
    const shopLink = page.locator('header a.pill[href="/#shop"]');
    const activitiesLink = page.locator('header a.pill[href="/#activities"]');
    
    await expect(shopLink).toBeVisible();
    await expect(activitiesLink).toBeVisible();
  });
});
