const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all models for dropdown/autocomplete
 */
const getAllModels = async (req, res, next) => {
  try {
    const [models] = await pool.execute(`
      SELECT 
        Model_ID as id,
        Model_Name as name,
        Model_ID,
        Model_Name
      FROM MODEL 
      ORDER BY Model_Name ASC
    `);

    res.status(200).json({
      success: true,
      data: models
    });
  } catch (error) {
    logger.error('Error in getAllModels:', error);
    console.error('Error fetching models:', error);
    
    // Return fallback models if database query fails
    const fallbackModels = [
      { id: 1, name: 'Dell OptiPlex All-in-One Plus 7420', Model_ID: 1, Model_Name: 'Dell OptiPlex All-in-One Plus 7420' },
      { id: 2, name: 'HP Color LaserJet Enterprise MFP M480f', Model_ID: 2, Model_Name: 'HP Color LaserJet Enterprise MFP M480f' },
      { id: 3, name: 'Lenovo ThinkPad X1 Carbon', Model_ID: 3, Model_Name: 'Lenovo ThinkPad X1 Carbon' },
      { id: 4, name: 'Dell PowerEdge R740', Model_ID: 4, Model_Name: 'Dell PowerEdge R740' }
    ];
    
    res.status(200).json({
      success: true,
      data: fallbackModels,
      fallback: true
    });
  }
};

/**
 * Get or create model by name (hybrid functionality)
 * This is the core method for supporting free-text + dropdown behavior
 */
const getOrCreateModel = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Model name is required and must be a non-empty string'
      });
    }

    const modelName = name.trim();
    console.log(`Getting or creating model: "${modelName}"`);

    // First try to find existing model (case-insensitive)
    const [existing] = await pool.execute(
      'SELECT Model_ID, Model_Name FROM MODEL WHERE LOWER(Model_Name) = LOWER(?)',
      [modelName]
    );
    
    if (existing.length > 0) {
      console.log(`Found existing model: ID=${existing[0].Model_ID}, Name="${existing[0].Model_Name}"`);
      return res.status(200).json({
        success: true,
        data: {
          id: existing[0].Model_ID,
          name: existing[0].Model_Name,
          Model_ID: existing[0].Model_ID,
          Model_Name: existing[0].Model_Name,
          isNew: false
        }
      });
    }

    // Create new model
    const [result] = await pool.execute(
      'INSERT INTO MODEL (Model_Name) VALUES (?)',
      [modelName]
    );

    const newModelId = result.insertId;
    console.log(`✅ Created new model: ID=${newModelId}, Name="${modelName}"`);

    logger.info(`New model created: ${modelName} (ID: ${newModelId}) by user ${req.user?.userId || 'system'}`);

    res.status(201).json({
      success: true,
      data: {
        id: newModelId,
        name: modelName,
        Model_ID: newModelId,
        Model_Name: modelName,
        isNew: true
      },
      message: `New model "${modelName}" created successfully`
    });
  } catch (error) {
    // Handle duplicate key error (in case of race condition)
    if (error.code === 'ER_DUP_ENTRY') {
      try {
        // Try to get the model that was created by another request
        const [existing] = await pool.execute(
          'SELECT Model_ID, Model_Name FROM MODEL WHERE LOWER(Model_Name) = LOWER(?)',
          [req.body.name.trim()]
        );
        
        if (existing.length > 0) {
          return res.status(200).json({
            success: true,
            data: {
              id: existing[0].Model_ID,
              name: existing[0].Model_Name,
              Model_ID: existing[0].Model_ID,
              Model_Name: existing[0].Model_Name,
              isNew: false
            }
          });
        }
      } catch (retryError) {
        console.error('Error in retry after duplicate:', retryError);
      }
    }

    logger.error('Error in getOrCreateModel:', error);
    console.error('Error getting/creating model:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get or create model',
      message: error.message
    });
  }
};

/**
 * Search models by partial name match
 */
const searchModels = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      // Return all models if no search query
      return getAllModels(req, res, next);
    }

    const searchTerm = `%${q.trim()}%`;
    
    const [models] = await pool.execute(`
      SELECT 
        Model_ID as id,
        Model_Name as name,
        Model_ID,
        Model_Name
      FROM MODEL 
      WHERE Model_Name LIKE ?
      ORDER BY 
        CASE WHEN Model_Name LIKE ? THEN 1 ELSE 2 END,  -- Exact matches first
        Model_Name ASC
      LIMIT 20
    `, [searchTerm, q.trim()]);

    res.status(200).json({
      success: true,
      data: models,
      query: q.trim()
    });
  } catch (error) {
    logger.error('Error in searchModels:', error);
    console.error('Error searching models:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to search models'
    });
  }
};

/**
 * Create a new model explicitly
 */
const createModel = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Model name is required and must be a non-empty string'
      });
    }

    const modelName = name.trim();

    // Check if model already exists
    const [existing] = await pool.execute(
      'SELECT Model_ID FROM MODEL WHERE LOWER(Model_Name) = LOWER(?)',
      [modelName]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Model "${modelName}" already exists`,
        existingId: existing[0].Model_ID
      });
    }

    // Create new model
    const [result] = await pool.execute(
      'INSERT INTO MODEL (Model_Name) VALUES (?)',
      [modelName]
    );

    const newModelId = result.insertId;
    logger.info(`New model created: ${modelName} (ID: ${newModelId}) by user ${req.user?.userId || 'system'}`);

    res.status(201).json({
      success: true,
      data: {
        id: newModelId,
        name: modelName,
        Model_ID: newModelId,
        Model_Name: modelName
      },
      message: `Model "${modelName}" created successfully`
    });
  } catch (error) {
    logger.error('Error in createModel:', error);
    console.error('Error creating model:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create model',
      message: error.message
    });
  }
};

/**
 * Update model by ID
 */
const updateModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Model name is required and must be a non-empty string'
      });
    }

    const modelName = name.trim();

    // Check if model exists
    const [existing] = await pool.execute(
      'SELECT Model_ID, Model_Name FROM MODEL WHERE Model_ID = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    // Update model
    await pool.execute(
      'UPDATE MODEL SET Model_Name = ? WHERE Model_ID = ?',
      [modelName, id]
    );

    logger.info(`Model updated: ID=${id}, Old="${existing[0].Model_Name}", New="${modelName}" by user ${req.user?.userId || 'system'}`);

    res.status(200).json({
      success: true,
      data: {
        id: parseInt(id),
        name: modelName,
        Model_ID: parseInt(id),
        Model_Name: modelName
      },
      message: `Model updated successfully`
    });
  } catch (error) {
    logger.error('Error in updateModel:', error);
    console.error('Error updating model:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update model',
      message: error.message
    });
  }
};

/**
 * Delete model by ID
 */
const deleteModel = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if model is in use
    const [assetsUsingModel] = await pool.execute(
      'SELECT COUNT(*) as count FROM ASSET WHERE Model_ID = ?',
      [id]
    );
    
    if (assetsUsingModel[0].count > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete model. It is currently used by ${assetsUsingModel[0].count} asset(s)`,
        assetsCount: assetsUsingModel[0].count
      });
    }

    // Check if model exists
    const [existing] = await pool.execute(
      'SELECT Model_Name FROM MODEL WHERE Model_ID = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    // Delete model
    await pool.execute(
      'DELETE FROM MODEL WHERE Model_ID = ?',
      [id]
    );

    logger.info(`Model deleted: ID=${id}, Name="${existing[0].Model_Name}" by user ${req.user?.userId || 'system'}`);

    res.status(200).json({
      success: true,
      message: `Model "${existing[0].Model_Name}" deleted successfully`
    });
  } catch (error) {
    logger.error('Error in deleteModel:', error);
    console.error('Error deleting model:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete model',
      message: error.message
    });
  }
};

module.exports = {
  getAllModels,
  getOrCreateModel,
  searchModels,
  createModel,
  updateModel,
  deleteModel
};