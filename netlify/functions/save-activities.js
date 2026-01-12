// Save activities API endpoint
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Validate data structure
    if (!data.items || !Array.isArray(data.items)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid data structure' })
      };
    }

    // Write to activities.json
    const filePath = path.join(__dirname, '../../public/data/activities.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Activities saved successfully',
        count: data.items.length 
      })
    };
  } catch (error) {
    console.error('Save error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to save activities',
        details: error.message 
      })
    };
  }
};
