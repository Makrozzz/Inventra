const https = require('https');

const testUrl = 'https://www.ivms2006.com/api/getProjects.php';

console.log('🔄 Testing Projects API endpoint...');

const req = https.request(testUrl, { method: 'GET', timeout: 10000 }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`📡 Status: ${res.statusCode}`);
        console.log(`📡 Content-Type: ${res.headers['content-type']}`);
        
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                console.log('✅ Projects API Response:');
                console.log(`   Success: ${json.success}`);
                console.log(`   Count: ${json.count}`);
                console.log(`   Timestamp: ${json.timestamp}`);
                
                if (json.data && json.data.length > 0) {
                    console.log('📦 Sample Project:');
                    console.log(`   ID: ${json.data[0].id}`);
                    console.log(`   Name: ${json.data[0].name}`);
                    console.log(`   Client: ${json.data[0].client}`);
                    console.log(`   Status: ${json.data[0].status}`);
                } else {
                    console.log('📝 Note: PROJECT table is empty but API is working');
                }
            } catch (e) {
                console.log('❌ JSON Parse Error:', e.message);
                console.log('Raw response:', data.substring(0, 200));
            }
        } else {
            console.log('❌ Error Response:', data.substring(0, 200));
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Connection Error:', error.message);
});

req.on('timeout', () => {
    console.log('⏰ Request timeout');
    req.destroy();
});

req.end();