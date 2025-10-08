const https = require('https');

const testUrls = [
    'https://www.ivms2006.com/api/simple-test.html',
    'https://www.ivms2006.com/api/test.php',
    'https://www.ivms2006.com/api/getProducts.php',
    'https://www.ivms2006.com/api/config.php'
];

console.log('🔄 Testing main directory API paths...\n');

async function testUrl(url) {
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'GET', timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`📡 ${url}`);
                console.log(`   Status: ${res.statusCode}`);
                console.log(`   Content-Type: ${res.headers['content-type'] || 'unknown'}`);
                
                if (res.statusCode === 200) {
                    console.log(`   ✅ SUCCESS! File accessible`);
                    if (data.includes('{"success"')) {
                        console.log(`   🎯 Valid JSON API Response!`);
                    }
                    console.log(`   Preview: ${data.substring(0, 100).replace(/\s+/g, ' ')}...`);
                } else {
                    console.log(`   ❌ ${res.statusCode} Error`);
                }
                console.log('');
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log(`📡 ${url}`);
            console.log(`   ❌ Connection Error: ${error.message}`);
            console.log('');
            resolve();
        });
        
        req.end();
    });
}

async function testMainAPI() {
    for (const url of testUrls) {
        await testUrl(url);
    }
}

testMainAPI();