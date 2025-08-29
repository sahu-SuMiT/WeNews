const DailyEarning = require('../models/DailyEarning');
const UserLevel = require('../models/UserLevel');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

class EarningsController {
  // Get daily earnings
  static async getDailyEarnings(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 30, source } = req.query;

      const earnings = await DailyEarning.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        source
      });

      const earningSummaries = earnings.map(e => e.getSummary());

      res.json({
        success: true,
        data: earningSummaries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: earningSummaries.length
        }
      });
    } catch (error) {
      console.error('Error getting daily earnings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get daily earnings',
        error: error.message
      });
    }
  }

  // Get today's earnings
  static async getTodayEarnings(req, res) {
    try {
      const userId = req.user.id;
      
      const todayEarning = await DailyEarning.getTodayEarning(userId);

      res.json({
        success: true,
        data: {
          amount: todayEarning,
          date: new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Error getting today\'s earnings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get today\'s earnings',
        error: error.message
      });
    }
  }

  // Get earnings summary for date range
  static async getEarningsSummary(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const totalEarnings = await DailyEarning.getTotalEarnings(userId, start, end);

      res.json({
        success: true,
        data: {
          totalEarnings,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Error getting earnings summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get earnings summary',
        error: error.message
      });
    }
  }

  // Get user level and rewards
  static async getUserLevel(req, res) {
    try {
      const userId = req.user.id;
      
      let userLevel = await UserLevel.findByUserId(userId);
      if (!userLevel) {
        // Create user level if it doesn't exist
        userLevel = await UserLevel.create(userId);
      }

      res.json({
        success: true,
        data: userLevel.getSummary()
      });
    } catch (error) {
      console.error('Error getting user level:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user level',
        error: error.message
      });
    }
  }

  // Add experience points
  static async addExperience(req, res) {
    try {
      const userId = req.user.id;
      const { amount, source, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid experience amount'
        });
      }

      let userLevel = await UserLevel.findByUserId(userId);
      if (!userLevel) {
        userLevel = await UserLevel.create(userId);
      }

      // Add experience
      await userLevel.addExperience(amount);

      // Check if level up occurred
      const levelUp = userLevel.currentLevel > (userLevel.currentLevel - amount);

      res.json({
        success: true,
        message: 'Experience added successfully',
        data: {
          ...userLevel.getSummary(),
          levelUp,
          experienceAdded: amount
        }
      });
    } catch (error) {
      console.error('Error adding experience:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add experience',
        error: error.message
      });
    }
  }

  // Get level rewards
  static async getLevelRewards(req, res) {
    try {
      const userId = req.user.id;
      
      const userLevel = await UserLevel.findByUserId(userId);
      if (!userLevel) {
        return res.status(404).json({
          success: false,
          message: 'User level not found'
        });
      }

      // Define level rewards (L1-L12)
      const levelRewards = [
        { level: 1, reward: 10, title: 'Beginner' },
        { level: 2, reward: 25, title: 'Novice' },
        { level: 3, reward: 50, title: 'Apprentice' },
        { level: 4, reward: 100, title: 'Explorer' },
        { level: 5, reward: 200, title: 'Adventurer' },
        { level: 6, reward: 350, title: 'Veteran' },
        { level: 7, reward: 500, title: 'Expert' },
        { level: 8, reward: 750, title: 'Master' },
        { level: 9, reward: 1000, title: 'Grandmaster' },
        { level: 10, reward: 1500, title: 'Legend' },
        { level: 11, reward: 2500, title: 'Mythic' },
        { level: 12, reward: 5000, title: 'Divine' }
      ];

      const currentLevelData = levelRewards.find(r => r.level === userLevel.currentLevel);
      const nextLevelData = levelRewards.find(r => r.level === userLevel.currentLevel + 1);

      const rewards = {
        currentLevel: userLevel.currentLevel,
        currentLevelData,
        nextLevelData,
        progress: userLevel.levelProgress,
        experience: userLevel.currentExp,
        experienceForNextLevel: userLevel.getExpForNextLevel(),
        achievements: userLevel.achievements
      };

      res.json({
        success: true,
        data: rewards
      });
    } catch (error) {
      console.error('Error getting level rewards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get level rewards',
        error: error.message
      });
    }
  }

  // Process daily login reward
  static async processDailyLoginReward(req, res) {
    try {
      const userId = req.user.id;
      
      // Check if already claimed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingEarning = await DailyEarning.findByUserId(userId, {
        startDate: today,
        endDate: tomorrow,
        source: 'daily_login'
      });

      if (existingEarning.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Daily login reward already claimed today'
        });
      }

      // Calculate daily reward (base amount + level bonus)
      const userLevel = await UserLevel.findByUserId(userId);
      const baseReward = 5;
      const levelBonus = userLevel ? Math.floor(userLevel.currentLevel * 0.5) : 0;
      const totalReward = baseReward + levelBonus;

      // Create daily earning record
      const dailyEarning = await DailyEarning.create({
        userId,
        amount: totalReward,
        source: 'daily_login',
        description: 'Daily login reward',
        status: 'credited'
      });

      // Update wallet
      let wallet = await Wallet.findByUserId(userId);
      if (!wallet) {
        wallet = await Wallet.create(userId);
      }
      await wallet.updateBalance(totalReward, 'credit');

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'credit',
        amount: totalReward,
        description: 'Daily login reward',
        status: 'completed',
        reference: dailyEarning.id,
        metadata: { source: 'daily_login' }
      });

      // Add experience for daily login
      if (userLevel) {
        await userLevel.addExperience(10); // 10 XP for daily login
      }

      res.json({
        success: true,
        message: 'Daily login reward claimed successfully',
        data: {
          reward: totalReward,
          baseReward,
          levelBonus,
          experience: 10
        }
      });
    } catch (error) {
      console.error('Error processing daily login reward:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process daily login reward',
        error: error.message
      });
    }
  }

  // Get earnings statistics
  static async getEarningsStats(req, res) {
    try {
      const userId = req.user.id;
      
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [todayEarning, weekEarning, monthEarning] = await Promise.all([
        DailyEarning.getTodayEarning(userId),
        DailyEarning.getTotalEarnings(userId, weekAgo, today),
        DailyEarning.getTotalEarnings(userId, monthAgo, today)
      ]);

      const stats = {
        today: todayEarning,
        thisWeek: weekEarning,
        thisMonth: monthEarning,
        date: today.toISOString().split('T')[0]
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting earnings stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get earnings statistics',
        error: error.message
      });
    }
  }
}

module.exports = EarningsController;
