const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

    // Paths to JSON files
    const amazonPath = path.join(process.cwd(), 'public', 'data', 'amazon.json');
    const travelPath = path.join(process.cwd(), 'public', 'data', 'travel.json');

    // Write files
    await fs.writeFile(amazonPath, JSON.stringify(data.amazon, null, 2), 'utf8');
    await fs.writeFile(travelPath, JSON.stringify(data.travel, null, 2), 'utf8');

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
    console.error('Save error:', error);
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
