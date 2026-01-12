// Redirect Canary - Scheduled health check for /go endpoint
// Runs every 10 minutes to ensure revenue routing is functional

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const SITE_URL = process.env.URL || 'https://tradetrend.netlify.app';

async function checkRedirect(network, dealId) {
  return new Promise((resolve, reject) => {
    const url = `${SITE_URL}/go?network=${network}&id=${dealId}`;
    
    https.get(url, { maxRedirects: 0 }, (res) => {
      const status = res.statusCode;
      const location = res.headers.location || '';
      
      resolve({ status, location, url });
    }).on('error', reject);
  });
}

async function logIncident(incident) {
  try {
    const historyPath = path.join(__dirname, '../../.ai/history.json');
    const historyData = await fs.readFile(historyPath, 'utf8');
    const history = JSON.parse(historyData);
    
    history.incidents.push({
      timestamp: new Date().toISOString(),
      ...incident
    });
    
    // Keep last 1000 incidents
    if (history.incidents.length > 1000) {
      history.incidents = history.incidents.slice(-1000);
    }
    
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    console.log('✅ Logged incident to history.json');
  } catch (error) {
    console.error('❌ Failed to log incident:', error);
  }
}

async function enableKillSwitch() {
  try {
    const businessPath = path.join(__dirname, '../../.ai/business.json');
    const businessData = await fs.readFile(businessPath, 'utf8');
    const config = JSON.parse(businessData);
    
    if (!config.emergencyFlags) {
      config.emergencyFlags = {};
    }
    
    config.emergencyFlags.forceDirect = true;
    
    await fs.writeFile(businessPath, JSON.stringify(config, null, 2));
    console.log('🚨 KILL SWITCH ACTIVATED: forceDirect = true');
  } catch (error) {
    console.error('❌ Failed to activate kill switch:', error);
  }
}

exports.handler = async (event) => {
  console.log('🔍 Starting redirect canary check...');
  
  try {
    // Get a real deal ID from amazon.json
    const amazonDataPath = path.join(__dirname, '../../public/data/amazon.json');
    const amazonData = JSON.parse(await fs.readFile(amazonDataPath, 'utf8'));
    const publishedDeals = (amazonData.items || []).filter(d => d.status === 'published' || !d.status);
    
    if (publishedDeals.length === 0) {
      console.warn('⚠️  No published deals found for canary test');
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'skipped', reason: 'No published deals' })
      };
    }
    
    const testDeal = publishedDeals[0];
    const result = await checkRedirect('amazon', testDeal.id);
    
    console.log('Redirect test result:', result);
    
    // Check if redirect is healthy
    const isHealthy = result.status === 302;
    const isSelfRedirect = result.location && (
      result.location.includes('tradetrend.netlify.app') ||
      result.location.includes('localhost') ||
      result.location.startsWith('/?network=')
    );
    const isExternal = result.location && (
      result.location.includes('amazon') ||
      result.location.includes('amzn.to')
    );
    
    if (!isHealthy || isSelfRedirect || !isExternal) {
      console.error('🚨 REDIRECT FAILURE DETECTED');
      
      // Log incident
      await logIncident({
        severity: 'CRITICAL',
        type: 'redirect_failure',
        description: 'Canary detected /go redirect failure',
        dealId: testDeal.id,
        network: 'amazon',
        status: result.status,
        location: result.location,
        rootCause: isSelfRedirect ? 'Self-redirect loop' : 'Invalid redirect',
        fix: 'Kill switch activation recommended',
        preventionAdded: 'Scheduled canary monitoring'
      });
      
      // Optionally activate kill switch (uncomment if desired)
      // await enableKillSwitch();
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'FAILED',
          redirect_status: result.status,
          redirect_location: result.location,
          is_self_redirect: isSelfRedirect,
          is_external: isExternal,
          message: 'Redirect canary failed - revenue at risk'
        })
      };
    }
    
    console.log('✅ Redirect canary passed');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'PASS',
        redirect_status: result.status,
        redirect_location: result.location,
        tested_deal: testDeal.id,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ Canary check failed:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'ERROR',
        error: error.message
      })
    };
  }
};
