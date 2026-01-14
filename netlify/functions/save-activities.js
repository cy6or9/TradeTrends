// Save activities API endpoint
const { createStorage } = require('./lib/storage');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
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
    if (!data.items || !Array.isArray(data.items)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid data structure' })
      };
    }

    console.log('[save-activities] Attempting to save', data.items.length, 'activities');

    // In local dev: write directly to public/data/activities.json
    // In production: use Netlify Blobs
    const isLocalDev = !process.env.NETLIFY || process.env.CONTEXT === 'dev';
    
    if (isLocalDev) {
      const fs = require('fs');
      const path = require('path');
      const publicDir = path.join(process.cwd(), 'public', 'data');
      const filePath = path.join(publicDir, 'activities.json');
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log('[save-activities] ✅ Saved to public file:', filePath);
    } else {
      // Production: use blob storage
      const storage = await createStorage();
      await storage.set('deals-activities', data);
      console.log('[save-activities] ✅ Saved to blob storage');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Activities saved',
        count: data.items.length,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('[save-activities] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save activities',
        details: error.message 
      })
    };
  }
};
