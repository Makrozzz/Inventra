// Using import instead of require for fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:5000/api';

async function testBranchLoading() {
  console.log('🧪 Testing Branch Loading Functionality...\n');
  
  try {
    // First, let's get some projects to see what customers exist
    console.log('1️⃣ Getting available projects...');
    const projectsResponse = await fetch(`${BASE_URL}/projects`);
    
    if (!projectsResponse.ok) {
      console.error('❌ Failed to fetch projects:', projectsResponse.status);
      return;
    }
    
    const projectsData = await projectsResponse.json();
    console.log('✅ Projects response:', JSON.stringify(projectsData, null, 2));
    
    // Extract unique customer names
    const customers = [...new Set(projectsData.data.map(p => p.Customer_Name))];
    console.log('\n📋 Available customers:', customers);
    
    // Test branch loading for each customer
    for (const customerName of customers.slice(0, 3)) { // Test first 3 customers
      console.log(`\n2️⃣ Testing branch loading for customer: "${customerName}"`);
      
      const branchUrl = `${BASE_URL}/projects/branches/${encodeURIComponent(customerName)}`;
      console.log('🔗 URL:', branchUrl);
      
      const branchResponse = await fetch(branchUrl);
      
      if (!branchResponse.ok) {
        console.error(`❌ Failed to fetch branches for ${customerName}:`, branchResponse.status);
        const errorText = await branchResponse.text();
        console.error('Error details:', errorText);
        continue;
      }
      
      const branchData = await branchResponse.json();
      console.log(`✅ Branches for ${customerName}:`, JSON.stringify(branchData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBranchLoading();