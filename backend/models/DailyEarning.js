const { db } = require('../config/firebase');

class DailyEarning {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.userId || '';
    this.date = data.date || new Date();
    this.amount = data.amount || 0;
    this.source = data.source || 'daily'; // daily, bonus, referral, etc.
    this.description = data.description || '';
    this.status = data.status || 'credited'; // credited, pending, cancelled
    this.metadata = data.metadata || {}; // additional data
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new daily earning
  static async create(earningData) {
    try {
      const earning = {
        userId: earningData.userId,
        date: earningData.date || new Date(),
        amount: earningData.amount,
        source: earningData.source || 'daily',
        description: earningData.description || '',
        status: earningData.status || 'credited',
        metadata: earningData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('dailyEarnings').add(earning);
      earning.id = docRef.id;
      
      return new DailyEarning(earning);
    } catch (error) {
      throw error;
    }
  }

  // Find daily earning by ID
  static async findById(id) {
    try {
      const doc = await db.collection('dailyEarnings').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      
      const earningData = { id: doc.id, ...doc.data() };
      return new DailyEarning(earningData);
    } catch (error) {
      throw error;
    }
  }

  // Get daily earnings for a user
  static async findByUserId(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 30,
        startDate = null,
        endDate = null,
        source = null
      } = options;

      let query = db.collection('dailyEarnings')
        .where('userId', '==', userId);

      if (source) {
        query = query.where('source', '==', source);
      }

      // Order by date
      query = query.orderBy('date', 'desc');

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const snapshot = await query.get();
      
      const earnings = [];
      snapshot.forEach(doc => {
        const earningData = { id: doc.id, ...doc.data() };
        earnings.push(new DailyEarning(earningData));
      });

      return earnings;
    } catch (error) {
      throw error;
    }
  }

  // Get total earnings for a user in date range
  static async getTotalEarnings(userId, startDate, endDate) {
    try {
      const snapshot = await db.collection('dailyEarnings')
        .where('userId', '==', userId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .where('status', '==', 'credited')
        .get();
      
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += data.amount || 0;
      });

      return total;
    } catch (error) {
      throw error;
    }
  }

  // Get today's earning for a user
  static async getTodayEarning(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const snapshot = await db.collection('dailyEarnings')
        .where('userId', '==', userId)
        .where('date', '>=', today)
        .where('date', '<', tomorrow)
        .where('status', '==', 'credited')
        .get();
      
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += data.amount || 0;
      });

      return total;
    } catch (error) {
      throw error;
    }
  }

  // Update earning status
  async updateStatus(newStatus) {
    try {
      this.status = newStatus;
      this.updatedAt = new Date();

      await db.collection('dailyEarnings').doc(this.id).update({
        status: this.status,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get earning summary
  getSummary() {
    return {
      id: this.id,
      userId: this.userId,
      date: this.date,
      amount: this.amount,
      source: this.source,
      description: this.description,
      status: this.status
    };
  }
}

module.exports = DailyEarning;
