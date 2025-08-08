const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const adjustments = await db.getBudgetAdjustment();
    
    // Map snake_case database fields to camelCase for frontend
    const formattedAdjustments = adjustments.map(newAdjustment => ({
    //   id: adjustment.id,
    //   date: adjustment.date,
    //   fromObjectCode: adjustment.from_object_code,
    //   fromCostCenter: adjustment.from_cost_center,
    //   toObjectCode: adjustment.to_object_code,
    //   toCostCenter: adjustment.to_cost_center,
    //   amount: adjustment.amount,
    //   type: adjustment.type,
    //   remarks: adjustment.remarks,
    //   financialYear: adjustment.financial_year,
    //   createdAt: adjustment.created_at,
    //   updatedAt: adjustment.updated_at
    id: newAdjustment.id,
    fromObjectCode: newAdjustment.fromObjectCode,
    fromObjectCodeId: newAdjustment.fromObjectCodeId,
    fromCostCenterId: newAdjustment.fromCostCenterId,
    fromCostCenter: newAdjustment.fromCostCenter,
    fromCostCenterName: newAdjustment.fromCostCenterName,
    toObjectCode: newAdjustment.toObjectCode,
    toObjectCodeId: newAdjustment.toObjectCodeId,
    toCostCenterId: newAdjustment.toCostCenterId,
    toCostCenter: newAdjustment.toCostCenter,
    toCostCenterName: newAdjustment.toCostCenterName,
    amount: newAdjustment.amountAllocated,
    budgetReleased: newAdjustment.budgetReleased,
    financialYear: newAdjustment.financialYear,
    period: newAdjustment.period,
    remarks: newAdjustment.remarks,
    dateCreated: newAdjustment.dateCreated
    }));
    
    res.json(formattedAdjustments);
  } catch (error) {
    console.error('Error fetching budget adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch budget adjustments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
    fromObjectCode,
    fromObjectCodeId,
    fromCostCenterId,
    fromCostCenter,
    fromCostCenterName,
    toObjectCode,
    toObjectCodeId,
    toCostCenterId,
    toCostCenter,
    toCostCenterName,
    amountAllocated,
    budgetReleased,
    financialYear,
    period,
    remarks,
    dateCreated,
    fromAllocation,
    toAllocation
} = req.body;
    
    // Convert camelCase to snake_case for database
    const newAdjustment = await db.createBudgetAdjustment(req.body)
    if (period == "surrender") {
      allocation = await db.getBudgetAllocationById(fromAllocation);
      allocation["surrenders"] = allocation.surrenders - budgetReleased;
      allocation["totalAllocation"] = allocation.totalAllocation + budgetReleased;
      allocation = await db.updateBudgetAllocation(fromAllocation, allocation)
    }
    
    if(period== "supplementary"){
      allocation = await db.getBudgetAllocationById(fromAllocation);
      allocation["supplementary"] = allocation.supplementary - budgetReleased;
      allocation["totalAllocation"] = allocation.totalAllocation + budgetReleased;
      allocation = await db.updateBudgetAllocation(fromAllocation, allocation)
    }
    if (period == "reappropriation") {
      fromAllocationBudget = await db.getBudgetAllocationById(fromAllocation);
      toAllocationBudget = await db.getBudgetAllocationById(toAllocation);

      fromAllocationBudget["surrenders"] = fromAllocationBudget.reappropriation - budgetReleased;
      fromAllocationBudget["totalAllocation"] = fromAllocationBudget.totalAllocation + budgetReleased;
      toAllocationBudget["surrenders"] = toAllocationBudget.reappropriation - budgetReleased;
      toAllocationBudget["totalAllocation"] = toAllocationBudget.totalAllocation - budgetReleased;

      allocation = await db.updateBudgetAllocation(fromAllocation, fromAllocationBudget)
      toAllocationBudget = await db.updateBudgetAllocation(toAllocation, toAllocationBudget)
    }
    // const newAdjustment = await db('budget_adjustments').where({ id }).first();
    
    // Convert back to camelCase for response
    const formattedAdjustment = {
    id: newAdjustment.id,
    fromObjectCode: newAdjustment.fromObjectCode,
    fromObjectCodeId: newAdjustment.fromObjectCodeId,
    fromCostCenterId: newAdjustment.fromCostCenterId,
    fromCostCenter: newAdjustment.fromCostCenter,
    fromCostCenterName: newAdjustment.fromCostCenterName,
    toObjectCode: newAdjustment.toObjectCode,
    toObjectCodeId: newAdjustment.toObjectCodeId,
    toCostCenterId: newAdjustment.toCostCenterId,
    toCostCenter: newAdjustment.toCostCenter,
    toCostCenterName: newAdjustment.toCostCenterName,
    amountAllocated: newAdjustment.amountAllocated,
    budgetReleased: newAdjustment.budgetReleased,
    financialYear: newAdjustment.financialYear,
    period: newAdjustment.period,
    remarks: newAdjustment.remarks,
    dateCreated: newAdjustment.dateCreated
};
    console.log("formattedAdjustment===========>",formattedAdjustment)
    res.status(201).json(formattedAdjustment);
  } catch (error) {
    console.error('Error creating budget adjustment:', error);
    res.status(500).json({ error: 'Failed to create budget adjustment' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      fromObjectCode,
      fromCostCenter,
      toObjectCode,
      toCostCenter,
      amount,
      type,
      remarks,
      financialYear
    } = req.body;
    
    await db('budget_adjustments').where({ id }).update({
      date,
      from_object_code: fromObjectCode,
      from_cost_center: fromCostCenter,
      to_object_code: toObjectCode,
      to_cost_center: toCostCenter,
      amount,
      type,
      remarks,
      financial_year: financialYear,
      updated_at: new Date()
    });
    
    const updated = await db('budget_adjustments').where({ id }).first();
    
    // Convert to camelCase for response
    const formattedAdjustment = {
      id: updated.id,
      date: updated.date,
      fromObjectCode: updated.from_object_code,
      fromCostCenter: updated.from_cost_center,
      toObjectCode: updated.to_object_code,
      toCostCenter: updated.to_cost_center,
      amount: updated.amount,
      type: updated.type,
      remarks: updated.remarks,
      financialYear: updated.financial_year,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };
    
    res.json(formattedAdjustment);
  } catch (error) {
    console.error('Error updating budget adjustment:', error);
    res.status(500).json({ error: 'Failed to update budget adjustment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existingAdjustment = await db.getBudgetAdjustmentById(id);
    if (!existingAdjustment) {
        return res.status(404).json({ error: 'Budget adjustment not found' });
    }
    if (existingAdjustment.period == "surrender") {
      allocation = await db.getBudgetAllocationById(existingAdjustment.fromAllocation);
      allocation["surrenders"] = allocation.surrenders + existingAdjustment.budgetReleased;
      allocation["totalAllocation"] = allocation.totalAllocation - existingAdjustment.budgetReleased;
      allocation = await db.updateBudgetAllocation(existingAdjustment.fromAllocation, allocation)
    }
    if(existingAdjustment.period =="supplementary"){
      allocation = await db.getBudgetAllocationById(existingAdjustment.fromAllocation);
      allocation["supplementary"] = allocation.supplementary + existingAdjustment.budgetReleased;
      allocation["totalAllocation"] = allocation.totalAllocation - existingAdjustment.budgetReleased;
      allocation = await db.updateBudgetAllocation(existingAdjustment.fromAllocation, allocation)
    }
    
    if (existingAdjustment.period == "reappropriation") {
      fromAllocationBudget = await db.getBudgetAllocationById(existingAdjustment.fromAllocation);
      toAllocationBudget = await db.getBudgetAllocationById(existingAdjustment.toAllocation);

      fromAllocationBudget["reappropriation"] = fromAllocationBudget.reappropriation + existingAdjustment.budgetReleased;
      fromAllocationBudget["totalAllocation"] = fromAllocationBudget.totalAllocation - existingAdjustment.budgetReleased;
      toAllocationBudget["reappropriation"] = toAllocationBudget.reappropriation + existingAdjustment.budgetReleased;
      toAllocationBudget["totalAllocation"] = toAllocationBudget.totalAllocation + existingAdjustment.budgetReleased;

      allocation = await db.updateBudgetAllocation(existingAdjustment.fromAllocation, fromAllocationBudget)
      toAllocationBudget = await db.updateBudgetAllocation(existingAdjustment.toAllocation, toAllocationBudget)
    }

    
    await db.deleteBudgetAdjustment(id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting budget adjustment:', error);
    res.status(500).json({ error: 'Failed to delete budget adjustment' });
  }
});


module.exports = router;
