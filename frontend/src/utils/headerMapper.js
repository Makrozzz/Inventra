/**
 * HeaderMapper - Flexible header mapping system for Excel/CSV imports
 * 
 * FEATURES:
 * - Automatically maps user headers to standard field names
 * - Supports multiple header variations (case-insensitive, with/without spaces)
 * - Intelligent fuzzy matching using keywords
 * - Validation to ensure all required fields are mapped
 * - Manual mapping correction capability
 * - Duplicate detection
 * 
 * USAGE EXAMPLE:
 * ```javascript
 * // 1. Get user headers from uploaded file
 * const userHeaders = Object.keys(excelData[0]);
 * // Example: ["Serial Number", "Project Ref", "Asset Tag", "Item Name"]
 * 
 * // 2. Map headers automatically
 * const result = HeaderMapper.mapHeaders(userHeaders);
 * // Returns: {
 * //   mapping: { "Serial Number": "serial_number", "Project Ref": "project_reference_num", ... },
 * //   unmapped: [],
 * //   duplicates: [],
 * //   standardFields: ["serial_number", "project_reference_num", ...]
 * // }
 * 
 * // 3. Validate mapping
 * const validation = HeaderMapper.validateMapping(result.mapping);
 * // Returns: { isValid: true, missingRequired: [] }
 * 
 * // 4. Transform data using mapping
 * const transformedData = HeaderMapper.transformData(excelData, result.mapping);
 * // Now data uses standard field names
 * ```
 * 
 * SUPPORTED HEADER VARIATIONS:
 * - serial_number: "Serial Number", "Serial No", "Asset Serial", etc.
 * - project_reference_num: "Project Ref", "Project ID", "Project Number", etc.
 * - tag_id: "Asset Tag", "Tag", "Tag Number", etc.
 * - item_name: "Asset Name", "Item", "Equipment Name", etc.
 * - And many more...
 */

class HeaderMapper {
  static headerMappings = {
    // serial_number variations
    'serial_number': [
      'serial_number', 'serial number', 'serial no', 'serial',
      'serial #', 'asset serial', 'asset serial number',
      'serial_num', 'ser_no', 'sno', 'serialnumber', 'assetserialnumber'
    ],
    
    // project_reference_num variations  
    'project_reference_num': [
      'project_reference_num', 'project reference num', 'project ref',
      'project reference', 'project id', 'project no', 'project number',
      'project_ref', 'proj_ref', 'project reference number',
      'projectreferencenumber', 'projectref', 'projectid'
    ],
    
    // tag_id variations
    'tag_id': [
      'tag_id', 'tag id', 'asset tag', 'tag', 'asset tag id',
      'tag number', 'asset tag number', 'tag_no', 'asset_tag',
      'tagid', 'assettag', 'tagnumber'
    ],
    
    // item_name variations
    'item_name': [
      'item_name', 'item name', 'asset name', 'item',
      'equipment name', 'device name', 'asset_name', 'equipment',
      'itemname', 'assetname', 'equipmentname', 'devicename'
    ],
    
    // category variations
    'category': [
      'category', 'asset category', 'type', 'equipment type',
      'category type', 'asset type', 'equipment category',
      'assetcategory', 'equipmenttype', 'assettype'
    ],
    
    // model variations
    'model': [
      'model', 'model name', 'model number', 'device model',
      'equipment model', 'model_name', 'model_number',
      'modelname', 'modelnumber', 'devicemodel'
    ],
    
    // status variations
    'status': [
      'status', 'asset status', 'condition', 'status type',
      'state', 'asset_status', 'assetstatus', 'assetcondition'
    ],
    
    // recipient_name variations
    'recipient_name': [
      'recipient_name', 'recipient name', 'assigned to', 'user',
      'owner', 'holder', 'assigned user', 'recipient',
      'recipientname', 'assignedto', 'assigneduser', 'username'
    ],
    
    // department_name variations
    'department_name': [
      'department_name', 'department name', 'department', 'dept',
      'unit', 'division', 'team', 'departmentname'
    ],
    
    // peripheral_name variations
    'peripheral_name': [
      'peripheral_name', 'peripheral name', 'peripheral', 'accessory',
      'component', 'attached device', 'peripheralname',
      'accessories', 'components', 'peripheal' // Common typo
    ],
    
    // serial_code variations (maps to Serial_Code in PERIPHERAL table)
    'serial_code': [
      'serial_code', 'serial code', 'peripheral serial',
      'accessory serial', 'component serial', 'peripheral_serial',
      'serialcode', 'peripheralserial', 'serial_code_name',
      'serial code name', 'serialcodename', 'peripheral serial number',
      'peripheral_serial_number', 'accessory serial number'
    ],
    
    // remarks variations
    'remarks': [
      'remarks', 'notes', 'comments', 'description',
      'additional info', 'remark', 'note', 'comment',
      'additionalinfo', 'desc', 'additional_info'
    ],
    
    // customer_name variations
    'customer_name': [
      'customer_name', 'customer name', 'customer', 'client',
      'client name', 'customername', 'clientname'
    ],
    
    // customer_reference_number variations
    'customer_reference_number': [
      'customer_reference_number', 'customer reference number',
      'customer ref', 'customer reference', 'customer ref no',
      'customerreferencenumber', 'customerref', 'clientref'
    ],
    
    // branch variations
    'branch': [
      'branch', 'branch name', 'location', 'site',
      'office', 'branchname', 'branchlocation'
    ]
  };

  /**
   * Normalize header string for comparison
   * Removes spaces, special characters, converts to lowercase
   */
  static normalizeHeader(header) {
    if (!header) return '';
    
    return String(header)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all special chars and spaces
      .trim();
  }

  /**
   * Get keywords for a standard field to help with fuzzy matching
   */
  static getKeywords(field) {
    const keywordMap = {
      'serial_number': ['serial', 'sno', 'ser'],
      'project_reference_num': ['project', 'ref', 'proj'],
      'tag_id': ['tag', 'asset'],
      'item_name': ['item', 'asset', 'name', 'equipment', 'device'],
      'category': ['categor', 'type'],
      'model': ['model'],
      'status': ['status', 'condition', 'state'],
      'recipient_name': ['recipient', 'assign', 'user', 'owner'],
      'department_name': ['department', 'dept', 'unit'],
      'peripheral_name': ['peripheral', 'accessory', 'component'],
      'serial_code': ['serial', 'code'],
      'remarks': ['remark', 'note', 'comment'],
      'customer_name': ['customer', 'client'],
      'customer_reference_number': ['customer', 'reference'],
      'branch': ['branch', 'location', 'site']
    };
    
    return keywordMap[field] || [field];
  }

  /**
   * Find matching standard field for a user header
   */
  static findMatchingField(userHeader) {
    if (!userHeader) return null;
    
    const normalized = this.normalizeHeader(userHeader);
    
    // Try exact match first
    for (const [standardField, variations] of Object.entries(this.headerMappings)) {
      const normalizedVariations = variations.map(v => this.normalizeHeader(v));
      
      if (normalizedVariations.includes(normalized)) {
        return standardField;
      }
    }
    
    // Try keyword matching as fallback
    for (const [standardField, variations] of Object.entries(this.headerMappings)) {
      const keywords = this.getKeywords(standardField);
      
      const hasKeyword = keywords.some(keyword => 
        normalized.includes(keyword)
      );
      
      if (hasKeyword) {
        return standardField;
      }
    }
    
    return null; // No match found
  }

  /**
   * Map all user headers to standard field names
   * Returns mapping object and list of unmapped headers
   */
  static mapHeaders(userHeaders) {
    const mapping = {};
    const unmapped = [];
    const duplicates = new Set();
    const usedStandardFields = new Set();
    
    userHeaders.forEach(userHeader => {
      const standardField = this.findMatchingField(userHeader);
      
      if (standardField) {
        // Check for duplicate mappings
        if (usedStandardFields.has(standardField)) {
          duplicates.add(standardField);
        }
        
        mapping[userHeader] = standardField;
        usedStandardFields.add(standardField);
      } else {
        unmapped.push(userHeader);
      }
    });
    
    return { 
      mapping, 
      unmapped,
      duplicates: Array.from(duplicates),
      standardFields: Array.from(usedStandardFields)
    };
  }

  /**
   * Transform data using header mapping
   */
  static transformData(data, headerMapping) {
    return data.map(row => {
      const transformedRow = {};
      
      Object.keys(row).forEach(originalHeader => {
        const standardField = headerMapping[originalHeader];
        
        if (standardField) {
          // Use standard field name
          transformedRow[standardField] = row[originalHeader];
        } else {
          // Keep original header if no mapping found
          transformedRow[originalHeader] = row[originalHeader];
        }
      });
      
      return transformedRow;
    });
  }

  /**
   * Get required fields for validation
   */
  static getRequiredFields() {
    return ['project_reference_num', 'serial_number', 'tag_id', 'item_name'];
  }

  /**
   * Get all supported standard field names
   */
  static getStandardFields() {
    return Object.keys(this.headerMappings);
  }

  /**
   * Check if mapping is valid (all required fields are mapped)
   */
  static validateMapping(mapping) {
    const requiredFields = this.getRequiredFields();
    const mappedStandardFields = Object.values(mapping);
    
    const missingRequired = requiredFields.filter(
      field => !mappedStandardFields.includes(field)
    );
    
    return {
      isValid: missingRequired.length === 0,
      missingRequired
    };
  }

  /**
   * Get mapping suggestions for unmapped headers
   */
  static getSuggestions(unmappedHeader) {
    const normalized = this.normalizeHeader(unmappedHeader);
    const suggestions = [];
    
    // Find fields with partial matches
    for (const [standardField, variations] of Object.entries(this.headerMappings)) {
      const keywords = this.getKeywords(standardField);
      
      // Check if any keyword is contained in the unmapped header
      const hasPartialMatch = keywords.some(keyword => 
        normalized.includes(keyword) || keyword.includes(normalized)
      );
      
      if (hasPartialMatch) {
        suggestions.push(standardField);
      }
    }
    
    return suggestions;
  }
}

export default HeaderMapper;
