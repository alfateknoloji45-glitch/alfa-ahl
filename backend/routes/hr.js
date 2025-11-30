const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store } = require('../models/store');
const { authenticate, checkModuleAccess } = require('../middleware/auth');

/**
 * GET /api/hr/employees
 * List all employees
 */
router.get('/employees', authenticate, checkModuleAccess('hr'), (req, res) => {
  const employees = (store.employees || []).filter(e => e.companyId === req.user.companyId);
  
  res.json({
    success: true,
    data: employees,
    count: employees.length
  });
});

/**
 * GET /api/hr/employees/:id
 * Get employee by ID
 */
router.get('/employees/:id', authenticate, checkModuleAccess('hr'), (req, res) => {
  const employee = (store.employees || []).find(
    e => e.id === req.params.id && e.companyId === req.user.companyId
  );

  if (!employee) {
    return res.status(404).json({
      success: false,
      error: 'Çalışan bulunamadı'
    });
  }

  res.json({
    success: true,
    data: employee
  });
});

/**
 * POST /api/hr/employees
 * Create new employee
 */
router.post('/employees', authenticate, checkModuleAccess('hr'), (req, res) => {
  const { 
    firstName,
    lastName,
    email,
    phone,
    department,
    position,
    salary,
    startDate,
    employmentType = 'full-time',
    address,
    emergencyContact
  } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Ad ve soyad gerekli'
    });
  }

  if (!store.employees) store.employees = [];

  const newEmployee = {
    id: uuidv4(),
    companyId: req.user.companyId,
    employeeNumber: `EMP-${String(store.employees.length + 1).padStart(4, '0')}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email,
    phone,
    department,
    position,
    salary: salary ? parseFloat(salary) : null,
    startDate: startDate || new Date().toISOString(),
    employmentType,
    address,
    emergencyContact,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.employees.push(newEmployee);

  res.status(201).json({
    success: true,
    data: newEmployee
  });
});

/**
 * PUT /api/hr/employees/:id
 * Update employee
 */
router.put('/employees/:id', authenticate, checkModuleAccess('hr'), (req, res) => {
  if (!store.employees) store.employees = [];
  
  const employee = store.employees.find(
    e => e.id === req.params.id && e.companyId === req.user.companyId
  );

  if (!employee) {
    return res.status(404).json({
      success: false,
      error: 'Çalışan bulunamadı'
    });
  }

  const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'department', 'position', 'salary', 'employmentType', 'address', 'emergencyContact', 'status'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      employee[field] = req.body[field];
    }
  });

  if (req.body.firstName || req.body.lastName) {
    employee.fullName = `${employee.firstName} ${employee.lastName}`;
  }

  employee.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: employee
  });
});

/**
 * DELETE /api/hr/employees/:id
 * Deactivate employee (soft delete)
 */
router.delete('/employees/:id', authenticate, checkModuleAccess('hr'), (req, res) => {
  if (!store.employees) store.employees = [];
  
  const employee = store.employees.find(
    e => e.id === req.params.id && e.companyId === req.user.companyId
  );

  if (!employee) {
    return res.status(404).json({
      success: false,
      error: 'Çalışan bulunamadı'
    });
  }

  employee.status = 'inactive';
  employee.terminationDate = new Date().toISOString();
  employee.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Çalışan pasif duruma alındı',
    data: employee
  });
});

/**
 * GET /api/hr/departments
 * Get department list
 */
router.get('/departments', authenticate, checkModuleAccess('hr'), (req, res) => {
  const employees = (store.employees || []).filter(e => e.companyId === req.user.companyId);
  
  const departments = {};
  employees.forEach(e => {
    const dept = e.department || 'Tanımsız';
    if (!departments[dept]) {
      departments[dept] = { count: 0, employees: [] };
    }
    departments[dept].count++;
    departments[dept].employees.push({
      id: e.id,
      name: e.fullName,
      position: e.position
    });
  });

  res.json({
    success: true,
    data: Object.entries(departments).map(([name, data]) => ({
      name,
      ...data
    }))
  });
});

/**
 * GET /api/hr/stats
 * Get HR statistics
 */
router.get('/stats', authenticate, checkModuleAccess('hr'), (req, res) => {
  const employees = (store.employees || []).filter(e => e.companyId === req.user.companyId);
  const activeEmployees = employees.filter(e => e.status === 'active');

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: activeEmployees.length,
    departments: [...new Set(activeEmployees.map(e => e.department).filter(Boolean))].length,
    employmentTypes: {
      fullTime: activeEmployees.filter(e => e.employmentType === 'full-time').length,
      partTime: activeEmployees.filter(e => e.employmentType === 'part-time').length,
      contract: activeEmployees.filter(e => e.employmentType === 'contract').length
    },
    totalPayroll: activeEmployees.reduce((sum, e) => sum + (e.salary || 0), 0)
  };

  res.json({
    success: true,
    data: stats
  });
});

module.exports = router;
