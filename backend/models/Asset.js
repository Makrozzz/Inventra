const { executeQuery } = require('../config/database');
const { getPaginationMeta, toCamelCase } = require('../utils/helpers');

class Asset {
  constructor(data) {
    this.serialNumber = data.Serial_Number || data.serialNumber;
    this.assetModelName = data.Asset_ModelName || data.assetModelName;
    this.assetModelDesc = data.Asset_ModelDesc || data.assetModelDesc;
    this.assetTagID = data.Asset_TagID || data.assetTagID;
    this.assetStatus = data.Asset_Status || data.assetStatus;
    this.assetLocation = data.Asset_Location || data.assetLocation;
    this.assetCategory = data.Asset_Category || data.assetCategory;
    this.assetOs = data.Asset_Os || data.assetOs;
    this.assetSoftware = data.Asset_Software || data.assetSoftware;
    this.assetOwner = data.Asset_Owner || data.assetOwner;
    this.accessories = data.Accessories || data.accessories;
    this.department = data.Department || data.department;
    this.pmContractName = data.PM_Contract_Name || data.pmContractName;
  }

  // Create new asset
  static async create(assetData) {
    const query = `
      INSERT INTO ASSET (
        Serial_Number, Asset_ModelName, Asset_ModelDesc, Asset_TagID,
        Asset_Status, Asset_Location, Asset_Category, Asset_Os,
        Asset_Software, Asset_Owner, Accessories, Department, PM_Contract_Name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      assetData.serialNumber,
      assetData.assetModelName,
      assetData.assetModelDesc,
      assetData.assetTagID,
      assetData.assetStatus || 'Active',
      assetData.assetLocation,
      assetData.assetCategory,
      assetData.assetOs,
      assetData.assetSoftware,
      assetData.assetOwner,
      assetData.accessories,
      assetData.department,
      assetData.pmContractName
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
        Asset_ModelDesc LIKE ? OR
        Asset_Location LIKE ? OR
        Asset_Owner LIKE ? OR
        Department LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ASSET ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const totalCount = countResult[0].total;

    // Get paginated results
    const dataQuery = `
      SELECT * FROM ASSET 
      ${whereClause} 
      ORDER BY Serial_Number DESC 
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);

    const assets = await executeQuery(dataQuery, queryParams);
    
    // Transform database results to camelCase for frontend
    const transformedAssets = assets.map(asset => new Asset(asset));

    return {
      assets: transformedAssets,
      pagination: getPaginationMeta(page, limit, totalCount)
    };
  }

  // Find asset by serial number
  static async findBySerialNumber(serialNumber) {
    const query = 'SELECT * FROM ASSET WHERE Serial_Number = ?';
    const result = await executeQuery(query, [serialNumber]);
    return result.length > 0 ? new Asset(result[0]) : null;
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
      'SELECT * FROM ASSET ORDER BY Serial_Number DESC LIMIT 5'
    ];

    const [totalResult, statusResult, categoryResult, recentResult] = await Promise.all(
      queries.map(query => executeQuery(query))
    );

    return {
      total: totalResult[0].total,
      byStatus: statusResult.map(item => ({
        status: item.status,
        count: item.count
      })),
      byCategory: categoryResult.map(item => ({
        category: item.category,
        count: item.count
      })),
      recent: recentResult.map(asset => new Asset(asset))
    };
  }

  // Helper method to map camelCase to database field names
  static getDbFieldName(field) {
    const fieldMap = {
      'serialNumber': 'Serial_Number',
      'assetModelName': 'Asset_ModelName',
      'assetModelDesc': 'Asset_ModelDesc',
      'assetTagID': 'Asset_TagID',
      'assetStatus': 'Asset_Status',
      'assetLocation': 'Asset_Location',
      'assetCategory': 'Asset_Category',
      'assetOs': 'Asset_Os',
      'assetSoftware': 'Asset_Software',
      'assetOwner': 'Asset_Owner',
      'accessories': 'Accessories',
      'department': 'Department',
      'pmContractName': 'PM_Contract_Name'
    };
    return fieldMap[field] || null;
  }
}

module.exports = Asset;