const http = require('http');

// Test the projects API endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/projects',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Testing Projects API endpoint...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ API Response received:\n');
      console.log('Success:', response.success);
      console.log('Message:', response.message);
      console.log('Number of projects:', response.data ? response.data.length : 0);
      
      if (response.data && response.data.length > 0) {
        console.log('\n📋 First project data:');
        console.log(JSON.stringify(response.data[0], null, 2));
        
        // Check if it's real data or mock data
        if (response.data[0].Project_Ref_Number === 'QT240000000015729') {
          console.log('\n✅ SUCCESS! Showing REAL data from database!');
        } else if (response.data[0].Project_Ref_Number === 'MOCK-001') {
          console.log('\n❌ WARNING! Still showing MOCK data!');
        }
      } else {
        console.log('\n⚠️ No projects returned');
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();
