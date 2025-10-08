const https = require('https');

const testUrls = [
    'https://ivms2006.com/',
    'https://www.ivms2006.com/',
    'https://ivms2006.com/index.html',
    'https://www.ivms2006.com/index.html'
];

console.log('🔄 Testing main website access...\n');

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
                    console.log(`   ✅ Website is accessible!`);
                    console.log(`   Content preview: ${data.substring(0, 200).replace(/\s+/g, ' ')}...`);
                } else if (res.statusCode === 301 || res.statusCode === 302) {
                    console.log(`   🔄 Redirect to: ${res.headers.location}`);
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

async function testMainSite() {
    for (const url of testUrls) {
        await testUrl(url);
    }
}

testMainSite();