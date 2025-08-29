const { db } = require('../config/firebase');

class Label {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.icon = data.icon || '';
    this.color = data.color || '#000000';
    this.reward = data.reward || 0; // reward amount when unlocked
    this.unlockConditions = data.unlockConditions || [];
    this.category = data.category || 'general'; // achievement, milestone, special
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new label
  static async create(labelData) {
    try {
      const label = {
        name: labelData.name,
        description: labelData.description,
        icon: labelData.icon || '',
        color: labelData.color || '#000000',
        reward: labelData.reward || 0,
        unlockConditions: labelData.unlockConditions || [],
        category: labelData.category || 'general',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('labels').add(label);
      label.id = docRef.id;
      
      return new Label(label);
    } catch (error) {
      throw error;
    }
  }

  // Find label by ID
  static async findById(id) {
    try {
      const doc = await db.collection('labels').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      
      const labelData = { id: doc.id, ...doc.data() };
      return new Label(labelData);
    } catch (error) {
      throw error;
    }
  }

  // Find label by name
  static async findByName(name) {
    try {
      const snapshot = await db.collection('labels')
        .where('name', '==', name)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const labelData = { id: doc.id, ...doc.data() };
      return new Label(labelData);
    } catch (error) {
      throw error;
    }
  }

  // Get all active labels
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        category = null,
        isActive = true
      } = options;

      let query = db.collection('labels')
        .where('isActive', '==', isActive);

      if (category) {
        query = query.where('category', '==', category);
      }

      // Order by creation date
      query = query.orderBy('createdAt', 'desc');

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const snapshot = await query.get();
      
      const labels = [];
      snapshot.forEach(doc => {
        const labelData = { id: doc.id, ...doc.data() };
        labels.push(new Label(labelData));
      });

      return labels;
    } catch (error) {
      throw error;
    }
  }

  // Check if user meets unlock conditions
  async checkUnlockConditions(userData) {
    try {
      if (!this.unlockConditions || this.unlockConditions.length === 0) {
        return true; // No conditions means always unlocked
      }

      for (const condition of this.unlockConditions) {
        const { type, value, operator = 'gte' } = condition;
        
        let userValue = 0;
        switch (type) {
          case 'daily_login_streak':
            userValue = userData.loginStreak || 0;
            break;
          case 'total_earnings':
            userValue = userData.totalEarnings || 0;
            break;
          case 'level':
            userValue = userData.currentLevel || 1;
            break;
          case 'referrals':
            userValue = userData.totalReferrals || 0;
            break;
          case 'news_read':
            userValue = userData.newsReadCount || 0;
            break;
          default:
            userValue = 0;
        }

        let conditionMet = false;
        switch (operator) {
          case 'gte':
            conditionMet = userValue >= value;
            break;
          case 'lte':
            conditionMet = userValue <= value;
            break;
          case 'eq':
            conditionMet = userValue === value;
            break;
          case 'gt':
            conditionMet = userValue > value;
            break;
          case 'lt':
            conditionMet = userValue < value;
            break;
          default:
            conditionMet = userValue >= value;
        }

        if (!conditionMet) {
          return false; // One condition failed
        }
      }

      return true; // All conditions met
    } catch (error) {
      throw error;
    }
  }

  // Update label
  async update(updateData) {
    try {
      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };

      // Don't allow updating certain fields
      delete updateFields.id;
      delete updateFields.createdAt;

      await db.collection('labels').doc(this.id).update(updateFields);
      
      // Update local instance
      Object.assign(this, updateFields);
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get label summary
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      color: this.color,
      reward: this.reward,
      unlockConditions: this.unlockConditions,
      category: this.category,
      isActive: this.isActive
    };
  }
}

module.exports = Label;
