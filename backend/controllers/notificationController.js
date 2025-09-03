const Notification = require('../models/Notification');

class NotificationController {
  // Get user notifications
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type = null, isRead = null } = req.query;

      const result = await Notification.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : null
      });

      res.json({
        success: true,
        data: {
          notifications: result.notifications.map(n => n.getSummary()),
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications',
        error: error.message
      });
    }
  }

  // Get unread count
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      if (notification.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await notification.markAsRead();

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification.getSummary()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${count} notifications marked as read`,
        data: { markedCount: count }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      if (notification.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await notification.delete();

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  // Create notification (for testing or admin use)
  static async createNotification(req, res) {
    try {
      const { userId, type, title, message, data } = req.body;

      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data
      });

      res.json({
        success: true,
        message: 'Notification created successfully',
        data: notification.getSummary()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message
      });
    }
  }

  // Get notification statistics (admin only)
  static async getNotificationStats(req, res) {
    try {
      // This would require more complex queries to get statistics
      // For now, return basic stats
      const stats = {
        totalNotifications: 0,
        unreadNotifications: 0,
        notificationsByType: {
          earnings: 0,
          reward: 0,
          news: 0,
          withdrawal: 0,
          system: 0
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;
