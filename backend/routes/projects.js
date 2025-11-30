const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { store } = require('../models/store');
const { authenticate, checkModuleAccess } = require('../middleware/auth');

/**
 * GET /api/projects
 * List all projects
 */
router.get('/', authenticate, checkModuleAccess('projects'), (req, res) => {
  const projects = (store.projects || []).filter(p => p.companyId === req.user.companyId);
  
  res.json({
    success: true,
    data: projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    count: projects.length
  });
});

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get('/:id', authenticate, checkModuleAccess('projects'), (req, res) => {
  const project = (store.projects || []).find(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Proje bulunamadı'
    });
  }

  res.json({
    success: true,
    data: project
  });
});

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', authenticate, checkModuleAccess('projects'), (req, res) => {
  const { 
    name,
    description,
    customerId,
    customerName,
    startDate,
    endDate,
    budget,
    priority = 'medium',
    assignedTo = []
  } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Proje adı gerekli'
    });
  }

  if (!store.projects) store.projects = [];

  const newProject = {
    id: uuidv4(),
    companyId: req.user.companyId,
    projectNumber: `PRJ-${new Date().getFullYear()}-${String(store.projects.length + 1).padStart(4, '0')}`,
    name,
    description,
    customerId,
    customerName,
    startDate: startDate || new Date().toISOString(),
    endDate,
    budget: budget ? parseFloat(budget) : null,
    spent: 0,
    priority, // low, medium, high, urgent
    status: 'planning', // planning, in_progress, on_hold, completed, cancelled
    progress: 0,
    assignedTo,
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.id
  };

  store.projects.push(newProject);

  res.status(201).json({
    success: true,
    data: newProject
  });
});

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put('/:id', authenticate, checkModuleAccess('projects'), (req, res) => {
  if (!store.projects) store.projects = [];
  
  const project = store.projects.find(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Proje bulunamadı'
    });
  }

  const allowedFields = ['name', 'description', 'endDate', 'budget', 'priority', 'status', 'progress', 'assignedTo'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      project[field] = req.body[field];
    }
  });

  project.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: project
  });
});

/**
 * POST /api/projects/:id/tasks
 * Add task to project
 */
router.post('/:id/tasks', authenticate, checkModuleAccess('projects'), (req, res) => {
  if (!store.projects) store.projects = [];
  
  const project = store.projects.find(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Proje bulunamadı'
    });
  }

  const { title, description, assignedTo, dueDate, priority = 'medium' } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      error: 'Görev başlığı gerekli'
    });
  }

  const newTask = {
    id: uuidv4(),
    title,
    description,
    assignedTo,
    dueDate,
    priority,
    status: 'todo', // todo, in_progress, done
    createdAt: new Date().toISOString()
  };

  project.tasks.push(newTask);
  project.updatedAt = new Date().toISOString();

  // Recalculate progress
  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  project.progress = project.tasks.length > 0 ? Math.round((completedTasks / project.tasks.length) * 100) : 0;

  res.status(201).json({
    success: true,
    data: newTask
  });
});

/**
 * PUT /api/projects/:id/tasks/:taskId
 * Update task
 */
router.put('/:id/tasks/:taskId', authenticate, checkModuleAccess('projects'), (req, res) => {
  if (!store.projects) store.projects = [];
  
  const project = store.projects.find(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Proje bulunamadı'
    });
  }

  const task = project.tasks.find(t => t.id === req.params.taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Görev bulunamadı'
    });
  }

  const allowedFields = ['title', 'description', 'assignedTo', 'dueDate', 'priority', 'status'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  });

  // Recalculate progress
  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  project.progress = project.tasks.length > 0 ? Math.round((completedTasks / project.tasks.length) * 100) : 0;

  project.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: task
  });
});

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', authenticate, checkModuleAccess('projects'), (req, res) => {
  if (!store.projects) store.projects = [];
  
  const index = store.projects.findIndex(
    p => p.id === req.params.id && p.companyId === req.user.companyId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Proje bulunamadı'
    });
  }

  store.projects.splice(index, 1);

  res.json({
    success: true,
    message: 'Proje silindi'
  });
});

/**
 * GET /api/projects/stats/summary
 * Get project statistics
 */
router.get('/stats/summary', authenticate, checkModuleAccess('projects'), (req, res) => {
  const projects = (store.projects || []).filter(p => p.companyId === req.user.companyId);

  const stats = {
    total: projects.length,
    byStatus: {
      planning: projects.filter(p => p.status === 'planning').length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      onHold: projects.filter(p => p.status === 'on_hold').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    },
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    totalSpent: projects.reduce((sum, p) => sum + (p.spent || 0), 0),
    averageProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0
  };

  res.json({
    success: true,
    data: stats
  });
});

module.exports = router;
