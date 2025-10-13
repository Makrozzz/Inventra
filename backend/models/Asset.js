const { executeQuery } = require('../config/database');
const { getPaginationMeta, toCamelCase } = require('../utils/helpers');

class Asset {
  constructor(data) {
    this.serialNumber = data.serial_number || data.serialNumber;
    this.assetModelName = data.asset_model_name || data.assetModelName;
    this.assetModelDesc = data.asset_model_desc || data.assetModelDesc;
    this.assetManufacturer = data.asset_manufacturer || data.assetManufacturer;
    this.assetStatus = data.asset_status || data.assetStatus;
    this.assetLocation = data.asset_location || data.assetLocation;
    this.assetCategory = data.asset_category || data.assetCategory;
    this.purchaseDate = data.purchase_date || data.purchaseDate;
    this.purchasePrice = data.purchase_price || data.purchasePrice;
    this.warrantyDate = data.warranty_date || data.warrantyDate;
    this.assignedTo = data.assigned_to || data.assignedTo;
    this.notes = data.notes;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Create new asset
  static async create(assetData) {
    const query = `
      INSERT INTO ASSET (
        Serial_Number, Asset_ModelName, Asset_ModelDesc, Asset_Manufacturer,
        Asset_Status, Asset_Location, Asset_Category, Purchase_Date,
        Purchase_Price, Warranty_Date, Assigned_To, Notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      assetData.serialNumber,
      assetData.assetModelName,
      assetData.assetModelDesc,
      assetData.assetManufacturer,
      assetData.assetStatus || 'Available',
      assetData.assetLocation,
      assetData.assetCategory,
      assetData.purchaseDate,
      assetData.purchasePrice,
      assetData.warrantyDate,
      assetData.assignedTo,
      assetData.notes
    ];

    const result = await executeQuery(query, values);
    return result.insertId;
  }

  // Get all assets with pagination
  static async findAll(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    // Apply filters
    if (filters.status) {
      whereClause += ' AND Asset_Status = ?';
      queryParams.push(filters.status);
    }

    if (filters.category) {
      whereClause += ' AND Asset_Category = ?';
      queryParams.push(filters.category);
    }

    if (filters.search) {
      whereClause += ` AND (
        Serial_Number LIKE ? OR 
        Asset_ModelName LIKE ? OR 
        Asset_Manufacturer LIKE ? OR
        Asset_Location LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ASSET ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const totalCount = countResult[0].total;

    // Get paginated results
    const dataQuery = `
      SELECT * FROM ASSET 
      ${whereClause} 
      ORDER BY Created_At DESC 
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);

    const assets = await executeQuery(dataQuery, queryParams);
    const camelCaseAssets = toCamelCase(assets);

    return {
      assets: camelCaseAssets,
      pagination: getPaginationMeta(page, limit, totalCount)
    };
  }

  // Find asset by serial number
  static async findBySerialNumber(serialNumber) {
    const query = 'SELECT * FROM ASSET WHERE Serial_Number = ?';
    const result = await executeQuery(query, [serialNumber]);
    return result.length > 0 ? toCamelCase(result[0]) : null;
  }

  // Update asset
  static async update(serialNumber, updateData) {
    const fields = [];
    const values = [];

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'serialNumber') {
        // Convert camelCase to snake_case for database
        const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const actualField = this.getDbFieldName(dbField);
        if (actualField) {
          fields.push(`${actualField} = ?`);
          values.push(updateData[key]);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(serialNumber);
    const query = `UPDATE ASSET SET ${fields.join(', ')}, Updated_At = CURRENT_TIMESTAMP WHERE Serial_Number = ?`;
    
    const result = await executeQuery(query, values);
    return result.affectedRows > 0;
  }

  // Delete asset
  static async delete(serialNumber) {
    const query = 'DELETE FROM ASSET WHERE Serial_Number = ?';
    const result = await executeQuery(query, [serialNumber]);
    return result.affectedRows > 0;
  }

  // Get asset statistics
  static async getStatistics() {
    const queries = [
      'SELECT COUNT(*) as total FROM ASSET',
      'SELECT Asset_Status as status, COUNT(*) as count FROM ASSET GROUP BY Asset_Status',
      'SELECT Asset_Category as category, COUNT(*) as count FROM ASSET GROUP BY Asset_Category',
      'SELECT * FROM ASSET ORDER BY Created_At DESC LIMIT 5'
    ];

    const [totalResult, statusResult, categoryResult, recentResult] = await Promise.all(
      queries.map(query => executeQuery(query))
    );

    return {
      total: totalResult[0].total,
      byStatus: toCamelCase(statusResult),
      byCategory: toCamelCase(categoryResult),
      recent: toCamelCase(recentResult)
    };
  }

  // Helper method to map camelCase to database field names
  static getDbFieldName(field) {
    const fieldMap = {
      'serial_number': 'Serial_Number',
      'asset_model_name': 'Asset_ModelName',
      'asset_model_desc': 'Asset_ModelDesc',
      'asset_manufacturer': 'Asset_Manufacturer',
      'asset_status': 'Asset_Status',
      'asset_location': 'Asset_Location',
      'asset_category': 'Asset_Category',
      'purchase_date': 'Purchase_Date',
      'purchase_price': 'Purchase_Price',
      'warranty_date': 'Warranty_Date',
      'assigned_to': 'Assigned_To',
      'notes': 'Notes'
    };
    return fieldMap[field] || null;
  }
}

module.exports = Asset;