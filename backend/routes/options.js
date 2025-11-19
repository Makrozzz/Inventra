const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all Windows versions
router.get('/windows', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT Windows FROM ASSET WHERE Windows IS NOT NULL AND Windows != "" ORDER BY Windows'
    );
    const versions = rows.map(row => row.Windows);
    
    // Add default options if none exist
    const defaultVersions = ['Windows 10', 'Windows 11', 'Windows Server', 'None'];
    const allVersions = [...new Set([...defaultVersions, ...versions])];
    
    res.json({ success: true, data: allVersions });
  } catch (error) {
    console.error('Error fetching Windows versions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Windows versions' });
  }
});

// Add new Windows version
router.post('/windows', async (req, res) => {
  try {
    const { value } = req.body;
    
    if (!value || !value.trim()) {
      return res.status(400).json({ success: false, error: 'Value is required' });
    }

    // Check if it already exists
    const [existing] = await pool.execute(
      'SELECT Windows FROM ASSET WHERE Windows = ? LIMIT 1',
      [value.trim()]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Version already exists', data: value.trim() });
    }

    res.json({ success: true, message: 'Windows version can now be used', data: value.trim() });
  } catch (error) {
    console.error('Error adding Windows version:', error);
    res.status(500).json({ success: false, error: 'Failed to add Windows version' });
  }
});

// Get all Office versions
router.get('/office', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT Microsoft_Office FROM ASSET WHERE Microsoft_Office IS NOT NULL AND Microsoft_Office != "" ORDER BY Microsoft_Office'
    );
    const versions = rows.map(row => row.Microsoft_Office);
    
    // Add default options if none exist
    const defaultVersions = ['Office 2019', 'Office 2021', 'Microsoft 365', 'None'];
    const allVersions = [...new Set([...defaultVersions, ...versions])];
    
    res.json({ success: true, data: allVersions });
  } catch (error) {
    console.error('Error fetching Office versions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Office versions' });
  }
});

// Add new Office version
router.post('/office', async (req, res) => {
  try {
    const { value } = req.body;
    
    if (!value || !value.trim()) {
      return res.status(400).json({ success: false, error: 'Value is required' });
    }

    // Check if it already exists
    const [existing] = await pool.execute(
      'SELECT Microsoft_Office FROM ASSET WHERE Microsoft_Office = ? LIMIT 1',
      [value.trim()]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Version already exists', data: value.trim() });
    }

    res.json({ success: true, message: 'Office version can now be used', data: value.trim() });
  } catch (error) {
    console.error('Error adding Office version:', error);
    res.status(500).json({ success: false, error: 'Failed to add Office version' });
  }
});

// Get all Software options
router.get('/software', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT Software_ID, Software_Name FROM SOFTWARE ORDER BY Software_Name'
    );
    const software = rows.map(row => row.Software_Name);
    
    res.json({ success: true, data: software });
  } catch (error) {
    console.error('Error fetching software:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch software' });
  }
});

// Add new Software
router.post('/software', async (req, res) => {
  try {
    const { value } = req.body;
    
    if (!value || !value.trim()) {
      return res.status(400).json({ success: false, error: 'Value is required' });
    }

    // Check if it already exists
    const [existing] = await pool.execute(
      'SELECT Software_ID FROM SOFTWARE WHERE Software_Name = ?',
      [value.trim()]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Software already exists', data: value.trim() });
    }

    // Insert new software
    const [result] = await pool.execute(
      'INSERT INTO SOFTWARE (Software_Name) VALUES (?)',
      [value.trim()]
    );

    res.json({ 
      success: true, 
      message: 'Software added successfully', 
      data: value.trim(),
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding software:', error);
    res.status(500).json({ success: false, error: 'Failed to add software' });
  }
});

module.exports = router;
