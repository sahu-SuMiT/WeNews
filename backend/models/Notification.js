const db = require('../config/firebase');

class Notification {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.userId;
    this.type = data.type; // 'earnings', 'reward', 'news', 'withdrawal', 'system'
    this.title = data.title;
    this.message = data.message;
    this.data = data.data || {}; // Additional data for the notification
    this.isRead = data.isRead || false;
    this.isSent = data.isSent || false;
    this.scheduledFor = data.scheduledFor || null; // For scheduled notifications
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new notification
  static async create(notificationData) {
    try {
      const notification = {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        isRead: false,
        isSent: false,
        scheduledFor: notificationData.scheduledFor || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('notifications').add(notification);
      notification.id = docRef.id;
      
      return new Notification(notification);
    } catch (error) {
      throw error;
    }
  }

  // Find notification by ID
  static async findById(id) {
    try {
      const doc = await db.collection('notifications').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      
      const data = { id: doc.id, ...doc.data() };
      return new Notification(data);
    } catch (error) {
      throw error;
    }
  }

  // Find notifications by user ID
  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 20, type = null, isRead = null } = options;
      let query = db.collection('notifications').where('userId', '==', userId);

      if (type) {
        query = query.where('type', '==', type);
      }

      if (isRead !== null) {
        query = query.where('isRead', '==', isRead);
      }

      query = query.orderBy('createdAt', 'desc');

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const snapshot = await query.get();
      const notifications = [];
      
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        notifications.push(new Notification(data));
      });

      return {
        notifications: notifications.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: notifications.length,
          totalPages: Math.ceil(notifications.length / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead() {
    try {
      await db.collection('notifications').doc(this.id).update({
        isRead: true,
        updatedAt: new Date()
      });
      
      this.isRead = true;
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as sent
  async markAsSent() {
    try {
      await db.collection('notifications').doc(this.id).update({
        isSent: true,
        updatedAt: new Date()
      });
      
      this.isSent = true;
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  async delete() {
    try {
      await db.collection('notifications').doc(this.id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get notification summary
  getSummary() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      message: this.message,
      data: this.data,
      isRead: this.isRead,
      isSent: this.isSent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create notification for earnings
  static async createEarningsNotification(userId, amount, source) {
    return await this.create({
      userId,
      type: 'earnings',
      title: 'New Earnings!',
      message: `You earned ₹${amount} from ${source}`,
      data: { amount, source }
    });
  }

  // Create notification for reward
  static async createRewardNotification(userId, rewardName, rewardAmount) {
    return await this.create({
      userId,
      type: 'reward',
      title: 'Reward Unlocked!',
      message: `You unlocked "${rewardName}" and earned ₹${rewardAmount}`,
      data: { rewardName, rewardAmount }
    });
  }

  // Create notification for withdrawal
  static async createWithdrawalNotification(userId, amount, status) {
    const statusMessages = {
      'pending': 'Your withdrawal request is being processed',
      'approved': 'Your withdrawal has been approved',
      'completed': 'Your withdrawal has been completed',
      'rejected': 'Your withdrawal request was rejected'
    };

    return await this.create({
      userId,
      type: 'withdrawal',
      title: 'Withdrawal Update',
      message: statusMessages[status] || 'Withdrawal status updated',
      data: { amount, status }
    });
  }

  // Create notification for news
  static async createNewsNotification(userId, articleTitle, category) {
    return await this.create({
      userId,
      type: 'news',
      title: 'New Article',
      message: `New article in ${category}: ${articleTitle}`,
      data: { articleTitle, category }
    });
  }

  // Create system notification
  static async createSystemNotification(userId, title, message, data = {}) {
    return await this.create({
      userId,
      type: 'system',
      title,
      message,
      data
    });
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .get();
      
      return snapshot.size;
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId) {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .get();

      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          isRead: true,
          updatedAt: new Date()
        });
      });

      await batch.commit();
      return snapshot.size;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Notification;
