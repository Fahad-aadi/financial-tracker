const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all cost centers
router.get('/', async (req, res) => {
  try {
    let costCenters = await db.getCostCenters();
    
    // Ensure we always return an array, even if empty
    if (!Array.isArray(costCenters)) {
      console.warn('getCostCenters() did not return an array:', costCenters);
      costCenters = [];
    }
    
    // After fetching cost centers from the database:
    if (Array.isArray(costCenters)) {
      costCenters = costCenters.map(c => ({
        ...c,
        createdAt: c.created_at || c.createdAt,
        updatedAt: c.updated_at || c.updatedAt,
        isActive: c.is_active !== undefined ? c.is_active : c.isActive,
      }));
    }
    
    res.json(costCenters);
  } catch (error) {
    console.error('Error in GET /api/costCenters:', error);
    res.status(500).json({ error: 'Failed to fetch cost centers' });
  }
});

// GET a single cost center by ID
router.get('/:id', async (req, res) => {
  try {
    const costCenter = await db.getCostCenterById(req.params.id);
    if (!costCenter) {
      return res.status(404).json({ error: 'Cost center not found' });
    }
    res.json(costCenter);
  } catch (error) {
    console.error('Error in GET /api/costCenters/:id:', error);
    res.status(500).json({ error: 'Failed to fetch cost center' });
  }
});

// POST a new cost center
router.post('/', async (req, res) => {
  try {
    const { code, name, description } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    
    // Validate code format (alphanumeric with optional hyphens/underscores)
    if (!/^[A-Z0-9_-]+$/i.test(code)) {
      return res.status(400).json({ error: 'Code can only contain letters, numbers, hyphens, and underscores' });
    }
    
    const upperCode = code.toUpperCase();
    
    // Check if cost center code already exists
    const existingCostCenter = await db.get('SELECT id FROM cost_centers WHERE code = ?', [upperCode]);
    if (existingCostCenter) {
      return res.status(409).json({ error: 'A cost center with this code already exists' });
    }
    
    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO cost_centers (code, name, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [upperCode, name, description || null, 1, now, now]
    );
    
    if (!result || !result.lastID) {
      throw new Error('Failed to create cost center');
    }
    
    const costCenter = await db.get('SELECT * FROM cost_centers WHERE id = ?', [result.lastID]);
    if (!costCenter) {
      throw new Error('Failed to fetch created cost center');
    }
    
    res.status(201).json(costCenter);
  } catch (error) {
    console.error('Error in POST /api/costCenters:', error);
    res.status(500).json({ 
      error: 'Failed to create cost center',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT update a cost center
router.put('/:id', async (req, res) => {
  try {
    const { code, name, description, isActive } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    
    // Validate code format (alphanumeric with optional hyphens/underscores)
    if (!/^[A-Z0-9_-]+$/i.test(code)) {
      return res.status(400).json({ error: 'Code can only contain letters, numbers, hyphens, and underscores' });
    }
    
    await db.updateCostCenter(req.params.id, {
      code: code.toUpperCase(),
      name,
      description: description || null,
      isActive: isActive !== undefined ? isActive : 1
    });
    
    const updatedCostCenter = await db.getCostCenterById(req.params.id);
    res.json(updatedCostCenter);
  } catch (error) {
    console.error('Error in PUT /api/costCenters/:id:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A cost center with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to update cost center' });
  }
});

// DELETE a cost center (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    // Don't allow deletion of LZ4064 and LO4587 as they are required for the application
    const costCenter = await db.getCostCenterById(req.params.id);
    if (costCenter && ['LZ4064', 'LO4587'].includes(costCenter.code)) {
      return res.status(403).json({ 
        error: 'This is a system-required cost center and cannot be deleted' 
      });
    }
    
    await db.deleteCostCenter(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /api/costCenters/:id:', error);
    res.status(500).json({ error: 'Failed to delete cost center' });
  }
});

module.exports = router;
