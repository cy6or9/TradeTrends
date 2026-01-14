const { createStorage } = require('./lib/storage');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Note: Authentication removed to allow admin panel usage
  // In production, implement proper auth via Netlify Identity or env-based checks

  try {
    const data = JSON.parse(event.body);
    
    // Validate data structure
    if (!data.amazon || !data.travel) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid data format' })
      };
    }

    console.log('[save-deals] Attempting to save amazon:', data.amazon.items?.length, 'travel:', data.travel.items?.length);

    // In local dev: write directly to public/data files
    // In production: use Netlify Blobs
    const isLocalDev = !process.env.NETLIFY || process.env.CONTEXT === 'dev';
    
    if (isLocalDev) {
      const fs = require('fs');
      const path = require('path');
      const publicDir = path.join(process.cwd(), 'public', 'data');
      
      fs.writeFileSync(path.join(publicDir, 'amazon.json'), JSON.stringify(data.amazon, null, 2));
      fs.writeFileSync(path.join(publicDir, 'travel.json'), JSON.stringify(data.travel, null, 2));
      console.log('[save-deals] ✅ Saved to public files: amazon.json, travel.json');
    } else {
      // Production: use blob storage
      const storage = await createStorage();
      await storage.set('deals-amazon', data.amazon);
      await storage.set('deals-travel', data.travel);
      console.log('[save-deals] ✅ Saved to blob storage');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Deals saved successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('[save-deals] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to save deals',
        details: error.message
      })
    };
  }
};
