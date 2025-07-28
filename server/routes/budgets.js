const express = require('express');
const router = express.Router();
const db = require('../database');

// Budget allocation endpoints
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/budget-allocations - Received allocation data:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/budget-allocations - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Validate required fields
    const { objectCode, costCenter, financialYear, totalAllocation } = req.body;
    
    if (!objectCode) {
      return res.status(400).json({ error: 'Missing required field: objectCode' });
    }
    
    if (!costCenter) {
      return res.status(400).json({ error: 'Missing required field: costCenter' });
    }
    
    if (!financialYear) {
      return res.status(400).json({ error: 'Missing required field: financialYear' });
    }
    
    if (!totalAllocation && totalAllocation !== 0) {
      return res.status(400).json({ error: 'Missing required field: totalAllocation' });
    }
    
    // Ensure the allocation has a dateCreated field
    const allocation = {
      ...req.body,
      dateCreated: req.body.dateCreated || new Date().toISOString().split('T')[0]
    };
    
    // Store the allocation in the database
    console.log("Allocation Data:", allocation);
    const result = await db.createBudgetAllocation(allocation);
    
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save budget allocation' });
    }
    
    // Get the created allocation with its ID
    const createdAllocation = await db.getBudgetAllocationById(result.id);
    let objectCodeDetail = await db.getObjectCodeById(createdAllocation.objectCode)
    let costCenterDetail = await db.getCostCenterById(createdAllocation.costCenter)

    createdAllocation['objectCodeName']= objectCodeDetail.code;
    createdAllocation['costCenterName']= costCenterDetail.code;
    
    console.log('Budget allocation saved successfully:', createdAllocation);
    res.status(201).json(createdAllocation);
  } catch (error) {
    console.error('Error in POST /api/budget-allocations:', error);
    res.status(500).json({ error: 'Failed to create budget allocation', details: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    console.log('GET /api/budget-allocations - Fetching budget allocations');
    
    let allocations;
    const { costCenter, financialYear } = req.query;
    
    if (costCenter && financialYear) {
      allocations = await db.getBudgetAllocationsByCostCenterAndFinancialYear(costCenter, financialYear);
    } else if (costCenter) {
      allocations = await db.getBudgetAllocationsByCostCenter(costCenter);
    } else if (financialYear) {
      allocations = await db.getBudgetAllocationsByFinancialYear(financialYear);
    } else {
      allocations = await db.getAllBudgetAllocations();
    }
    
    console.log(`Found ${allocations.length} budget allocations`);
    
    // Transform boolean fields from SQLite integers to JavaScript booleans
    // const transformedAllocations = await allocations.map(async (allocation) => {
    //   let objectCodeDetail =  await db.getObjectCodeById(allocation.objectCode)
    //   let costCenterDetail =  await db.getCostCenterById(allocation.costCenter)
    //   return {
    //   ...allocation,
    //   q1Released: allocation.q1Released === 1,
    //   q2Released: allocation.q2Released === 1,
    //   q3Released: allocation.q3Released === 1,
    //   q4Released: allocation.q4Released === 1,
    //   objectCodeName: objectCodeDetail.name,
    //   costCenterName: costCenterDetail.name,
    // }});
    
    const transformedAllocations = await Promise.all(
    allocations.map(async (allocation) => {
      let objectCodeDetail = await db.getObjectCodeById(allocation.objectCode);
      let costCenterDetail = await db.getCostCenterById(allocation.costCenter);
      
      return {
        ...allocation,
        q1Released: allocation.q1Released === 1,
        q2Released: allocation.q2Released === 1,
        q3Released: allocation.q3Released === 1,
        q4Released: allocation.q4Released === 1,
        objectCodeName: objectCodeDetail?.code || null,
        costCenterName: costCenterDetail?.code || null
      };
    })
  );
  await res.json(transformedAllocations);
  } catch (error) {
    console.error('Error in GET /api/budget-allocations:', error);
    res.status(500).json({ error: 'Failed to retrieve budget allocations', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const allocation = await db.getBudgetAllocationById(id);
    if (!allocation) {
      return res.status(404).json({ error: 'Budget allocation not found' });
    }
    let objectCodeDetail = await db.getObjectCodeById(allocation.objectCode)
    let costCenterDetail = await db.getCostCenterById(allocation.costCenter)

    allocation['objectCodeName']= objectCodeDetail.code;
    allocation['costCenterName']= costCenterDetail.code;
    
    // Transform boolean fields from SQLite integers to JavaScript booleans
    const transformedAllocation = {
      ...allocation,
      q1Released: allocation.q1Released === 1,
      q2Released: allocation.q2Released === 1,
      q3Released: allocation.q3Released === 1,
      q4Released: allocation.q4Released === 1
    };
    
    res.json(transformedAllocation);
  } catch (error) {
    console.error(`Error in GET /api/budget-allocations/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve budget allocation', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if allocation exists
    const existingAllocation = await db.getBudgetAllocationById(id);
    if (!existingAllocation) {
      return res.status(404).json({ error: 'Budget allocation not found' });
    }
    
    // Update the allocation
    await db.updateBudgetAllocation(id, req.body);
    
    // Get the updated allocation
    const updatedAllocation = await db.getBudgetAllocationById(id);
    
    // Transform boolean fields from SQLite integers to JavaScript booleans
    const transformedAllocation = {
      ...updatedAllocation,
      q1Released: updatedAllocation.q1Released === 1,
      q2Released: updatedAllocation.q2Released === 1,
      q3Released: updatedAllocation.q3Released === 1,
      q4Released: updatedAllocation.q4Released === 1
    };
    
    res.json(transformedAllocation);
  } catch (error) {
    console.error(`Error in PUT /api/budget-allocations/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update budget allocation', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if allocation exists
    const existingAllocation = await db.getBudgetAllocationById(id);
    if (!existingAllocation) {
      return res.status(404).json({ error: 'Budget allocation not found' });
    }
    
    // Delete the allocation (this will cascade delete related entries)
    await db.deleteBudgetAllocation(id);
    
    res.json({ message: 'Budget allocation deleted successfully', id });
  } catch (error) {
    console.error('Error deleting budget allocation:', error);
    res.status(500).json({ error: error.message || 'Failed to delete budget allocation' });
  }
});

module.exports = router;
