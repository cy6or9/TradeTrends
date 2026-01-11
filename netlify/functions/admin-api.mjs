import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const url = new URL(req.url);
    const collection = url.searchParams.get('collection'); // 'amazon' or 'travel'
    
    if (!collection || !['amazon', 'travel'].includes(collection)) {
      return new Response(JSON.stringify({ error: 'Invalid collection' }), { 
        status: 400, 
        headers 
      });
    }

    const filePath = join(process.cwd(), 'public', 'data', `${collection}.json`);

    // GET - Read deals
    if (req.method === 'GET') {
      const data = await readFile(filePath, 'utf-8');
      return new Response(data, { headers });
    }

    // POST - Write deals
    if (req.method === 'POST') {
      const body = await req.text();
      const data = JSON.parse(body);
      
      // Validate structure
      if (!data.items || !Array.isArray(data.items)) {
        return new Response(JSON.stringify({ error: 'Invalid data structure' }), { 
          status: 400, 
          headers 
        });
      }

      // Write to file
      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      
      return new Response(JSON.stringify({ success: true, message: 'Saved successfully' }), { 
        headers 
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers 
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers 
    });
  }
};
