const express = require('express');
const { body, query, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { auth, adminAuth } = require('../middleware/auth');
const LabelsController = require('../controllers/labelsController');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Get user's active labels
router.get('/active', LabelsController.getActiveLabels);

// Get label details with unlock conditions
router.get('/:labelId', [
  param('labelId').notEmpty().withMessage('Label ID is required')
], validateRequest, LabelsController.getLabelDetails);

// Claim label reward
router.post('/:labelId/claim', [
  param('labelId').notEmpty().withMessage('Label ID is required')
], validateRequest, LabelsController.claimLabelReward);

// Get user achievements summary
router.get('/achievements/summary', LabelsController.getUserAchievements);

// Get all available labels (for discovery)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string')
], validateRequest, LabelsController.getAllLabels);

// Admin routes
router.use(adminAuth);

// Create new label (Admin only)
router.post('/', [
  body('name').notEmpty().withMessage('Label name is required'),
  body('description').notEmpty().withMessage('Label description is required'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('reward').optional().isFloat({ min: 0 }).withMessage('Reward must be a non-negative number'),
  body('unlockConditions').optional().isArray().withMessage('Unlock conditions must be an array'),
  body('category').optional().isString().withMessage('Category must be a string')
], validateRequest, LabelsController.createLabel);

// Update label (Admin only)
router.put('/:labelId', [
  param('labelId').notEmpty().withMessage('Label ID is required'),
  body('name').optional().isString().withMessage('Name must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('reward').optional().isFloat({ min: 0 }).withMessage('Reward must be a non-negative number'),
  body('unlockConditions').optional().isArray().withMessage('Unlock conditions must be an array'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], validateRequest, LabelsController.updateLabel);

module.exports = router;
