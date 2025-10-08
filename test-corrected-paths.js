const https = require('https');

const testUrls = [
    'https://www.ivms2006.com/ostic/api/simple-test.html',
    'https://www.ivms2006.com/ostic/api/test.php',
    'https://www.ivms2006.com/ostic/api/getProducts.php'
];

console.log('🔄 Testing corrected API paths...\n');

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
                    console.log(`   ✅ SUCCESS! File found and accessible`);
                    console.log(`   Preview: ${data.substring(0, 150).replace(/\s+/g, ' ')}`);
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

async function testCorrectedPaths() {
    for (const url of testUrls) {
        await testUrl(url);
    }
    console.log('📋 If you see ✅ SUCCESS above, the files are correctly uploaded!');
    console.log('📋 If you see ❌ 404 Error, try uploading to public_html/ostic/api/ instead');
}

testCorrectedPaths();