const Asset = require('../models/Asset');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { logAssetChange, detectChanges } = require('../utils/auditLogger');
const { pool } = require('../config/database');

/**
 * Get all assets with pagination and filtering
 */
const getAllAssets = async (req, res, next) => {
  try {
    // First try to get assets
    let assets = await Asset.findAll();
    
    // Check if we need to fix orphaned assets based on the debug output
    const shouldCheckOrphans = true; // For now, always check
    
    if (shouldCheckOrphans) {
      console.log('Checking for orphaned assets and fixing if needed...');
      
      try {
        // Check for orphaned assets (no longer auto-fixes with defaults)
        const checkResult = await Asset.fixOrphanedAssets();
        if (checkResult.orphaned > 0) {
          console.log(`⚠️  FOUND ${checkResult.orphaned} ORPHANED ASSETS - Manual assignment required`);
          console.log('⚠️  Orphaned assets will not be auto-assigned to default customers');
        }
        // No need to re-fetch since we don't auto-fix anymore
      } catch (checkError) {
        console.warn('Failed to check orphaned assets:', checkError.message);
      }
    }

    // Return assets directly as JSON array for frontend compatibility
    res.status(200).json(assets);
  } catch (error) {
    logger.error('Error in getAllAssets:', error);
    console.error('Error fetching assets from database:', error);
    
    // Return proper error instead of mock data
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets from database',
      message: error.message,
      details: 'Please check database connection and ensure the server is connected to: ivmscom_Inventra'
    });
  }
};

/**
 * Get single asset by ID
 */
const getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found'
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    logger.error('Error in getAssetById:', error);
    res.status(500).json({
      error: 'Failed to fetch asset',
      message: error.message
    });
  }
};

/**
 * Get single asset by serial number
 */
const getAssetBySerialNumber = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;
    
    // For now, we'll search through all assets to find by serial number
    // In a production app, you'd want a dedicated method for this
    const allAssets = await Asset.findAll();
    const asset = allAssets.find(a => a.Asset_Serial_Number === serialNumber);

    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found'
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    logger.error('Error in getAssetBySerialNumber:', error);
    res.status(500).json({
      error: 'Failed to fetch asset',
      message: error.message
    });
  }
};

/**
 * Get complete asset detail by ID (includes project, customer, peripherals)
 */
const getAssetDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const assetDetail = await Asset.findDetailById(id);

    if (!assetDetail) {
      return res.status(404).json({
        error: 'Asset not found'
      });
    }

    res.status(200).json(assetDetail);
  } catch (error) {
    logger.error('Error in getAssetDetail:', error);
    res.status(500).json({
      error: 'Failed to fetch asset detail',
      message: error.message
    });
  }
};

/**
 * Create new asset
 */
const createAsset = async (req, res, next) => {
  try {
    const assetData = req.body;

    // Check if asset with same serial number already exists
    const existingAsset = await Asset.findBySerialNumber(assetData.serialNumber);
    if (existingAsset) {
      return res.status(400).json(
        formatResponse(false, null, 'Asset with this serial number already exists')
      );
    }

    const assetId = await Asset.create(assetData);
    const newAsset = await Asset.findBySerialNumber(assetData.serialNumber);

    logger.info(`Asset created: ${assetData.serialNumber} by user ${req.user?.userId}`);

    res.status(201).json(
      formatResponse(true, newAsset, 'Asset created successfully')
    );
  } catch (error) {
    logger.error('Error in createAsset:', error);
    next(error);
  }
};
const createAssetWithDetails = async (req, res, next) => {
  try {
    const completeData = req.body;
    console.log('Creating asset with complete details:', completeData);

    // Validate required fields
    if (!completeData.project_reference_num || !completeData.serial_number || 
        !completeData.tag_id || !completeData.item_name) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project_reference_num, serial_number, tag_id, item_name'
      });
    }

    console.log('Checking for existing asset with serial number:', completeData.serial_number);
    
    // Check if asset with same serial number already exists
    const existingAsset = await Asset.findBySerialNumber(completeData.serial_number);
    if (existingAsset) {
      console.log('Asset already exists with serial number:', completeData.serial_number);
      return res.status(400).json({
        success: false,
        error: 'Asset with this serial number already exists'
      });
    }

    console.log('Creating recipient...');
    // Step 1: Get or create recipient
    let recipientId = null;
    if (completeData.recipient_name) {
      if (!completeData.department_name) {
        console.log('   ℹ️  No department provided, using default');
        completeData.department_name = 'N/A';
      }
      recipientId = await Asset.createRecipient(
        completeData.recipient_name,
        completeData.department_name,
        completeData.position || null
      );
      console.log('Recipient created with ID:', recipientId);
    } else {
      console.log('   ℹ️  No recipient data provided (recipient_name:', completeData.recipient_name, ', department:', completeData.department_name, ')');
    }

    console.log('Creating/getting category...');
    // Step 2: Get or create category
    let categoryId = null;
    if (completeData.category) {
      categoryId = await Asset.getOrCreateCategory(completeData.category);
      console.log('Category ID:', categoryId);
    }

    console.log('Creating/getting model...');
    // Step 3: Get or create model (with category link)
    let modelId = null;
    if (completeData.model) {
      modelId = await Asset.getOrCreateModel(completeData.model, categoryId);
      console.log('Model ID:', modelId, '(linked to Category ID:', categoryId, ')');
    }

    console.log('Creating asset record...');
    // Step 4: Create the asset
    const assetData = {
      Asset_Serial_Number: completeData.serial_number,
      Asset_Tag_ID: completeData.tag_id,
      Item_Name: completeData.item_name,
      Status: completeData.status || 'Active',
      Recipients_ID: recipientId,
      Category_ID: categoryId,
      Model_ID: modelId,
      Windows: completeData.windows || null,
      Microsoft_Office: completeData.microsoft_office || null,
      Monthly_Prices: completeData.monthly_prices || null
    };

    const newAsset = await Asset.create(assetData);
    console.log('Asset created:', newAsset);

    console.log('Creating peripherals...');
    // Step 5: Create peripherals if provided
    let peripheralIds = [];
    if (completeData.peripherals && Array.isArray(completeData.peripherals)) {
      console.log(`Found ${completeData.peripherals.length} peripherals to create`);
      console.log('Peripheral array:', JSON.stringify(completeData.peripherals, null, 2));
      const PeripheralImporter = require('../utils/peripheralImporter');
      
      for (const peripheral of completeData.peripherals) {
        console.log('Processing peripheral:', JSON.stringify(peripheral, null, 2));
        console.log('peripheral.peripheral_name check:', {
          exists: !!peripheral.peripheral_name,
          value: peripheral.peripheral_name,
          type: typeof peripheral.peripheral_name
        });
        
        if (peripheral.peripheral_name) {
          try {
            // Check for duplicate peripheral before creating
            const isDuplicate = await PeripheralImporter.checkDuplicatePeripheral(
              newAsset.Asset_ID,
              peripheral.peripheral_name,
              peripheral.serial_code || peripheral.serial_code_name
            );
            
            if (isDuplicate) {
              console.log(`⚠️  Skipping duplicate peripheral: ${peripheral.peripheral_name} (${peripheral.serial_code || 'N/A'})`);
              continue; // Skip this peripheral
            }
            
            console.log(`🔧 Creating peripheral with data:`, {
              peripheral_name: peripheral.peripheral_name,
              serial_code: peripheral.serial_code,
              serial_code_name: peripheral.serial_code_name,
              condition: peripheral.condition,
              remarks: peripheral.remarks,
              'serial_code || serial_code_name': peripheral.serial_code || peripheral.serial_code_name
            });
            
            const peripheralId = await Asset.createPeripheral(
              newAsset.Asset_ID,
              peripheral.peripheral_name,
              peripheral.serial_code || peripheral.serial_code_name, // Support both field names
              peripheral.condition || 'Good',
              peripheral.remarks
            );
            peripheralIds.push(peripheralId);
            console.log('Peripheral created with ID:', peripheralId);
          } catch (peripheralError) {
            console.error('❌ Failed to create peripheral:', {
              peripheral_name: peripheral.peripheral_name,
              serial_code: peripheral.serial_code,
              asset_id: newAsset.Asset_ID,
              error_message: peripheralError.message,
              error_code: peripheralError.code,
              error_stack: peripheralError.stack
            });
            // Continue with other peripherals
          }
        } else {
          console.warn('⚠️  Skipping peripheral - missing peripheral_name:', JSON.stringify(peripheral, null, 2));
        }
      }
      console.log(`✅ Created ${peripheralIds.length} peripherals`);
    } else {
      console.log('No peripherals to create');
    }

    console.log('Linking software...');
    // Step 5.5: Link software to asset if provided (skip if 'None')
    if (completeData.software && completeData.software.trim()) {
      if (completeData.software.toLowerCase() !== 'none') {
        try {
          await Asset.linkSoftwareToAsset(newAsset.Asset_ID, completeData.software.trim());
          console.log(`✅ Linked software: ${completeData.software}`);
        } catch (softwareError) {
          console.log('Failed to link software:', softwareError.message);
          // Continue anyway
        }
      } else {
        console.log('✅ Software set to None - asset has no software');
      }
    }

    console.log('Linking to project...');
    // Step 6: Link to project/customer via inventory
    let inventoryId = null;
    if (completeData.project_reference_num && completeData.customer_name && completeData.branch) {
      try {
        inventoryId = await Asset.linkToProject(
          newAsset.Asset_ID,
          completeData.project_reference_num,
          completeData.customer_name,
          completeData.branch
        );
        console.log(`✅ LINKED TO PROJECT: Asset_ID ${newAsset.Asset_ID} → Inventory_ID ${inventoryId}`);
      } catch (linkError) {
        console.log('Failed to link to project:', linkError.message);
        // Continue anyway
      }
    }

    // Step 7: PM record creation - DISABLED (PM records should be created manually only)
    // console.log('Creating PM record...');
    let pmId = null;
    // PM records are no longer automatically created for new assets
    // They should be created manually through the Preventive Maintenance module
    console.log('Skipping automatic PM record creation - PM records should be created manually');

    console.log('Fetching complete asset data...');
    // Fetch the complete asset data to return
    const completeAsset = await Asset.findDetailById(newAsset.Asset_ID);

    logger.info(`Asset created with details: ${completeData.serial_number} by user ${req.user?.userId || 'system'}`);

    // Log the creation in audit log
    const userId = req.user?.User_ID || req.user?.userId || 1;
    const username = req.user?.Username || req.user?.username || 'System';
    await logAssetChange(
      userId,
      newAsset.Asset_ID,
      'INSERT',
      `${username} created new Asset ${completeData.serial_number}`,
      []
    );

    console.log('Sending success response with asset data:', {
      Asset_ID: newAsset.Asset_ID,
      Serial_Number: completeAsset?.Asset_Serial_Number,
      Peripherals_Count: completeAsset?.Peripherals?.length || 0
    });
    res.status(201).json({
      success: true,
      message: `Asset ${completeData.serial_number} created successfully with ${peripheralIds.length} peripherals`,
      data: {
        ...completeAsset,
        asset_id: newAsset.Asset_ID,
        serial_number: completeAsset?.Asset_Serial_Number || completeData.serial_number,
        tag_id: completeAsset?.Asset_Tag_ID || completeData.tag_id,
        item_name: completeAsset?.Item_Name || completeData.item_name,
        category: completeAsset?.Category || completeData.category,
        model: completeAsset?.Model || completeData.model,
        recipient_name: completeAsset?.Recipient_Name || completeData.recipient_name,
        peripherals_created: peripheralIds.length,
        pmid: null, // PM records are created manually only
        inventory_id: inventoryId,
        peripheral_ids: peripheralIds
      },
      message: 'Asset created successfully - PM records should be created manually when needed'
    });
  } catch (error) {
    logger.error('Error in createAssetWithDetails:', error);
    console.error('Error creating asset with details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to create asset',
      message: error.message
    });
  }
};

/**
 * Update asset by ID
 */
const updateAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('Updating asset ID:', id);
    console.log('Update data received:', updateData);

    // Check if asset exists
    const existingAsset = await Asset.findById(id);
    if (!existingAsset) {
      return res.status(404).json({
        error: 'Asset not found'
      });
    }

    // Handle updates - prioritize direct field updates over name-based lookups
    const finalUpdateData = {};
    
    // Direct field updates
    if (updateData.Asset_Serial_Number) finalUpdateData.Asset_Serial_Number = updateData.Asset_Serial_Number;
    if (updateData.Asset_Tag_ID) finalUpdateData.Asset_Tag_ID = updateData.Asset_Tag_ID;
    if (updateData.Item_Name) finalUpdateData.Item_Name = updateData.Item_Name;
    if (updateData.Status) finalUpdateData.Status = updateData.Status;
    
    // Add Windows, Office, and Monthly_Prices fields
    if (updateData.Windows !== undefined) finalUpdateData.Windows = updateData.Windows;
    if (updateData.Microsoft_Office !== undefined) finalUpdateData.Microsoft_Office = updateData.Microsoft_Office;
    if (updateData.Monthly_Prices !== undefined) finalUpdateData.Monthly_Prices = updateData.Monthly_Prices;
    
    // For ID fields, use them directly if provided
    if (updateData.Recipients_ID) finalUpdateData.Recipients_ID = updateData.Recipients_ID;
    if (updateData.Category_ID) finalUpdateData.Category_ID = updateData.Category_ID;
    if (updateData.Model_ID) finalUpdateData.Model_ID = updateData.Model_ID;

    // Handle name-based updates by updating existing records in-place
    if (updateData.Recipient_Name || updateData.Department || updateData.Position !== undefined) {
      try {
        const recipientId = await Asset.updateRecipientInfo(
          updateData.Recipient_Name,
          updateData.Department,
          updateData.Position,
          existingAsset.Recipients_ID
        );
        if (recipientId) {
          finalUpdateData.Recipients_ID = recipientId;
          console.log('Updated Recipients_ID to:', recipientId);
        }
      } catch (error) {
        console.warn('Could not update recipient information:', error.message);
      }
    }

    if (updateData.Category) {
      try {
        const categoryId = await Asset.updateCategoryInfo(updateData.Category, existingAsset.Category_ID);
        if (categoryId) {
          finalUpdateData.Category_ID = categoryId;
          console.log('Updated Category_ID to:', categoryId);
        }
      } catch (error) {
        console.warn('Could not update category:', error.message);
      }
    }

    if (updateData.Model) {
      try {
        // Pass the current or updated category ID to link model with category
        const categoryIdForModel = finalUpdateData.Category_ID || existingAsset.Category_ID;
        const modelId = await Asset.updateModelInfo(updateData.Model, existingAsset.Model_ID, categoryIdForModel);
        if (modelId) {
          finalUpdateData.Model_ID = modelId;
          console.log('Updated Model_ID to:', modelId, 'with Category_ID:', categoryIdForModel);
        }
      } catch (error) {
        console.warn('Could not update model:', error.message);
      }
    }

    // Handle Software update through bridge table (Software is not a column in ASSET table)
    if (updateData.Software !== undefined) {
      try {
        if (updateData.Software && updateData.Software.trim()) {
          if (updateData.Software.toLowerCase() !== 'none') {
            await Asset.linkSoftwareToAsset(id, updateData.Software.trim());
            console.log('Updated software link:', updateData.Software);
          } else {
            console.log('Software set to None - asset has no software');
          }
        }
      } catch (error) {
        console.warn('Could not update software link:', error.message);
      }
    }

    // Handle Customer and Branch update (these are in INVENTORY table via CUSTOMER)
    if (updateData.Customer_Name !== undefined || updateData.Branch !== undefined) {
      try {
        console.log('Updating customer/branch information');
        
        // Get the current inventory record for this asset
        const [inventoryRows] = await pool.execute(
          'SELECT Inventory_ID, Customer_ID FROM INVENTORY WHERE Asset_ID = ? LIMIT 1',
          [id]
        );
        
        if (inventoryRows.length > 0) {
          const inventoryRecord = inventoryRows[0];
          
          // Get or create customer record
          const customerName = updateData.Customer_Name || existingAsset.Customer_Name;
          const branch = updateData.Branch || existingAsset.Branch;
          
          if (customerName && branch) {
            // Check if customer exists with this name and branch
            const [customerRows] = await pool.execute(
              'SELECT Customer_ID FROM CUSTOMER WHERE Customer_Name = ? AND Branch = ?',
              [customerName, branch]
            );
            
            let customerId;
            if (customerRows.length > 0) {
              customerId = customerRows[0].Customer_ID;
              console.log('Found existing customer ID:', customerId);
            } else {
              // Create new customer record
              const [insertResult] = await pool.execute(
                'INSERT INTO CUSTOMER (Customer_Name, Branch) VALUES (?, ?)',
                [customerName, branch]
              );
              customerId = insertResult.insertId;
              console.log('Created new customer with ID:', customerId);
            }
            
            // Update inventory record with new customer ID
            await pool.execute(
              'UPDATE INVENTORY SET Customer_ID = ? WHERE Inventory_ID = ?',
              [customerId, inventoryRecord.Inventory_ID]
            );
            console.log('Updated inventory record with Customer_ID:', customerId);
          }
        }
      } catch (error) {
        console.error('Error updating customer/branch:', error);
        console.warn('Could not update customer/branch information:', error.message);
      }
    }

    // Handle Peripherals update
    let peripheralsUpdated = false;
    if (updateData.peripherals && Array.isArray(updateData.peripherals)) {
      try {
        console.log('Updating peripherals for asset:', id);
        console.log('Peripheral data received:', updateData.peripherals);
        
        // Get existing peripherals for this asset
        const [existingPeripherals] = await pool.execute(
          'SELECT Peripheral_ID FROM PERIPHERAL WHERE Asset_ID = ?',
          [id]
        );
        
        // Track which peripherals to keep (ones with IDs that we update)
        const peripheralsToKeep = new Set();
        
        // Process each peripheral from the request
        for (const peripheral of updateData.peripherals) {
          // Skip empty peripherals
          if (!peripheral.Peripheral_Type_Name && !peripheral.Serial_Code && !peripheral.Condition && !peripheral.Remarks) {
            continue;
          }
          
          // Get or create peripheral type
          let peripheralTypeId = null;
          if (peripheral.Peripheral_Type_Name) {
            const [typeRows] = await pool.execute(
              'SELECT Peripheral_Type_ID FROM PERIPHERAL_TYPE WHERE Peripheral_Type_Name = ?',
              [peripheral.Peripheral_Type_Name]
            );
            
            if (typeRows.length > 0) {
              peripheralTypeId = typeRows[0].Peripheral_Type_ID;
            } else {
              // Create new peripheral type if it doesn't exist
              const [insertResult] = await pool.execute(
                'INSERT INTO PERIPHERAL_TYPE (Peripheral_Type_Name) VALUES (?)',
                [peripheral.Peripheral_Type_Name]
              );
              peripheralTypeId = insertResult.insertId;
              console.log('Created new peripheral type:', peripheral.Peripheral_Type_Name, 'with ID:', peripheralTypeId);
            }
          }
          
          if (peripheral.Peripheral_ID) {
            // Update existing peripheral
            await pool.execute(
              `UPDATE PERIPHERAL 
               SET Peripheral_Type_ID = ?, Serial_Code = ?, \`Condition\` = ?, Remarks = ?
               WHERE Peripheral_ID = ? AND Asset_ID = ?`,
              [
                peripheralTypeId,
                peripheral.Serial_Code || null,
                peripheral.Condition || null,
                peripheral.Remarks || null,
                peripheral.Peripheral_ID,
                id
              ]
            );
            peripheralsToKeep.add(peripheral.Peripheral_ID);
            console.log('Updated peripheral ID:', peripheral.Peripheral_ID);
            peripheralsUpdated = true;
          } else {
            // Insert new peripheral
            const [insertResult] = await pool.execute(
              'INSERT INTO PERIPHERAL (Asset_ID, Peripheral_Type_ID, Serial_Code, `Condition`, Remarks) VALUES (?, ?, ?, ?, ?)',
              [
                id,
                peripheralTypeId,
                peripheral.Serial_Code || null,
                peripheral.Condition || null,
                peripheral.Remarks || null
              ]
            );
            peripheralsToKeep.add(insertResult.insertId);
            console.log('Created new peripheral with ID:', insertResult.insertId);
            peripheralsUpdated = true;
          }
        }
        
        // Delete peripherals that were removed (not in the update list)
        for (const existing of existingPeripherals) {
          if (!peripheralsToKeep.has(existing.Peripheral_ID)) {
            await pool.execute(
              'DELETE FROM PERIPHERAL WHERE Peripheral_ID = ?',
              [existing.Peripheral_ID]
            );
            console.log('Deleted peripheral ID:', existing.Peripheral_ID);
            peripheralsUpdated = true;
          }
        }
        
        console.log('Peripheral update completed successfully');
      } catch (error) {
        console.error('Error updating peripherals:', error);
        console.warn('Could not update peripherals:', error.message);
      }
    }

    console.log('Final update data:', finalUpdateData);

    // Ensure we have data to update (either asset fields or peripherals)
    if (Object.keys(finalUpdateData).length === 0 && !peripheralsUpdated) {
      console.log('No valid updates to apply');
      return res.status(400).json({
        error: 'No valid updates provided'
      });
    }

    // Detect changes for audit log
    let changes = [];
    
    // Update the asset properties if there are any changes
    if (Object.keys(finalUpdateData).length > 0) {
      Object.assign(existingAsset, finalUpdateData);
      changes = detectChanges(existingAsset, finalUpdateData);
    
      // Save the updated asset
      console.log('Executing update for Asset_ID:', existingAsset.Asset_ID);
      await existingAsset.update();
    }
    
    // Log the update if there are changes
    if (changes.length > 0) {
      const userId = req.user?.User_ID || req.user?.userId || 1;
      const username = req.user?.Username || req.user?.username || 'System';
      const assetSerial = existingAsset.Asset_Serial_Number;
      
      // Create description for each change
      for (const change of changes) {
        const description = `${username} change ${change.fieldName} for ${assetSerial} from ${change.oldValue} to ${change.newValue}`;
        await logAssetChange(
          userId,
          existingAsset.Asset_ID,
          'UPDATE',
          description,
          [change]
        );
      }
    }
    
    // Fetch the updated asset to return with joined data
    const updatedAsset = await Asset.findById(id);

    console.log('Asset updated successfully:', updatedAsset);

    // Verify the update was applied correctly
    if (updatedAsset) {
      const verificationLog = {};
      if (finalUpdateData.Asset_Serial_Number) verificationLog.Serial = `${existingAsset.Asset_Serial_Number} -> ${updatedAsset.Asset_Serial_Number}`;
      if (finalUpdateData.Recipients_ID) verificationLog.Recipient = `ID ${finalUpdateData.Recipients_ID} -> ${updatedAsset.Recipient_Name}`;
      if (finalUpdateData.Category_ID) verificationLog.Category = `ID ${finalUpdateData.Category_ID} -> ${updatedAsset.Category}`;
      if (finalUpdateData.Model_ID) verificationLog.Model = `ID ${finalUpdateData.Model_ID} -> ${updatedAsset.Model}`;
      
      console.log('Update verification:', verificationLog);
    }

    logger.info(`Asset updated: ID ${id} by user ${req.user?.userId || 'unknown'}`);

    res.status(200).json(updatedAsset);
  } catch (error) {
    logger.error('Error in updateAssetById:', error);
    console.error('Error updating asset:', error);
    res.status(500).json({
      error: 'Failed to update asset',
      message: error.message
    });
  }
};

/**
 * Update asset
 */
const updateAsset = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;
    const updateData = req.body;

    // Check if asset exists
    const existingAsset = await Asset.findBySerialNumber(serialNumber);
    if (!existingAsset) {
      return res.status(404).json(
        formatResponse(false, null, 'Asset not found')
      );
    }

    const success = await Asset.update(serialNumber, updateData);
    if (!success) {
      return res.status(400).json(
        formatResponse(false, null, 'Failed to update asset')
      );
    }

    const updatedAsset = await Asset.findBySerialNumber(serialNumber);

    logger.info(`Asset updated: ${serialNumber} by user ${req.user?.userId}`);

    res.status(200).json(
      formatResponse(true, updatedAsset, 'Asset updated successfully')
    );
  } catch (error) {
    logger.error('Error in updateAsset:', error);
    next(error);
  }
};

/**
 * Delete asset
 */
const deleteAsset = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;

    // Check if asset exists
    const existingAsset = await Asset.findBySerialNumber(serialNumber);
    if (!existingAsset) {
      return res.status(404).json(
        formatResponse(false, null, 'Asset not found')
      );
    }

    const success = await Asset.delete(serialNumber);
    if (!success) {
      return res.status(400).json(
        formatResponse(false, null, 'Failed to delete asset')
      );
    }

    // Log the deletion
    const userId = req.user?.User_ID || req.user?.userId || 1;
    const username = req.user?.Username || req.user?.username || 'System';
    await logAssetChange(
      userId,
      existingAsset.Asset_ID,
      'DELETE',
      `${username} deleted Asset ${serialNumber}`,
      []
    );

    logger.info(`Asset deleted: ${serialNumber} by user ${req.user?.userId}`);

    res.status(200).json(
      formatResponse(true, null, 'Asset deleted successfully')
    );
  } catch (error) {
    logger.error('Error in deleteAsset:', error);
    next(error);
  }
};

/**
 * Delete asset by ID (with cascade deletion of peripherals and PM records)
 */
const deleteAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Delete request received for Asset_ID: ${id}`);

    // Check if asset exists and get its details
    const existingAsset = await Asset.findById(id);
    if (!existingAsset) {
      console.log(`Asset not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    console.log(`Found asset: ${existingAsset.Asset_Serial_Number}`);

    // Delete asset (this will cascade delete peripherals and PM records due to foreign key constraints)
    const result = await Asset.deleteById(id);
    
    if (!result.success) {
      console.error(`Failed to delete asset: ${result.error}`);
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to delete asset'
      });
    }

    logger.info(`Asset deleted: ID ${id}, Serial: ${existingAsset.Asset_Serial_Number}, Peripherals: ${result.peripheralsDeleted}, PM Records: ${result.pmRecordsDeleted}`);

    res.status(200).json({
      success: true,
      message: 'Asset and related records deleted successfully',
      data: {
        asset_id: id,
        serial_number: existingAsset.Asset_Serial_Number,
        peripherals_deleted: result.peripheralsDeleted,
        pm_records_deleted: result.pmRecordsDeleted,
        inventory_updated: result.inventoryUpdated
      }
    });
  } catch (error) {
    logger.error('Error in deleteAssetById:', error);
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete asset',
      message: error.message
    });
  }
};

/**
 * Get asset statistics for dashboard
 */
const getAssetStatistics = async (req, res, next) => {
  try {
    console.log('=== getAssetStatistics CONTROLLER CALLED ===');
    
    const Project = require('../models/Project');
    
    const statistics = await Asset.getStatistics();
    console.log('Statistics from Asset.getStatistics():', statistics);
    
    const projectStats = await Project.getStatistics();
    console.log('Project statistics:', projectStats);
    
    // Add project count as total customers (1 project = 1 customer)
    statistics.totalProjects = projectStats.total;

    console.log('Final statistics to send:', statistics);

    res.status(200).json(
      formatResponse(true, statistics, 'Asset statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Error in getAssetStatistics:', error);
    
    // Return proper error instead of mock data
    res.status(500).json(
      formatResponse(false, null, 'Failed to fetch asset statistics from database', { error: error.message })
    );
  }
};

/**
 * Helper function to process new asset creation in bulk
 */
const processNewAssets = async (assets) => {
  const results = {
    imported: 0,
    failed: 0,
    errors: []
  };

  for (const assetData of assets) {
    try {
      // Check if asset already exists
      const existingAsset = await Asset.findBySerialNumber(assetData.serial_number);
      if (existingAsset) {
        results.failed++;
        results.errors.push({
          serial_number: assetData.serial_number,
          error: 'Asset with this serial number already exists'
        });
        continue;
      }

      // Get or create recipient
      let recipientId = null;
      console.log(`   📋 Recipient data check:`, {
        recipient_name: assetData.recipient_name,
        department: assetData.department,
        department_name: assetData.department_name,
        position: assetData.position
      });
      
      if (assetData.recipient_name && assetData.recipient_name.trim() !== '') {
        try {
          const department = assetData.department_name || assetData.department || 'N/A';
          const position = assetData.position || 'N/A';
          
          console.log(`   👤 Creating recipient with: Name="${assetData.recipient_name}", Dept="${department}", Position="${position}"`);
          
          recipientId = await Asset.createRecipient(
            assetData.recipient_name.trim(),
            department,
            position
          );
          
          console.log(`   ✅ Recipient assigned: ID=${recipientId}, Name="${assetData.recipient_name}"`);
        } catch (recipientError) {
          console.error(`   ❌ Failed to create recipient:`, recipientError);
          console.error(`   Error details:`, recipientError.message);
          // Continue without recipient - asset can be created without one
        }
      } else {
        console.log(`   ⏭️  No recipient name provided, skipping recipient creation`);
      }

      // Get or create category (auto-creates new if not exists)
      let categoryId = null;
      if (assetData.category) {
        try {
          categoryId = await Asset.getOrCreateCategory(assetData.category);
          console.log(`   📦 Category ID: ${categoryId}`);
        } catch (categoryError) {
          console.log(`   ⚠️  Failed to get/create category: ${categoryError.message}`);
        }
      }

      // Get or create model (auto-creates new if not exists) - LINKED TO CATEGORY
      let modelId = null;
      if (assetData.model) {
        try {
          // Pass categoryId to link model with category
          modelId = await Asset.getOrCreateModel(assetData.model, categoryId);
          console.log(`   🏷️  Model ID: ${modelId} (linked to Category ID: ${categoryId})`);
        } catch (modelError) {
          console.log(`   ⚠️  Failed to get/create model: ${modelError.message}`);
        }
      }

      // Link software to asset (auto-creates new if not exists)
      // Special handling: 'None' means no software (don't link anything)
      let softwareToLink = null;
      let hasNoSoftware = false;
      if (assetData.software) {
        if (assetData.software.toLowerCase() === 'none') {
          hasNoSoftware = true;
          console.log(`   💿 Software set to None - asset has no software`);
        } else {
          softwareToLink = assetData.software;
          console.log(`   💿 Software to link: ${softwareToLink}`);
        }
      }

      // Create the asset
      const assetToCreate = {
        Asset_Serial_Number: assetData.serial_number,
        Asset_Tag_ID: assetData.tag_id,
        Item_Name: assetData.item_name,
        Status: assetData.status || 'Active',
        Recipients_ID: recipientId,
        Category_ID: categoryId,
        Model_ID: modelId,
        Windows: assetData.windows || null,
        Microsoft_Office: assetData.microsoft_office || null,
        Monthly_Prices: assetData.monthly_prices || null
      };

      console.log(`   📦 Creating asset with data:`, {
        Serial: assetToCreate.Asset_Serial_Number,
        Recipients_ID: assetToCreate.Recipients_ID,
        Category_ID: assetToCreate.Category_ID,
        Model_ID: assetToCreate.Model_ID,
        Windows: assetToCreate.Windows,
        Microsoft_Office: assetToCreate.Microsoft_Office,
        Monthly_Prices: assetToCreate.Monthly_Prices
      });
      
      console.log(`   🔍 Raw field values from assetData:`, {
        windows: assetData.windows,
        microsoft_office: assetData.microsoft_office,
        monthly_prices: assetData.monthly_prices
      });

      const newAsset = await Asset.create(assetToCreate);
      console.log(`   ✅ Asset created: ID=${newAsset.Asset_ID}, Recipients_ID=${newAsset.Recipients_ID}`);
      
      // Verify recipient was saved
      if (recipientId && !newAsset.Recipients_ID) {
        console.error(`   ⚠️  WARNING: Recipient ID ${recipientId} was not saved to asset!`);
      }

      // Link software to asset via bridge table
      if (softwareToLink) {
        try {
          await Asset.linkSoftwareToAsset(newAsset.Asset_ID, softwareToLink);
          console.log(`   💿 Linked software: ${softwareToLink}`);
        } catch (softwareError) {
          console.log(`   ⚠️  Failed to link software: ${softwareError.message}`);
        }
      }

      // Create peripherals if provided - split comma-separated values
      if (assetData.peripherals && Array.isArray(assetData.peripherals)) {
        console.log(`   🔧 Creating ${assetData.peripherals.length} peripheral(s)...`);
        for (const peripheral of assetData.peripherals) {
          // Split comma-separated peripheral names and serial codes
          const peripheralNames = peripheral.peripheral_name ? 
            String(peripheral.peripheral_name).split(',').map(s => s.trim()).filter(s => s) : [];
          const serialCodes = peripheral.serial_code ? 
            String(peripheral.serial_code).split(',').map(s => s.trim()).filter(s => s) : [];
          
          // If single peripheral (no commas), add as-is
          if (peripheralNames.length <= 1 && serialCodes.length <= 1) {
            if (peripheral.peripheral_name) {
              try {
                const peripheralId = await Asset.createPeripheral(
                  newAsset.Asset_ID,
                  peripheral.peripheral_name,
                  peripheral.serial_code || null,
                  peripheral.condition || 'Good',
                  peripheral.remarks || null
                );
                console.log(`   ✅ Created peripheral: ${peripheral.peripheral_name} (ID: ${peripheralId}, Serial: ${peripheral.serial_code || 'N/A'})`);
              } catch (pError) {
                console.log(`   ⚠️  Failed to create peripheral ${peripheral.peripheral_name}: ${pError.message}`);
              }
            }
          } else {
            // Split into multiple peripherals
            const maxLength = Math.max(peripheralNames.length, serialCodes.length);
            for (let i = 0; i < maxLength; i++) {
              const newPeripheral = {
                peripheral_name: null,
                serial_code: null,
                condition: peripheral.condition || 'Good',
                remarks: peripheral.remarks || null
              };
              
              if (i < peripheralNames.length && peripheralNames[i]) {
                newPeripheral.peripheral_name = peripheralNames[i];
              }
              
              if (i < serialCodes.length && serialCodes[i]) {
                newPeripheral.serial_code = serialCodes[i];
              }
              
              if (newPeripheral.peripheral_name) {
                try {
                  const peripheralId = await Asset.createPeripheral(
                    newAsset.Asset_ID,
                    newPeripheral.peripheral_name,
                    newPeripheral.serial_code || null,
                    newPeripheral.condition,
                    newPeripheral.remarks
                  );
                  console.log(`   ✅ Created peripheral: ${newPeripheral.peripheral_name} (ID: ${peripheralId}, Serial: ${newPeripheral.serial_code || 'N/A'})`);
                } catch (pError) {
                  console.log(`   ⚠️  Failed to create peripheral ${newPeripheral.peripheral_name}: ${pError.message}`);
                }
              }
            }
          }
        }
      }

      // Link to project/customer via inventory
      if (assetData.project_ref_num && assetData.customer_name && assetData.branch) {
        try {
          const inventoryId = await Asset.linkToProject(
            newAsset.Asset_ID,
            assetData.project_ref_num,
            assetData.customer_name,
            assetData.branch
          );
          console.log(`   🔗 Linked asset ${assetData.serial_number} to project ${assetData.project_ref_num} (Inventory_ID: ${inventoryId})`);
        } catch (linkError) {
          console.log(`   ❌ CRITICAL: Failed to link to project: ${linkError.message}`);
          console.log(`   ⚠️  Asset created but orphaned - will not appear in asset list`);
          console.log(`   📋 Project data: ref=${assetData.project_ref_num}, customer=${assetData.customer_name}, branch=${assetData.branch}`);
          // This is critical - asset won't show in the list without inventory link
          throw new Error(`Failed to link asset to project: ${linkError.message}`);
        }
      } else {
        console.log(`   ⚠️  Missing project data - asset will be orphaned`);
        console.log(`   📋 Provided: project_ref_num=${assetData.project_ref_num}, customer_name=${assetData.customer_name}, branch=${assetData.branch}`);
        throw new Error('Cannot create asset without project link - project_ref_num, customer_name, and branch are required');
      }

      results.imported++;
      console.log(`   ✅ Created asset: ${assetData.serial_number}`);
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        serial_number: assetData.serial_number || 'Unknown',
        error: error.message
      });
      console.error(`   ❌ Failed to create asset ${assetData.serial_number}:`, error.message);
    }
  }

  return results;
};

/**
 * Validate import data and detect new options that will be created
 * @route POST /api/v1/assets/validate-import
 */
const validateImportData = async (req, res, next) => {
  try {
    const { assets } = req.body;

    console.log('=== Validate Import Data Request ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Assets received:', assets ? `${assets.length} items` : 'null/undefined');
    
    if (!Array.isArray(assets) || assets.length === 0) {
      console.log('❌ Validation failed: assets is not a valid array');
      return res.status(400).json({
        success: false,
        error: 'Assets array is required'
      });
    }

    // Log first asset structure for debugging
    if (assets.length > 0) {
      console.log('First asset structure:', JSON.stringify(assets[0], null, 2));
    }

    console.log(`✓ Validating import data for ${assets.length} assets...`);

    const { pool } = require('../config/database');
    const newOptions = {
      categories: new Set(),
      models: new Set(),
      software: new Set(),
      windows: new Set(),
      office: new Set(),
      peripheralTypes: new Set()
    };

    // Get existing options from database
    console.log('Fetching existing categories...');
    const [existingCategories] = await pool.execute(
      'SELECT DISTINCT Category FROM CATEGORY WHERE Category IS NOT NULL'
    );
    console.log(`✓ Found ${existingCategories.length} categories`);
    
    console.log('Fetching existing models...');
    const [existingModels] = await pool.execute(
      'SELECT DISTINCT Model_Name FROM MODEL WHERE Model_Name IS NOT NULL'
    );
    console.log(`✓ Found ${existingModels.length} models`);
    
    console.log('Fetching existing software...');
    const [existingSoftware] = await pool.execute(
      'SELECT DISTINCT Software_Name FROM SOFTWARE WHERE Software_Name IS NOT NULL'
    );
    console.log(`✓ Found ${existingSoftware.length} software`);
    
    console.log('Fetching existing peripheral types...');
    const [existingPeripheralTypes] = await pool.execute(
      'SELECT DISTINCT Peripheral_Type_Name FROM PERIPHERAL_TYPE WHERE Peripheral_Type_Name IS NOT NULL'
    );
    console.log(`✓ Found ${existingPeripheralTypes.length} peripheral types`);
    
    console.log('Fetching existing Windows versions...');
    const [existingWindows] = await pool.execute(
      'SELECT DISTINCT Windows FROM ASSET WHERE Windows IS NOT NULL AND Windows != ""'
    );
    console.log(`✓ Found ${existingWindows.length} Windows versions`);
    
    console.log('Fetching existing Office versions...');
    const [existingOffice] = await pool.execute(
      'SELECT DISTINCT Microsoft_Office FROM ASSET WHERE Microsoft_Office IS NOT NULL AND Microsoft_Office != ""'
    );
    console.log(`✓ Found ${existingOffice.length} Office versions`);

    console.log('Processing existing data into sets...');
    const existingCategoryNames = new Set(existingCategories.map(c => c.Category.toLowerCase()));
    const existingModelNames = new Set(existingModels.map(m => m.Model_Name.toLowerCase()));
    const existingSoftwareNames = new Set(existingSoftware.map(s => s.Software_Name.toLowerCase()));
    const existingPeripheralTypeNames = new Set(existingPeripheralTypes.map(pt => pt.Peripheral_Type_Name.toLowerCase()));
    const existingWindowsVersions = new Set(existingWindows.map(w => w.Windows.toLowerCase()));
    const existingOfficeVersions = new Set(existingOffice.map(o => o.Microsoft_Office.toLowerCase()));

    console.log('Checking assets for new options...');
    // Check each asset for new options
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      
      try {
        // Check category - only if value exists and is not empty
        if (asset.category && typeof asset.category === 'string' && asset.category.trim() !== '') {
          const categoryName = asset.category.trim();
          if (!existingCategoryNames.has(categoryName.toLowerCase())) {
            newOptions.categories.add(categoryName);
          }
        }

        // Check model - only if value exists and is not empty
        if (asset.model && typeof asset.model === 'string' && asset.model.trim() !== '') {
          const modelName = asset.model.trim();
          if (!existingModelNames.has(modelName.toLowerCase())) {
            newOptions.models.add(modelName);
          }
        }

        // Check software - only if value exists and is not empty and not 'None'
        if (asset.software && typeof asset.software === 'string' && asset.software.trim() !== '' && asset.software.trim().toLowerCase() !== 'none') {
          const softwareName = asset.software.trim();
          if (!existingSoftwareNames.has(softwareName.toLowerCase())) {
            newOptions.software.add(softwareName);
          }
        }

        // Check Windows - only if value exists and is not empty
        if (asset.windows && typeof asset.windows === 'string' && asset.windows.trim() !== '') {
          const windowsVersion = asset.windows.trim();
          if (!existingWindowsVersions.has(windowsVersion.toLowerCase())) {
            newOptions.windows.add(windowsVersion);
          }
        }

        // Check Microsoft Office - only if value exists and is not empty
        if (asset.microsoft_office && typeof asset.microsoft_office === 'string' && asset.microsoft_office.trim() !== '') {
          const officeVersion = asset.microsoft_office.trim();
          if (!existingOfficeVersions.has(officeVersion.toLowerCase())) {
            newOptions.office.add(officeVersion);
          }
        }
        
        // Check peripheral types if asset has peripherals
        if (asset.peripherals && Array.isArray(asset.peripherals)) {
          asset.peripherals.forEach(peripheral => {
            if (peripheral.peripheral_name && typeof peripheral.peripheral_name === 'string') {
              // Split comma-separated peripheral names
              const peripheralNames = String(peripheral.peripheral_name).split(',').map(s => s.trim()).filter(s => s);
              peripheralNames.forEach(name => {
                if (name && !existingPeripheralTypeNames.has(name.toLowerCase())) {
                  newOptions.peripheralTypes.add(name);
                }
              });
            }
          });
        }
      } catch (assetError) {
        console.error(`Error validating asset at index ${i}:`, assetError);
        console.error('Asset data:', JSON.stringify(asset, null, 2));
        // Continue with other assets - don't fail entire validation
      }
    }

    // Convert sets to arrays for response
    const newOptionsFound = {
      categories: Array.from(newOptions.categories),
      models: Array.from(newOptions.models),
      software: Array.from(newOptions.software),
      windows: Array.from(newOptions.windows),
      office: Array.from(newOptions.office),
      peripheralTypes: Array.from(newOptions.peripheralTypes)
    };

    const totalNewOptions = 
      newOptionsFound.categories.length +
      newOptionsFound.models.length +
      newOptionsFound.software.length +
      newOptionsFound.windows.length +
      newOptionsFound.office.length +
      newOptionsFound.peripheralTypes.length;
      newOptionsFound.office.length;

    console.log(`Validation complete: ${totalNewOptions} new options detected`);
    console.log('New options breakdown:', {
      categories: newOptionsFound.categories,
      models: newOptionsFound.models,
      software: newOptionsFound.software,
      windows: newOptionsFound.windows,
      office: newOptionsFound.office,
      peripheralTypes: newOptionsFound.peripheralTypes
    });

    res.status(200).json({
      success: true,
      hasNewOptions: totalNewOptions > 0,
      newOptions: newOptionsFound,
      summary: {
        totalAssets: assets.length,
        newCategories: newOptionsFound.categories.length,
        newModels: newOptionsFound.models.length,
        newSoftware: newOptionsFound.software.length,
        newWindows: newOptionsFound.windows.length,
        newOffice: newOptionsFound.office.length,
        newPeripheralTypes: newOptionsFound.peripheralTypes.length,
        totalNewOptions: totalNewOptions
      }
    });

  } catch (error) {
    // Force immediate console output
    const errorMessage = `VALIDATION ERROR: ${error.message}`;
    const errorStack = error.stack || 'No stack trace available';
    
    console.error('\n' + '='.repeat(80));
    console.error('❌ ERROR IN VALIDATE IMPORT DATA');
    console.error('='.repeat(80));
    console.error('Error Message:', errorMessage);
    console.error('Error Stack:', errorStack);
    console.error('='.repeat(80) + '\n');
    
    // Also log to ensure it's written immediately
    process.stderr.write(`\n[ERROR] ${errorMessage}\n${errorStack}\n\n`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate import data',
      message: error.message,
      stack: errorStack,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Bulk import assets with comprehensive validation and processing
 * Supports two modes:
 * 1. Create new assets (default)
 * 2. Add peripherals to existing assets (when assets already exist)
 */
const bulkImportAssets = async (req, res, next) => {
  try {
    const { assets, importMode } = req.body; // importMode can be 'auto', 'new_assets', or 'add_peripherals'

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Assets array is required',
        imported: 0,
        failed: 0
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Starting bulk import of ${assets.length} assets...`);
    console.log(`Import Mode: ${importMode || 'auto'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Convert flat peripheral fields to peripherals array if needed
    console.log('🔄 Converting flat peripheral fields to array structure...');
    assets.forEach((asset, idx) => {
      if (!asset.peripherals && (asset.peripheral_name || asset.serial_code)) {
        console.log(`  Asset ${idx + 1} (${asset.serial_number}): Converting flat fields to peripherals array`);
        
        // Split comma-separated values
        const peripheralNames = asset.peripheral_name ? 
          String(asset.peripheral_name).split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'none') : [];
        const serialCodes = asset.serial_code ? 
          String(asset.serial_code).split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'none') : [];
        
        // Only create peripherals array if we have valid data
        if (peripheralNames.length > 0 || serialCodes.length > 0) {
          // Create peripherals array
          asset.peripherals = [];
          const maxLength = Math.max(peripheralNames.length, serialCodes.length);
          
          for (let i = 0; i < maxLength; i++) {
            const peripheral = {};
            
            if (i < peripheralNames.length && peripheralNames[i]) {
              peripheral.peripheral_name = peripheralNames[i];
            }
            
            if (i < serialCodes.length && serialCodes[i]) {
              peripheral.serial_code = serialCodes[i];
            }
            
            // Only add if we have at least a peripheral name
            if (peripheral.peripheral_name) {
              asset.peripherals.push(peripheral);
              console.log(`    → Peripheral ${i + 1}: ${peripheral.peripheral_name || 'N/A'} (${peripheral.serial_code || 'N/A'})`);
            }
          }
          
          console.log(`    ✅ Created peripherals array with ${asset.peripherals.length} items`);
        } else {
          console.log(`    ⏭️  Skipping - no valid peripheral data (all N/A or None)`);
        }
        
        // Remove flat fields to avoid confusion
        delete asset.peripheral_name;
        delete asset.serial_code;
      }
    });
    console.log('✅ Peripheral field conversion complete\n');

    const ImportModeDetector = require('../utils/importModeDetector');
    const PeripheralImporter = require('../utils/peripheralImporter');

    // Detect import mode if not explicitly specified
    let detectedMode = importMode || 'auto';
    let modeAnalysis = null;
    
    if (detectedMode === 'auto') {
      console.log('🔍 Running import mode detection...');
      modeAnalysis = await ImportModeDetector.detectImportMode(assets);
      detectedMode = modeAnalysis.mode;
      
      const recommendations = ImportModeDetector.getImportRecommendations(modeAnalysis);
      console.log('\n📋 Import Recommendations:');
      recommendations.suggestions.forEach(s => console.log(`   ℹ️  ${s}`));
      recommendations.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
      recommendations.requiredActions.forEach(a => console.log(`   ⚡ ${a}`));
      console.log('');
    }

    const results = {
      imported: 0,
      failed: 0,
      peripheralsAdded: 0,
      assetsCreated: 0,
      errors: [],
      warnings: [],
      mode: detectedMode,
      modeAnalysis: modeAnalysis
    };

    // Handle different import modes
    if (detectedMode === 'add_peripherals' || detectedMode === 'mixed') {
      // Separate rows by action
      const separated = modeAnalysis 
        ? ImportModeDetector.separateRowsByAction(assets, modeAnalysis)
        : { createAssets: [], addPeripherals: assets, skip: [] };
      
      console.log(`\n📦 Import Strategy:`);
      console.log(`   Create New Assets: ${separated.createAssets.length}`);
      console.log(`   Add Peripherals to Existing: ${separated.addPeripherals.length}`);
      console.log(`   Skip: ${separated.skip.length}\n`);
      
      // Handle peripheral-only imports
      if (separated.addPeripherals.length > 0) {
        console.log(`\n🔧 Adding peripherals to existing assets...`);
        const peripheralResults = await PeripheralImporter.addPeripheralsToExistingAssets(
          separated.addPeripherals
        );
        
        results.peripheralsAdded = peripheralResults.success;
        results.failed += peripheralResults.failed;
        results.errors.push(...peripheralResults.errors);
        results.warnings.push(...peripheralResults.warnings);
        results.imported += peripheralResults.success;
        
        // Track duplicate count
        if (peripheralResults.duplicates > 0) {
          results.duplicates = peripheralResults.duplicates;
        }
      }
      
      // Handle new asset creation if in mixed mode
      if (separated.createAssets.length > 0) {
        console.log(`\n📝 Creating new assets...`);
        const createResults = await processNewAssets(separated.createAssets);
        results.assetsCreated = createResults.imported;
        results.failed += createResults.failed;
        results.errors.push(...createResults.errors);
        results.imported += createResults.imported;
      }
      
      // Log final results
      const finalMessage = `Bulk import completed: ${results.imported} total (${results.assetsCreated} new assets, ${results.peripheralsAdded} peripheral additions), ${results.failed} failed${results.duplicates ? `, ${results.duplicates} duplicates skipped` : ''}`;
      console.log(`\n${finalMessage}`);
      logger.info(finalMessage);
      
      return res.status(200).json({
        success: results.imported > 0,
        message: finalMessage,
        imported: results.imported,
        assetsCreated: results.assetsCreated,
        peripheralsAdded: results.peripheralsAdded,
        failed: results.failed,
        duplicates: results.duplicates || 0,
        errors: results.errors.slice(0, 50),
        warnings: results.warnings.slice(0, 50),
        total: assets.length,
        mode: results.mode,
        modeAnalysis: results.modeAnalysis
      });
    }
    
    // Default mode: Create new assets only (original behavior)
    console.log(`\n📝 Creating new assets (default mode)...`);

    // Process assets in batches for better performance
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < assets.length; i += BATCH_SIZE) {
      batches.push(assets.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;

    for (const batch of batches) {
      const batchPromises = batch.map(async (assetData, index) => {
        const rowNumber = processedCount + index + 1;
        
        try {
          console.log(`Processing asset ${rowNumber}: ${assetData.serial_number}`);
          console.log(`   🔍 Full assetData received:`, {
            windows: assetData.windows,
            microsoft_office: assetData.microsoft_office,
            monthly_prices: assetData.monthly_prices,
            department: assetData.department,
            department_name: assetData.department_name,
            position: assetData.position
          });
          
          // Validate required fields (accept both field name formats)
          const projectRefNum = assetData.project_reference_num || assetData.project_ref_num;
          const requiredFields = [
            { value: projectRefNum, name: 'project_reference_num or project_ref_num' },
            { value: assetData.serial_number, name: 'serial_number' },
            { value: assetData.tag_id, name: 'tag_id' },
            { value: assetData.item_name, name: 'item_name' }
          ];
          
          for (const field of requiredFields) {
            if (!field.value || String(field.value).trim() === '') {
              throw new Error(`Missing required field: ${field.name}`);
            }
          }

          // Check for duplicate serial number in database (only in new_assets mode)
          const existingBySerial = await Asset.findBySerialNumber(assetData.serial_number);
          if (existingBySerial && detectedMode === 'new_assets') {
            throw new Error(`Asset with serial number '${assetData.serial_number}' already exists`);
          }

          // Check for duplicate tag ID (you'd need to implement this check in Asset model)
          // For now, we'll skip this check but it should be added

          // Convert flat peripheral fields to array if needed
          if (!assetData.peripherals && (assetData.peripheral_name || assetData.serial_code)) {
            console.log(`Converting flat peripheral fields for ${assetData.serial_number}...`);
            const peripheralNames = assetData.peripheral_name ? 
              String(assetData.peripheral_name).split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'none') : [];
            const serialCodes = assetData.serial_code ? 
              String(assetData.serial_code).split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'none') : [];
            
            assetData.peripherals = [];
            const maxLength = Math.max(peripheralNames.length, serialCodes.length);
            for (let i = 0; i < maxLength; i++) {
              const peripheral = {};
              if (i < peripheralNames.length && peripheralNames[i]) {
                peripheral.peripheral_name = peripheralNames[i];
              }
              if (i < serialCodes.length && serialCodes[i]) {
                peripheral.serial_code = serialCodes[i];
              }
              if (peripheral.peripheral_name) {
                assetData.peripherals.push(peripheral);
              }
            }
            console.log(`✅ Converted to ${assetData.peripherals.length} peripherals`);
          }

          // Process peripherals - split comma-separated values into individual peripherals
          let processedPeripherals = [];
          if (assetData.peripherals && Array.isArray(assetData.peripherals)) {
            console.log(`Processing ${assetData.peripherals.length} peripheral entries for ${assetData.serial_number}...`);
            console.log(`📦 Original assetData.peripherals:`, JSON.stringify(assetData.peripherals, null, 2));
            
            assetData.peripherals.forEach((peripheral, idx) => {
              // Check if peripheral has comma-separated values
              const peripheralNames = peripheral.peripheral_name ? 
                String(peripheral.peripheral_name).split(',').map(s => s.trim()).filter(s => s) : [];
              const serialCodes = peripheral.serial_code ? 
                String(peripheral.serial_code).split(',').map(s => s.trim()).filter(s => s) : [];
              
              // If single peripheral (no commas), add as-is
              if (peripheralNames.length <= 1 && serialCodes.length <= 1) {
                processedPeripherals.push(peripheral);
                console.log(`  Peripheral ${idx + 1}: ${peripheral.peripheral_name || 'N/A'} (${peripheral.serial_code || 'N/A'})`);
              } else {
                // Split into multiple peripherals
                console.log(`  Splitting peripheral ${idx + 1}: "${peripheral.peripheral_name}" / "${peripheral.serial_code}"`);
                const maxLength = Math.max(peripheralNames.length, serialCodes.length);
                for (let i = 0; i < maxLength; i++) {
                  const newPeripheral = {};
                  
                  if (i < peripheralNames.length && peripheralNames[i]) {
                    newPeripheral.peripheral_name = peripheralNames[i];
                  }
                  
                  if (i < serialCodes.length && serialCodes[i]) {
                    newPeripheral.serial_code = serialCodes[i];
                  }
                  
                  // Copy other fields from original peripheral
                  if (peripheral.condition) newPeripheral.condition = peripheral.condition;
                  if (peripheral.remarks) newPeripheral.remarks = peripheral.remarks;
                  
                  if (Object.keys(newPeripheral).length > 0) {
                    processedPeripherals.push(newPeripheral);
                    console.log(`    → Split to: ${newPeripheral.peripheral_name || 'N/A'} (${newPeripheral.serial_code || 'N/A'})`);
                  }
                }
              }
            });
            
            console.log(`✅ Processed into ${processedPeripherals.length} individual peripherals`);
          }

          // Set default values
          const processedAsset = {
            project_reference_num: String(assetData.project_reference_num || assetData.project_ref_num || '').trim(),
            customer_name: assetData.customer_name || '',
            customer_reference_number: assetData.customer_reference_number || '',
            branch: assetData.branch || '',
            serial_number: String(assetData.serial_number).trim(),
            tag_id: String(assetData.tag_id).trim(),
            item_name: String(assetData.item_name).trim(),
            category: assetData.category || 'Uncategorized',
            model: assetData.model || 'Unknown',
            status: assetData.status || 'Active',
            recipient_name: assetData.recipient_name || '',
            department_name: assetData.department_name || assetData.department || '',
            position: assetData.position || '',
            windows: assetData.windows || null,
            microsoft_office: assetData.microsoft_office || null,
            monthly_prices: assetData.monthly_prices || null,
            peripherals: processedPeripherals
          };

          // Use the existing createAssetWithDetails method for comprehensive asset creation
          console.log(`Creating asset with details for row ${rowNumber}...`);
          console.log(`Peripheral data being passed:`, JSON.stringify(processedPeripherals, null, 2));
          
          // Call the existing detailed asset creation method
          const mockReq = {
            body: processedAsset
          };
          
          let assetCreated = false;
          let assetCreationError = null;
          
          const mockRes = {
            status: (code) => ({
              json: (data) => {
                if (code === 201 && data.success) {
                  assetCreated = true;
                  console.log(`✅ Asset ${rowNumber} created successfully with ${data.data?.peripherals?.length || 0} peripherals`);
                  return data;
                } else if (code >= 400) {
                  assetCreationError = data.error || data.message || 'Unknown error during asset creation';
                  console.error(`❌ Asset creation returned error status ${code}:`, assetCreationError);
                  return data;
                } else {
                  // Unexpected status code
                  console.log(`⚠️  Unexpected status code ${code} during asset creation`);
                  return data;
                }
              }
            })
          };

          // Use the existing createAssetWithDetails function
          try {
            await createAssetWithDetails(mockReq, mockRes, (error) => {
              if (error) {
                assetCreationError = error.message || 'Unknown error in next middleware';
                console.error('Error passed to next():', assetCreationError);
              }
            });
          } catch (createError) {
            // Catch any unhandled errors from createAssetWithDetails
            assetCreationError = createError.message || 'Unhandled error during asset creation';
            console.error('Unhandled error in createAssetWithDetails:', createError);
          }

          if (assetCreationError) {
            throw new Error(assetCreationError);
          }

          if (assetCreated) {
            return { success: true, row: rowNumber };
          } else {
            throw new Error('Failed to create asset - no success response received');
          }

        } catch (error) {
          console.error(`❌ Failed to process asset ${rowNumber}:`, error.message);
          return {
            success: false,
            row: rowNumber,
            serial_number: assetData.serial_number,
            error: error.message
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Aggregate results
      batchResults.forEach(result => {
        if (result.success) {
          results.imported++;
        } else {
          results.failed++;
          results.errors.push({
            row: result.row,
            serial_number: result.serial_number,
            error: result.error
          });
        }
      });

      processedCount += batch.length;
      console.log(`Processed batch: ${processedCount}/${assets.length}`);
    }

    results.assetsCreated = results.imported;
    const finalMessage = `Bulk import completed: ${results.imported} new assets created, ${results.failed} failed`;
    console.log(`\n${finalMessage}`);
    logger.info(finalMessage);

    // Return response
    res.status(200).json({
      success: results.imported > 0,
      message: finalMessage,
      imported: results.imported,
      assetsCreated: results.imported,
      peripheralsAdded: 0,
      failed: results.failed,
      errors: results.errors.slice(0, 50), // Limit errors to first 50
      total: assets.length,
      mode: detectedMode
    });

  } catch (error) {
    console.error('Error in bulkImportAssets:', error);
    logger.error('Error in bulkImportAssets:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during bulk import',
      message: error.message,
      imported: 0,
      failed: 0
    });
  }
};

/**
 * Fix orphaned assets (assets not linked to inventory)
 */
const fixOrphanedAssets = async (req, res, next) => {
  try {
    console.log('Manual trigger: Checking orphaned assets...');
    
    const result = await Asset.fixOrphanedAssets();
    
    res.status(200).json({
      success: true,
      message: `Found ${result.orphaned} orphaned assets - Manual assignment required (no auto-fix to prevent default customer assignment)`,
      orphaned_count: result.orphaned,
      fixed_count: result.fixed,
      note: 'Orphaned assets are no longer auto-assigned to default customers to preserve data integrity'
    });
  } catch (error) {
    console.error('Error in fixOrphanedAssets:', error);
    logger.error('Error in fixOrphanedAssets:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check orphaned assets'
    });
  }
};

module.exports = {
  getAllAssets,
  getAssetById,
  getAssetBySerialNumber,
  getAssetDetail,
  createAsset,
  createAssetWithDetails,
  updateAsset,
  updateAssetById,
  deleteAsset,
  deleteAssetById,
  getAssetStatistics,
  validateImportData,
  bulkImportAssets,
  fixOrphanedAssets
};