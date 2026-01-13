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

  // Authentication check - require Netlify Identity token
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

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

    // Use Netlify Blobs for persistent storage
    const storage = await createStorage();
    await storage.set('deals-activities', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Activities saved to blob storage',
        count: data.items.length,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Save error:', error);
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
