const fetch = require('node-fetch');

async function testAssetsAPI() {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('Testing Assets API...\n');
    
    // Test 1: Health check
    console.log('1. Health Check:');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('   Status:', healthResponse.status);
    console.log('   Data:', healthData);
    console.log();
    
    // Test 2: Assets endpoint
    console.log('2. Assets Endpoint:');
    const assetsResponse = await fetch(`${baseURL}/api/v1/assets`);
    const assetsData = await assetsResponse.json();
    console.log('   Status:', assetsResponse.status);
    console.log('   Success:', assetsData.success);
    console.log('   Message:', assetsData.message);
    console.log('   Assets Count:', assetsData.data?.assets?.length || 0);
    
    if (assetsData.data?.assets?.length > 0) {
      console.log('   Sample Asset:', JSON.stringify(assetsData.data.assets[0], null, 2));
    }
    console.log();
    
    // Test 3: Dashboard statistics
    console.log('3. Dashboard Statistics:');
    const statsResponse = await fetch(`${baseURL}/api/v1/assets/statistics`);
    const statsData = await statsResponse.json();
    console.log('   Status:', statsResponse.status);
    console.log('   Success:', statsData.success);
    console.log('   Total Assets:', statsData.data?.total || 0);
    console.log('   By Status:', JSON.stringify(statsData.data?.byStatus, null, 2));
    console.log('   Recent Assets Count:', statsData.data?.recent?.length || 0);
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAssetsAPI();