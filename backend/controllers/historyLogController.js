const HistoryLog = require('../models/HistoryLog');

/**
 * Get history logs with pagination
 */
exports.getHistoryLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
      });
    }

    // Fetch logs and total count
    const [logs, totalCount] = await Promise.all([
      HistoryLog.getHistoryLogs(page, limit),
      HistoryLog.getTotalCount()
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    res.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: totalCount,
          recordsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching history logs:', error);
    res.status(200).json({
      success: true,
      data: {
        logs: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          recordsPerPage: 100,
          hasNextPage: false,
          hasPrevPage: false
        }
      },
      message: 'No audit logs found or table does not exist yet'
    });
  }
};

/**
 * Create a new history log entry (for internal use or testing)
 */
exports.createHistoryLog = async (req, res) => {
  try {
    const { userId, tableName, recordId, actionType, actionDesc, changes } = req.body;

    // Validation
    if (!userId || !tableName || !recordId || !actionType || !actionDesc) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, tableName, recordId, actionType, actionDesc'
      });
    }

    // Validate action type
    const validActionTypes = ['INSERT', 'UPDATE', 'DELETE'];
    if (!validActionTypes.includes(actionType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action type. Must be INSERT, UPDATE, or DELETE.'
      });
    }

    // Create log entry
    const logId = await HistoryLog.createLog({
      userId,
      tableName,
      recordId,
      actionType: actionType.toUpperCase(),
      actionDesc
    });

    // Create changes if provided
    if (changes && Array.isArray(changes) && changes.length > 0) {
      await HistoryLog.createChanges(logId, changes);
    }

    res.status(201).json({
      success: true,
      message: 'History log created successfully',
      data: { logId }
    });
  } catch (error) {
    console.error('Error creating history log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create history log',
      error: error.message
    });
  }
};
