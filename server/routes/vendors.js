const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all vendors
router.get('/', async (req, res) => {
  try {
    let vendors = await db.getVendors();
    
    // Ensure we always return an array, even if empty
    if (!Array.isArray(vendors)) {
      console.warn('getVendors() did not return an array:', vendors);
      vendors = [];
    }
    
    // After fetching vendors from the database:
    if (Array.isArray(vendors)) {
      vendors = vendors.map(v => ({
        ...v,
        vendorNumber: v.vendor_number,
      }));
    }
    
    res.json(vendors);
  } catch (error) {
    console.error('Error in GET /api/vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// GET a single vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const vendor = await db.getVendorById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    console.error('Error in GET /api/vendors/:id:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// POST a new vendor
router.post('/', async (req, res) => {
  try {
    const { name, vendorNumber, contactPerson, email, phone } = req.body;
    
    if (!name || !vendorNumber) {
      return res.status(400).json({ error: 'Name and vendor number are required' });
    }
    
    // Check if vendor number already exists
    const existingVendor = await db.get('SELECT id FROM vendors WHERE vendor_number = ?', [vendorNumber]);
    if (existingVendor) {
      return res.status(409).json({ error: 'A vendor with this vendor number already exists' });
    }
    
    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO vendors (name, vendor_number, contact_person, email, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, vendorNumber, null, null, null, now, now]
    );
    
    if (!result || !result.lastID) {
      throw new Error('Failed to create vendor');
    }
    
    const vendor = await db.get('SELECT * FROM vendors WHERE id = ?', [result.lastID]);
    if (!vendor) {
      throw new Error('Failed to fetch created vendor');
    }
    
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error in POST /api/vendors:', error);
    res.status(500).json({ 
      error: 'Failed to create vendor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT update a vendor
router.put('/:id', async (req, res) => {
  try {
    const { name, vendorNumber, contactPerson, email, phone, isActive } = req.body;
    
    if (!name || !vendorNumber) {
      return res.status(400).json({ error: 'Name and vendor number are required' });
    }
    
    await db.updateVendor(req.params.id, {
      name,
      vendorNumber,
      contact_person: contactPerson || null,
      email: email || null,
      phone: phone || null,
      isActive: isActive !== undefined ? isActive : 1
    });
    
    const updatedVendor = await db.getVendorById(req.params.id);
    res.json(updatedVendor);
  } catch (error) {
    console.error('Error in PUT /api/vendors/:id:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A vendor with this vendor number already exists' });
    }
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// DELETE a vendor (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteVendor(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /api/vendors/:id:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

module.exports = router;
