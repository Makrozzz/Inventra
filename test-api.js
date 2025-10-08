const https = require('https');

const url = 'https://www.ivms2006.com/api/getProducts.php';

console.log('🔄 Testing API endpoint:', url);

const options = {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Node.js Test Script'
  }
};

const req = https.request(url, options, (res) => {
  console.log('📡 Status Code:', res.statusCode);
  console.log('📡 Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Raw Response:');
    console.log(data);
    console.log('\n📦 Response Length:', data.length);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('\n✅ Parsed JSON:');
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('\n❌ JSON Parse Error:', e.message);
      console.log('Raw data might not be valid JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.setTimeout(10000, () => {
  console.error('❌ Request timeout');
  req.destroy();
});

req.end();