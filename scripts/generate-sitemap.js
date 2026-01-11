#!/usr/bin/env node
/**
 * Generate sitemap.xml dynamically from actual HTML files
 */

const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = 'https://tradetrends.netlify.app';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

// Get all HTML files from public directory
function getHtmlFiles(dir, baseDir = dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip admin directory
      if (item === 'admin') continue;
      files = files.concat(getHtmlFiles(fullPath, baseDir));
    } else if (item.endsWith('.html')) {
      const relativePath = path.relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }
  
  return files;
}

// Generate sitemap XML
function generateSitemap() {
  const htmlFiles = getHtmlFiles(PUBLIC_DIR);
  const today = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Process each HTML file
  htmlFiles.forEach(file => {
    let url = file.replace(/\\/g, '/'); // Windows compatibility
    
    // Convert index.html to /
    if (url === 'index.html') {
      url = '';
    } else {
      // Remove .html extension for cleaner URLs
      url = url.replace(/\.html$/, '.html'); // Keep .html for now
    }
    
    const fullUrl = `${PRODUCTION_URL}/${url}`;
    
    // Set priority based on page
    let priority = '0.5';
    let changefreq = 'weekly';
    
    if (url === '' || url === 'index.html') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (url.includes('amazon') || url.includes('travel')) {
      priority = '0.9';
      changefreq = 'daily';
    }
    
    xml += '  <url>\n';
    xml += `    <loc>${fullUrl}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>\n';
  
  return xml;
}

// Main execution
try {
  console.log('🗺️  Generating sitemap.xml...');
  const sitemap = generateSitemap();
  fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');
  console.log('✅ Sitemap generated successfully');
  console.log(`   Location: ${SITEMAP_PATH}`);
  console.log(`   URLs: ${(sitemap.match(/<url>/g) || []).length}`);
} catch (error) {
  console.error('❌ Failed to generate sitemap:', error.message);
  process.exit(1);
}
