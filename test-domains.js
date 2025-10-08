const https = require('https');

const domains = [
    'https://ivms2006.com/api/simple-test.html',
    'https://www.ivms2006.com/api/simple-test.html', 
    'https://ivms2005.com/api/simple-test.html',
    'https://www.ivms2005.com/api/simple-test.html',
    'https://ivms2006.com/simple-test.html',
    'https://www.ivms2006.com/simple-test.html'
];

console.log('🔄 Testing different domain variations...\n');

async function testDomain(url) {
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'GET', timeout: 5000 }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`📡 ${url}`);
                console.log(`   Status: ${res.statusCode}`);
                console.log(`   Content-Type: ${res.headers['content-type'] || 'unknown'}`);
                if (res.statusCode === 200) {
                    console.log(`   ✅ SUCCESS! Found working URL`);
                    console.log(`   Preview: ${data.substring(0, 100)}...`);
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
        
        req.on('timeout', () => {
            console.log(`📡 ${url}`);
            console.log(`   ⏰ Timeout`);
            console.log('');
            req.destroy();
            resolve();
        });
        
        req.end();
    });
}

async function testAllDomains() {
    for (const domain of domains) {
        await testDomain(domain);
    }
    
    console.log('🎯 Test completed! Look for ✅ SUCCESS entries above.');
}

testAllDomains();