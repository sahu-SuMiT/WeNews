const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/auth').adminAuth;
const NotificationController = require('../controllers/notificationController');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['earnings', 'reward', 'news', 'withdrawal', 'system']).withMessage('Invalid notification type'),
  query('isRead').optional().isBoolean().withMessage('isRead must be a boolean')
], NotificationController.getUserNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', auth, NotificationController.getUnreadCount);

// @route   PUT /api/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/:notificationId/read', auth, NotificationController.markAsRead);

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', auth, NotificationController.markAllAsRead);

// @route   DELETE /api/notifications/:notificationId
// @desc    Delete notification
// @access  Private
router.delete('/:notificationId', auth, NotificationController.deleteNotification);

// @route   POST /api/notifications
// @desc    Create notification (for testing/admin use)
// @access  Private
router.post('/', [
  auth,
  body('userId').notEmpty().withMessage('User ID is required'),
  body('type').isIn(['earnings', 'reward', 'news', 'withdrawal', 'system']).withMessage('Invalid notification type'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('data').optional().isObject().withMessage('Data must be an object')
], NotificationController.createNotification);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (admin only)
// @access  Private (Admin)
router.get('/stats', adminAuth, NotificationController.getNotificationStats);

module.exports = router;
