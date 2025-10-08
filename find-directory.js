// Test script to find the correct directory
const https = require('https');

// Common directory patterns for websites
const testPaths = [
    '', // Root
    'www',
    'html', 
    'web',
    'public',
    'site',
    'main',
    'ivms2006.com',
    'www.ivms2006.com',
    'ivms2006',
    'ivms',
    'ostic'
];

console.log('🔄 Testing different directory paths for simple-test.html...\n');
console.log('📋 You should upload simple-test.html to each of these locations and tell me which one works:\n');

testPaths.forEach((path, index) => {
    const uploadPath = path ? `public_html/${path}/simple-test.html` : 'public_html/simple-test.html';
    const testUrl = path ? `https://www.ivms2006.com/${path}/simple-test.html` : 'https://www.ivms2006.com/simple-test.html';
    
    console.log(`${index + 1}. Upload to: ${uploadPath}`);
    console.log(`   Test URL: ${testUrl}`);
    console.log('');
});

console.log('📝 Instructions:');
console.log('1. Try uploading simple-test.html to location #1 first');
console.log('2. Test the URL in your browser');
console.log('3. If it shows the HTML page, that\'s the correct directory!');
console.log('4. If not, try the next location until you find one that works');