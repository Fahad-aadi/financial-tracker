const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all object codes
router.get('/', async (req, res) => {
  try {
    let objectCodes = await db.getObjectCodes();
    
    // Ensure we always return an array, even if empty
    if (!Array.isArray(objectCodes)) {
      console.warn('getObjectCodes() did not return an array:', objectCodes);
      objectCodes = [];
    }
    
    // After fetching object codes from the database:
    if (Array.isArray(objectCodes)) {
      objectCodes = objectCodes.map(o => ({
        ...o,
        createdAt: o.created_at || o.createdAt,
        updatedAt: o.updated_at || o.updatedAt,
        isActive: o.is_active !== undefined ? o.is_active : o.isActive,
      }));
    }
    
    res.json(objectCodes);
  } catch (error) {
    console.error('Error in GET /api/objectCodes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch object codes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET a single object code by ID
router.get('/:id', async (req, res) => {
  try {
    const objectCode = await db.getObjectCodeById(req.params.id);
    if (!objectCode) {
      return res.status(404).json({ error: 'Object code not found' });
    }
    res.json(objectCode);
  } catch (error) {
    console.error('Error in GET /api/objectCodes/:id:', error);
    res.status(500).json({ error: 'Failed to fetch object code' });
  }
});

// POST a new object code
router.post('/', async (req, res) => {
  try {
    const { code, description } = req.body;
    
    if (!code || !description) {
      return res.status(400).json({ error: 'Code and description are required' });
    }
    
    // Check if code already exists
    const existingCode = await db.get('SELECT id FROM object_codes WHERE code = ?', [code]);
    if (existingCode) {
      return res.status(409).json({ error: 'An object code with this code already exists' });
    }
    
    // In the POST endpoint, revert to the previous logic:
    const result = await db.createObjectCode({ code, description });
    console.log("Result", result, !result, !result.lastID);
    if (!result || !result.id) {
      throw new Error('Failed to create object code');
    }
    const objectCode = await db.getObjectCodeById(result.id);
    if (!objectCode) {
      throw new Error('Failed to fetch created object code');
    }
    res.status(201).json(objectCode);
  } catch (error) {
    console.error('Error in POST /api/objectCodes:', error);
    res.status(500).json({ 
      error: 'Failed to create object code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT update an object code
router.put('/:id', async (req, res) => {
  try {
    const { code, description, isActive } = req.body;
    
    if (!code || !description) {
      return res.status(400).json({ error: 'Code and description are required' });
    }
    
    await db.run(
      'UPDATE object_codes SET code = ?, description = ?, isActive = ? WHERE id = ?',
      [code, description, isActive, req.params.id]
    );
    
    const updatedObjectCode = await db.get('SELECT * FROM object_codes WHERE id = ?', [req.params.id]);
    res.json(updatedObjectCode);
  } catch (error) {
    console.error('Error in PUT /api/objectCodes/:id:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'An object code with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to update object code' });
  }
});

// DELETE an object code
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM object_codes WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /api/objectCodes/:id:', error);
    res.status(500).json({ error: 'Failed to delete object code' });
  }
});

module.exports = router;
