const express = require('express');
const { body, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const EarningsController = require('../controllers/earningsController');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Get daily earnings
router.get('/daily', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('source').optional().isString().withMessage('Source must be a string')
], validateRequest, EarningsController.getDailyEarnings);

// Get today's earnings
router.get('/today', EarningsController.getTodayEarnings);

// Get earnings summary for date range
router.get('/summary', [
  query('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').isISO8601().withMessage('End date must be a valid ISO date')
], validateRequest, EarningsController.getEarningsSummary);

// Get user level and rewards
router.get('/level', EarningsController.getUserLevel);

// Add experience points
router.post('/experience', [
  body('amount').isInt({ min: 1 }).withMessage('Experience amount must be a positive integer'),
  body('source').optional().isString().withMessage('Source must be a string'),
  body('description').optional().isString().withMessage('Description must be a string')
], validateRequest, EarningsController.addExperience);

// Get level rewards
router.get('/rewards', EarningsController.getLevelRewards);

// Process daily login reward
router.post('/daily-login', EarningsController.processDailyLoginReward);

// Get earnings statistics
router.get('/stats', EarningsController.getEarningsStats);

module.exports = router;
