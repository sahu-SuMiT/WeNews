const { db } = require('../config/firebase');

class UserLevel {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.userId || '';
    this.currentLevel = data.currentLevel || 1;
    this.currentExp = data.currentExp || 0;
    this.totalExp = data.totalExp || 0;
    this.levelProgress = data.levelProgress || 0; // percentage to next level
    this.lastLevelUp = data.lastLevelUp || new Date();
    this.achievements = data.achievements || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new user level record
  static async create(userId) {
    try {
      const userLevel = {
        userId,
        currentLevel: 1,
        currentExp: 0,
        totalExp: 0,
        levelProgress: 0,
        lastLevelUp: new Date(),
        achievements: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('userLevels').add(userLevel);
      userLevel.id = docRef.id;
      
      return new UserLevel(userLevel);
    } catch (error) {
      throw error;
    }
  }

  // Find user level by user ID
  static async findByUserId(userId) {
    try {
      const snapshot = await db.collection('userLevels')
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const userLevelData = { id: doc.id, ...doc.data() };
      return new UserLevel(userLevelData);
    } catch (error) {
      throw error;
    }
  }

  // Add experience points
  async addExperience(expAmount) {
    try {
      this.currentExp += expAmount;
      this.totalExp += expAmount;
      
      // Check if level up is possible
      const newLevel = this.calculateLevel(this.currentExp);
      if (newLevel > this.currentLevel) {
        this.currentLevel = newLevel;
        this.lastLevelUp = new Date();
      }
      
      // Calculate progress to next level
      this.levelProgress = this.calculateLevelProgress(this.currentExp);
      
      this.updatedAt = new Date();

      await db.collection('userLevels').doc(this.id).update({
        currentExp: this.currentExp,
        totalExp: this.totalExp,
        currentLevel: this.currentLevel,
        levelProgress: this.levelProgress,
        lastLevelUp: this.lastLevelUp,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Calculate level based on experience
  calculateLevel(exp) {
    // Level calculation formula: level = floor(sqrt(exp / 100)) + 1
    // This creates a progression where higher levels require more exp
    const level = Math.floor(Math.sqrt(exp / 100)) + 1;
    return Math.min(level, 12); // Cap at level 12
  }

  // Calculate progress percentage to next level
  calculateLevelProgress(exp) {
    const currentLevel = this.calculateLevel(exp);
    if (currentLevel >= 12) return 100; // Max level reached
    
    const expForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
    const expForNextLevel = Math.pow(currentLevel, 2) * 100;
    const expInCurrentLevel = exp - expForCurrentLevel;
    const expNeededForLevel = expForNextLevel - expForCurrentLevel;
    
    return Math.round((expInCurrentLevel / expNeededForLevel) * 100);
  }

  // Get experience required for next level
  getExpForNextLevel() {
    if (this.currentLevel >= 12) return 0;
    
    const expForNextLevel = Math.pow(this.currentLevel, 2) * 100;
    return expForNextLevel - this.currentExp;
  }

  // Add achievement
  async addAchievement(achievement) {
    try {
      if (!this.achievements.find(a => a.id === achievement.id)) {
        this.achievements.push({
          ...achievement,
          unlockedAt: new Date()
        });
        
        this.updatedAt = new Date();

        await db.collection('userLevels').doc(this.id).update({
          achievements: this.achievements,
          updatedAt: this.updatedAt
        });
      }

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get level summary
  getSummary() {
    return {
      id: this.id,
      userId: this.userId,
      currentLevel: this.currentLevel,
      currentExp: this.currentExp,
      totalExp: this.totalExp,
      levelProgress: this.levelProgress,
      expForNextLevel: this.getExpForNextLevel(),
      lastLevelUp: this.lastLevelUp,
      achievements: this.achievements,
      isActive: this.isActive
    };
  }
}

module.exports = UserLevel;
