const { default: fetch } = require('node-fetch');

async function testAddAsset() {
  const testData = {
    project_reference_num: 'QT240000000015729',
    customer_name: 'NADMA',
    customer_reference_number: 'M24050',
    branch: 'Putrajaya',
    serial_number: 'TEST-001-' + Date.now(),
    tag_id: 'TEST-TAG-001',
    item_name: 'Test Computer',
    category: 'Desktop',
    model: 'Dell Test Model',
    status: 'Active',
    recipient_name: 'Test Recipient',
    department_name: 'Test Department',
    peripherals: [
      {
        peripheral_name: 'Keyboard',
        serial_code_name: 'KB-TEST-001',
        condition: 'Good',
        remarks: 'Test keyboard'
      }
    ]
  };

  try {
    console.log('Testing asset creation with data:', testData);
    
    const response = await fetch('http://localhost:5000/api/v1/assets/create-with-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseData = await response.text();
    console.log('Response body:', responseData);
    
    if (response.ok) {
      const parsed = JSON.parse(responseData);
      console.log('Success! Asset created:', parsed);
    } else {
      console.log('Error response:', responseData);
    }
  } catch (error) {
    console.error('Error testing asset creation:', error);
  }
}

testAddAsset();