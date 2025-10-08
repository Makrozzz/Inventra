const https = require('https');

const endpoints = [
  'https://www.ivms2006.com/api/getProducts.php',
  'https://www.ivms2006.com/api/getProduct.php',
  'https://www.ivms2006.com/api/test.php',
  'https://www.ivms2006.com/api/config.php',
  'https://www.ivms2006.com/api/',
  'https://www.ivms2006.com/api',
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          length: data.length,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT'
      });
    });
    
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔄 Testing multiple API endpoints...\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`📡 ${endpoint}`);
    console.log(`   Status: ${result.status}`);
    if (result.contentType) console.log(`   Content-Type: ${result.contentType}`);
    if (result.data) console.log(`   Preview: ${result.data.replace(/\n/g, ' ').trim()}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    console.log('');
  }
}

testAllEndpoints();