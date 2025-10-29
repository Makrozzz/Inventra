const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve({ error: 'Invalid JSON', data });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testBranchLoading() {
  console.log('🧪 Testing Branch Loading Functionality...\n');
  
  try {
    // Test projects endpoint first
    console.log('1️⃣ Testing projects endpoint...');
    const projectsData = await makeRequest('http://localhost:5000/api/projects');
    
    if (projectsData.error) {
      console.error('❌ Projects request failed:', projectsData.data);
      return;
    }
    
    console.log('✅ Projects response status: success');
    console.log('📋 Number of projects:', projectsData.data ? projectsData.data.length : 0);
    
    if (projectsData.data && projectsData.data.length > 0) {
      // Show first few projects
      console.log('📋 Sample projects:');
      projectsData.data.slice(0, 3).forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.Project_Ref_Number} - ${project.Customer_Name}`);
      });
      
      // Extract unique customer names
      const customers = [...new Set(projectsData.data.map(p => p.Customer_Name))];
      console.log('\n👥 Available customers:', customers.slice(0, 5));
      
      // Test branch loading for first customer
      if (customers.length > 0) {
        const testCustomer = customers[0];
        console.log(`\n2️⃣ Testing branch loading for customer: "${testCustomer}"`);
        
        const branchUrl = `http://localhost:5000/api/projects/branches/${encodeURIComponent(testCustomer)}`;
        console.log('🔗 URL:', branchUrl);
        
        const branchData = await makeRequest(branchUrl);
        
        if (branchData.error) {
          console.error('❌ Branch request failed:', branchData.data);
        } else {
          console.log('✅ Branch response status: success');
          console.log('🏢 Number of branches:', branchData.data ? branchData.data.length : 0);
          
          if (branchData.data && branchData.data.length > 0) {
            console.log('🏢 Branches:');
            branchData.data.forEach((branch, index) => {
              console.log(`   ${index + 1}. ${branch.Branch} (Customer ID: ${branch.Customer_ID})`);
            });
          } else {
            console.log('ℹ️  No branches found for this customer');
          }
        }
      }
    } else {
      console.log('ℹ️  No projects found in database');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Start backend server first, then run test
console.log('⏳ Please ensure backend server is running on http://localhost:5000');
console.log('⏳ Starting test in 2 seconds...\n');

setTimeout(testBranchLoading, 2000);