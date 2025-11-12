/**
 * Peripheral-Only Import Handler
 * 
 * Handles adding peripherals to existing assets without creating duplicates
 */

const Asset = require('../models/Asset');
const logger = require('./logger');

class PeripheralImporter {
  /**
   * Add peripherals to existing assets
   * @param {Array} peripheralRows - Rows containing peripheral data for existing assets
   * @returns {Object} Import results
   */
  static async addPeripheralsToExistingAssets(peripheralRows) {
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      details: []
    };
    
    console.log(`\n🔧 Adding peripherals to ${peripheralRows.length} existing assets...`);
    
    for (const row of peripheralRows) {
      try {
        const assetSerial = row.serial_number;
        const assetId = row.existingAssetId;
        
        console.log(`\n📍 Processing asset: ${assetSerial} (ID: ${assetId})`);
        
        // Extract peripheral data from row
        const peripherals = this.extractPeripheralData(row);
        
        if (peripherals.length === 0) {
          console.log(`   ⏭️  No peripherals to add for ${assetSerial}`);
          results.skipped++;
          results.details.push({
            assetSerial,
            assetId,
            action: 'skipped',
            reason: 'No peripheral data found'
          });
          continue;
        }
        
        console.log(`   Found ${peripherals.length} peripheral(s) to add`);
        
        // Add each peripheral
        const peripheralIds = [];
        for (const peripheral of peripherals) {
          try {
            console.log(`   Creating peripheral: ${peripheral.peripheral_name} (${peripheral.serial_code || 'No serial'})`);
            
            const peripheralId = await Asset.createPeripheral(
              assetId,
              peripheral.peripheral_name,
              peripheral.serial_code,
              peripheral.condition || 'Good',
              peripheral.remarks || ''
            );
            
            peripheralIds.push(peripheralId);
            console.log(`   ✅ Peripheral created with ID: ${peripheralId}`);
          } catch (peripheralError) {
            console.error(`   ❌ Failed to create peripheral: ${peripheralError.message}`);
            results.errors.push({
              assetSerial,
              peripheral: peripheral.peripheral_name,
              error: peripheralError.message
            });
          }
        }
        
        if (peripheralIds.length > 0) {
          results.success++;
          results.details.push({
            assetSerial,
            assetId,
            action: 'peripherals_added',
            peripheralIds,
            count: peripheralIds.length
          });
          
          logger.info(`Added ${peripheralIds.length} peripheral(s) to asset ${assetSerial}`);
        } else {
          results.failed++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing asset ${row.serial_number}:`, error.message);
        results.failed++;
        results.errors.push({
          assetSerial: row.serial_number,
          error: error.message
        });
      }
    }
    
    console.log(`\n📊 Peripheral Import Summary:`);
    console.log(`   ✅ Success: ${results.success}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⏭️  Skipped: ${results.skipped}`);
    
    return results;
  }
  
  /**
   * Extract peripheral data from a CSV row
   * Handles both single peripheral and multiple peripherals (from grouping)
   * @param {Object} row - CSV row data
   * @returns {Array} Array of peripheral objects
   */
  static extractPeripheralData(row) {
    const peripherals = [];
    
    // Check if row has grouped peripherals array
    if (row.peripherals && Array.isArray(row.peripherals)) {
      return row.peripherals.map(p => ({
        peripheral_name: p.peripheral_name,
        serial_code: p.serial_code || p.serial_code_name,
        condition: p.condition || 'Good',
        remarks: p.remarks || ''
      }));
    }
    
    // Check for single peripheral in row
    if (row.peripheral_name) {
      peripherals.push({
        peripheral_name: row.peripheral_name,
        serial_code: row.serial_code || row.serial_code_name,
        condition: row.condition || row.peripheral_condition || 'Good',
        remarks: row.remarks || row.peripheral_remarks || ''
      });
    }
    
    return peripherals;
  }
  
  /**
   * Check for duplicate peripherals before adding
   * @param {Number} assetId - Asset ID
   * @param {String} serialCode - Peripheral serial code
   * @returns {Boolean} True if duplicate exists
   */
  static async checkDuplicatePeripheral(assetId, serialCode) {
    if (!serialCode) return false;
    
    try {
      // This would require a new method in Asset model
      // For now, we'll allow duplicates to be handled by database constraints
      return false;
    } catch (error) {
      console.error('Error checking duplicate peripheral:', error.message);
      return false;
    }
  }
  
  /**
   * Preview what will be added without actually adding
   * @param {Array} peripheralRows - Rows to preview
   * @returns {Object} Preview information
   */
  static async previewPeripheralImport(peripheralRows) {
    const preview = {
      totalAssets: peripheralRows.length,
      totalPeripherals: 0,
      assetDetails: []
    };
    
    for (const row of peripheralRows) {
      const peripherals = this.extractPeripheralData(row);
      preview.totalPeripherals += peripherals.length;
      
      preview.assetDetails.push({
        assetSerial: row.serial_number,
        assetId: row.existingAssetId,
        peripheralCount: peripherals.length,
        peripherals: peripherals.map(p => ({
          name: p.peripheral_name,
          serial: p.serial_code || 'N/A'
        }))
      });
    }
    
    return preview;
  }
}

module.exports = PeripheralImporter;
