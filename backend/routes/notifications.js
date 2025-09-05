const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const NotificationController = require('../controllers/notificationController');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Basic validation
    const { page = 1, limit = 20, type, isRead } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }
    
    if (type && !['earnings', 'reward', 'news', 'withdrawal', 'system'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }
    
    // Call the controller
    await NotificationController.getUserNotifications(req, res);
  } catch (error) {
    console.error('Error in notifications route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
router.post('/', auth, async (req, res) => {
  try {
    // Basic validation
    const { userId, type, title, message, data } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type, title, message'
      });
    }
    
    if (!['earnings', 'reward', 'news', 'withdrawal', 'system'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }
    
    // Call the controller
    await NotificationController.createNotification(req, res);
  } catch (error) {
    console.error('Error in create notification route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (admin only)
// @access  Private (Admin)
router.get('/stats', adminAuth, NotificationController.getNotificationStats);

module.exports = router;
