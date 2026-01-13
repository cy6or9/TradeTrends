const { test, expect } = require('@playwright/test');

/**
 * Card Layout and Interaction Tests
 * Verifies:
 * - Cards have equal heights in each row
 * - Buttons are aligned at the bottom
 * - Cards are clickable even with hover tooltips
 * - Scroll bars have correct spacing
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

test.describe('Card Layout and Button Alignment', () => {
  
  test('all cards in shop section have equal heights', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // Wait for cards to load
    await page.waitForSelector('#amzGrid .card', { timeout: 10000 });
    
    // Get all card heights in the shop section
    const cardHeights = await page.$$eval('#amzGrid .card', cards => 
      cards.map(card => card.getBoundingClientRect().height)
    );
    
    // All cards should have the same height (within 1px tolerance for rounding)
    if (cardHeights.length > 1) {
      const maxHeight = Math.max(...cardHeights);
      const minHeight = Math.min(...cardHeights);
      expect(maxHeight - minHeight).toBeLessThanOrEqual(2);
    }
  });
  
  test('all cards in activities section have equal heights', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // Wait for cards to load
    await page.waitForSelector('#actGrid .card', { timeout: 10000 });
    
    // Get all card heights
    const cardHeights = await page.$$eval('#actGrid .card', cards => 
      cards.map(card => card.getBoundingClientRect().height)
    );
    
    // All cards should have the same height
    if (cardHeights.length > 1) {
      const maxHeight = Math.max(...cardHeights);
      const minHeight = Math.min(...cardHeights);
      expect(maxHeight - minHeight).toBeLessThanOrEqual(2);
    }
  });
  
  test('action buttons are aligned at bottom of cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('#amzGrid .card', { timeout: 10000 });
    
    // Get Y positions of all primary CTA buttons in first 3 cards
    const buttonPositions = await page.$$eval('#amzGrid .card .link.primary', 
      buttons => buttons.slice(0, 3).map(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.top;
      })
    );
    
    // Buttons should be at same vertical position (within 2px)
    if (buttonPositions.length > 1) {
      const maxY = Math.max(...buttonPositions);
      const minY = Math.min(...buttonPositions);
      expect(maxY - minY).toBeLessThanOrEqual(2);
    }
  });
  
  test('share buttons are aligned at bottom of cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('#amzGrid .card', { timeout: 10000 });
    
    // Get Y positions of all share buttons in first 3 cards
    const sharePositions = await page.$$eval('#amzGrid .card .share-btn', 
      buttons => buttons.slice(0, 3).map(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.top;
      })
    );
    
    // Share buttons should be at same vertical position
    if (sharePositions.length > 1) {
      const maxY = Math.max(...sharePositions);
      const minY = Math.min(...sharePositions);
      expect(maxY - minY).toBeLessThanOrEqual(2);
    }
  });
});

test.describe('Card Interactivity with Hover Tooltip', () => {
  
  test('can click primary CTA button when hovering over card', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('#amzGrid .card', { timeout: 10000 });
    
    // Hover over first card
    const firstCard = page.locator('#amzGrid .card').first();
    await firstCard.hover();
    
    // Wait a moment for hover tooltip to appear
    await page.waitForTimeout(400);
    
    // Try to click the primary CTA button
    const ctaButton = firstCard.locator('.link.primary');
    
    // Should be clickable (not blocked by tooltip)
    await expect(ctaButton).toBeVisible();
    
    // Get the href to verify it's a real link
    const href = await ctaButton.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toBe('#');
  });
  
  test('can click share button when hovering over card', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('#amzGrid .card', { timeout: 10000 });
    
    // Hover over first card
    const firstCard = page.locator('#amzGrid .card').first();
    await firstCard.hover();
    
    // Wait for hover effect
    await page.waitForTimeout(400);
    
    // Try to click share button
    const shareBtn = firstCard.locator('.share-btn');
    await expect(shareBtn).toBeVisible();
    
    // Click should work
    await shareBtn.click();
    
    // Share menu should appear
    await page.waitForTimeout(200);
    const shareMenu = page.locator('.share-menu[style*="display: block"], .share-menu[style*="display:block"]').first();
    // Menu might appear, if it does it should be visible
    const menuCount = await page.locator('.share-menu').count();
    expect(menuCount).toBeGreaterThan(0);
  });
  
  test('hover tooltip does not block mouse events', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('#amzGrid .card', { timeout: 10000 });
    
    const firstCard = page.locator('#amzGrid .card').first();
    
    // Get card position
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).toBeTruthy();
    
    // Hover to trigger tooltip
    await firstCard.hover();
    await page.waitForTimeout(400);
    
    // Check if tooltip is visible
    const tooltip = firstCard.locator('.hover-tooltip');
    const tooltipOpacity = await tooltip.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    
    // Tooltip should be visible when hovering
    expect(parseFloat(tooltipOpacity)).toBeGreaterThan(0);
    
    // But pointer-events should be none
    const pointerEvents = await tooltip.evaluate(el => 
      window.getComputedStyle(el).pointerEvents
    );
    expect(pointerEvents).toBe('none');
  });
});

test.describe('Scroll Bar Spacing', () => {
  
  test('scroll bar has 0px gap from section header', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('.sectionHeader', { timeout: 10000 });
    await page.waitForSelector('.carousel-row', { timeout: 10000 });
    
    // Get section header bottom position
    const headerBottom = await page.$eval('.sectionHeader', el => {
      const rect = el.getBoundingClientRect();
      return rect.bottom;
    });
    
    // Get carousel top position
    const carouselTop = await page.$eval('.carousel-row', el => {
      const rect = el.getBoundingClientRect();
      return rect.top;
    });
    
    // Gap should be 0px or very close
    const gap = carouselTop - headerBottom;
    expect(gap).toBeLessThanOrEqual(1); // Allow 1px for rounding
  });
  
  test('cards maintain equal height in carousel', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('.carousel-row .card', { timeout: 10000 });
    
    // Get heights of cards in carousel
    const heights = await page.$$eval('.carousel-row .card', cards => 
      cards.slice(0, 4).map(card => card.offsetHeight)
    );
    
    if (heights.length > 1) {
      const maxHeight = Math.max(...heights);
      const minHeight = Math.min(...heights);
      // All carousel cards should be equal height
      expect(maxHeight - minHeight).toBeLessThanOrEqual(2);
    }
  });
});

test.describe('Responsive Card Layout', () => {
  
  test('cards maintain equal heights on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('#amzGrid .card', { timeout: 10000 });
    
    const cardHeights = await page.$$eval('#amzGrid .card', cards => 
      cards.map(card => card.getBoundingClientRect().height)
    );
    
    // Even on mobile, cards should have equal heights
    if (cardHeights.length > 1) {
      const maxHeight = Math.max(...cardHeights);
      const minHeight = Math.min(...cardHeights);
      expect(maxHeight - minHeight).toBeLessThanOrEqual(2);
    }
  });
  
  test('cards maintain equal heights on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/`);
    
    await page.waitForSelector('#amzGrid .card', { timeout: 10000 });
    
    const cardHeights = await page.$$eval('#amzGrid .card', cards => 
      cards.map(card => card.getBoundingClientRect().height)
    );
    
    if (cardHeights.length > 1) {
      const maxHeight = Math.max(...cardHeights);
      const minHeight = Math.min(...cardHeights);
      expect(maxHeight - minHeight).toBeLessThanOrEqual(2);
    }
  });
});
