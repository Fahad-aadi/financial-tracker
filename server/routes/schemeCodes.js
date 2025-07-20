const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all scheme codes
router.get('/', async (req, res, next) => {
  try {
    console.log('GET /api/schemeCodes - Fetching scheme codes');
    let schemeCodes = await db.getSchemeCodes();
    console.log(`Found ${schemeCodes.length} scheme codes`);
    // After fetching scheme codes from the database:
    if (Array.isArray(schemeCodes)) {
      schemeCodes = schemeCodes.map(s => ({
        ...s,
        createdAt: s.created_at || s.createdAt,
        updatedAt: s.updated_at || s.updatedAt,
        isActive: s.is_active !== undefined ? s.is_active : s.isActive,
      }));
    }
    // Return just the array to match client expectations
    res.json(schemeCodes);
  } catch (error) {
    console.error('Error fetching scheme codes:', error);
    next(error);
  }
});

// POST a new scheme code
router.post('/', async (req, res, next) => {
  try {
    console.log('POST /api/schemeCodes - Received data:', req.body);
    
    const { code, name } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both code and name are required' 
      });
    }
    
    const newSchemeCode = await db.createSchemeCode({ code, name });
    console.log('Added new scheme code:', newSchemeCode);
    
    // Return just the created scheme code to match client expectations
    res.status(201).json(newSchemeCode);
    
  } catch (error) {
    console.error('Error adding scheme code:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: 'A scheme code with this code already exists'
      });
    }
    
    next(error);
  }
});

// DELETE a scheme code by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`DELETE /api/schemeCodes/${id} - Deleting scheme code`);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    
    const result = await db.deleteSchemeCode(id);
    
    if (!result || !result.deleted) {
      return res.status(404).json({
        success: false,
        error: result ? result.error || 'Failed to delete scheme code' : 'Scheme code not found'
      });
    }
    
    console.log(`Deleted scheme code with ID ${id}:`, result);
    res.json({
      success: true,
      data: result,
      message: 'Scheme code deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting scheme code:', error);
    next(error);
  }
});

module.exports = router;
