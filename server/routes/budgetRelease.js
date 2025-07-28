const express = require('express');
const router = express.Router();
const db = require('../database');


router.post('/', async (req, res) => {
  try {
    console.log('POST /api/budget-releases - Received release data:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/budget-releases - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Validate required fields
    const { allocationId, objectCode, costCenter, financialYear, quarter, amount } = req.body;
    
    if (!allocationId) {
      return res.status(400).json({ error: 'Missing required field: allocationId' });
    }
    
    if (!objectCode) {
      return res.status(400).json({ error: 'Missing required field: objectCode' });
    }
    
    if (!costCenter) {
      return res.status(400).json({ error: 'Missing required field: costCenter' });
    }
    
    if (!financialYear) {
      return res.status(400).json({ error: 'Missing required field: financialYear' });
    }
    
    if (!quarter) {
      return res.status(400).json({ error: 'Missing required field: quarter' });
    }
    
    if (!amount && amount !== 0) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }
    
    // Ensure the release has a dateReleased field
    const release = {
      ...req.body,
      dateReleased: req.body.dateReleased || new Date().toISOString().split('T')[0],
      type: req.body.type || 'regular'
    };
    
    // Store the release in the database
    const result = await db.createBudgetRelease(release);
    
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save budget release' });
    }
    
    // Get the created release with its ID
    const createdRelease = await db.getBudgetReleaseById(result.id);
    
    console.log('Budget release saved successfully:', createdRelease);
    res.status(201).json(createdRelease);
  } catch (error) {
    console.error('Error in POST /api/budget-releases:', error);
    res.status(500).json({ error: 'Failed to create budget release', details: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    console.log('GET /api/budget-releases - Fetching budget releases');
    
    let releases;
    const { allocationId, costCenter, financialYear } = req.query;
    
    if (allocationId) {
      releases = await db.getBudgetReleasesByAllocationId(allocationId);
    } else if (costCenter && financialYear) {
      // We don't have a specific method for this combination, so we'll fetch all and filter
      const allReleases = await db.getBudgetReleases();
      releases = allReleases.filter(r => r.costCenter === costCenter && r.financialYear === financialYear);
    } else if (costCenter) {
      releases = await db.getBudgetReleasesByCostCenter(costCenter);
    } else if (financialYear) {
      releases = await db.getBudgetReleasesByFinancialYear(financialYear);
    } else {
      releases = await db.getBudgetReleases();
    }
    
    console.log(`Found ${releases.length} budget releases`);
    res.json(releases);
  } catch (error) {
    console.error('Error in GET /api/budget-releases:', error);
    res.status(500).json({ error: 'Failed to retrieve budget releases', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const release = await db.getBudgetReleaseById(id);
    
    if (!release) {
      return res.status(404).json({ error: 'Budget release not found' });
    }
    
    res.json(release);
  } catch (error) {
    console.error(`Error in GET /api/budget-releases/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve budget release', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if release exists
    const existingRelease = await db.getBudgetReleaseById(id);
    if (!existingRelease) {
      return res.status(404).json({ error: 'Budget release not found' });
    }
    
    // Delete the release
    await db.deleteBudgetRelease(id);
    
    res.json({ message: 'Budget release deleted successfully' });
  } catch (error) {
    console.error(`Error in DELETE /api/budget-releases/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete budget release', details: error.message });
  }
});


module.exports = router;
