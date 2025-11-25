const db = require('../config/database');

class HistoryLog {
  /**
   * Get history logs with pagination, user info, and changes
   * @param {number} page - Page number (starting from 1)
   * @param {number} limit - Number of records per page
   * @returns {Promise<Array>} Array of history log records with changes
   */
  static async getHistoryLogs(page = 1, limit = 100) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        hl.Log_ID,
        hl.User_ID,
        COALESCE(u.Username, 'Unknown') as Username,
        hl.Table_Name,
        hl.Record_ID,
        hl.Action_Type,
        hl.Action_Desc,
        hl.Timestamp,
        GROUP_CONCAT(
          CONCAT(hlc.Field_Name, ':', COALESCE(hlc.Old_Value, ''), '→', COALESCE(hlc.New_Value, ''))
          SEPARATOR '|'
        ) as Changes
      FROM HISTORY_LOG hl
      LEFT JOIN USER u ON hl.User_ID = u.User_ID
      LEFT JOIN HISTORY_LOG_CHANGES hlc ON hl.Log_ID = hlc.Log_ID
      GROUP BY hl.Log_ID
      ORDER BY hl.Timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    try {
      console.log('Fetching history logs - page:', page, 'limit:', limit, 'offset:', offset);
      const [rows] = await db.pool.execute(query, [limit, offset]);
      console.log('History logs fetched:', rows.length, 'rows');
      
      if (rows.length > 0) {
        console.log('First log:', rows[0]);
      }
      
      // Parse changes into array for easier frontend handling
      const logs = rows.map(log => ({
        ...log,
        Changes: log.Changes ? log.Changes.split('|').map(change => {
          const [fieldName, values] = change.split(':');
          const [oldValue, newValue] = values ? values.split('→') : ['', ''];
          return { fieldName, oldValue, newValue };
        }) : []
      }));
      
      return logs;
    } catch (error) {
      console.error('Error fetching history logs:', error);
      console.error('SQL Error:', error.sqlMessage);
      // Return empty array if table doesn't exist or other error
      return [];
    }
  }

  /**
   * Get total count of history logs
   * @returns {Promise<number>} Total count
   */
  static async getTotalCount() {
    const query = 'SELECT COUNT(*) as total FROM HISTORY_LOG';
    
    try {
      console.log('Getting total count of history logs...');
      const [rows] = await db.pool.execute(query);
      console.log('Total count:', rows[0].total);
      return rows[0].total;
    } catch (error) {
      console.error('Error getting total count:', error);
      console.error('SQL Error:', error.sqlMessage);
      // Return 0 if table doesn't exist
      return 0;
    }
  }

  /**
   * Create a new history log entry
   * @param {Object} logData - Log data
   * @returns {Promise<number>} Inserted Log_ID
   */
  static async createLog(logData) {
    const { userId, tableName, recordId, actionType, actionDesc } = logData;
    
    const query = `
      INSERT INTO HISTORY_LOG (User_ID, Table_Name, Record_ID, Action_Type, Action_Desc, Timestamp)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    try {
      const [result] = await db.pool.execute(query, [userId, tableName, recordId, actionType, actionDesc]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create history log changes
   * @param {number} logId - Log ID
   * @param {Array} changes - Array of change objects {fieldName, oldValue, newValue}
   * @returns {Promise<void>}
   */
  static async createChanges(logId, changes) {
    if (!changes || changes.length === 0) return;
    
    const query = `
      INSERT INTO HISTORY_LOG_CHANGES (Log_ID, Field_Name, Old_Value, New_Value)
      VALUES ?
    `;
    
    const values = changes.map(change => [
      logId,
      change.fieldName,
      change.oldValue || '',
      change.newValue || ''
    ]);
    
    try {
      await db.pool.query(query, [values]);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = HistoryLog;
