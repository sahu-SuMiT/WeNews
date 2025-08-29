const express = require('express');
const { query } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Get dashboard overview
router.get('/overview', DashboardController.getDashboardOverview);

// Get quick stats
router.get('/stats', DashboardController.getQuickStats);

// Get earnings summary
router.get('/earnings', [
  query('period').optional().isIn(['today', 'week', 'month']).withMessage('Period must be today, week, or month')
], validateRequest, DashboardController.getEarningsSummary);

// Get user progress
router.get('/progress', DashboardController.getUserProgress);

module.exports = router;
