const Wallet = require('../models/Wallet');
const UserLevel = require('../models/UserLevel');
const DailyEarning = require('../models/DailyEarning');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Transaction = require('../models/Transaction');
const Label = require('../models/Label');

class DashboardController {
  // Get dashboard overview
  static async getDashboardOverview(req, res) {
    try {
      const userId = req.user.id;
      
      // Get all required data in parallel
      const [wallet, userLevel, todayEarning, pendingWithdrawals, recentTransactions] = await Promise.all([
        Wallet.findByUserId(userId),
        UserLevel.findByUserId(userId),
        DailyEarning.getTodayEarning(userId),
        WithdrawalRequest.findByUserId(userId, { status: 'pending' }),
        Transaction.findByUserId(userId, { page: 1, limit: 5 })
      ]);

      // Create wallet if it doesn't exist
      let userWallet = wallet;
      if (!userWallet) {
        userWallet = await Wallet.create(userId);
      }

      // Create user level if it doesn't exist
      let userUserLevel = userLevel;
      if (!userUserLevel) {
        userUserLevel = await UserLevel.create(userId);
      }

      // Get active labels count
      const allLabels = await Label.findAll({ isActive: true });
      const userData = {
        currentLevel: userUserLevel.currentLevel,
        totalEarnings: userWallet.totalEarnings,
        loginStreak: 0,
        totalReferrals: 0,
        newsReadCount: 0
      };

      let activeLabelsCount = 0;
      for (const label of allLabels) {
        const isUnlocked = await label.checkUnlockConditions(userData);
        if (isUnlocked) {
          activeLabelsCount++;
        }
      }

      const overview = {
        wallet: {
          balance: userWallet.balance,
          totalEarnings: userWallet.totalEarnings,
          totalWithdrawals: userWallet.totalWithdrawals
        },
        earnings: {
          today: todayEarning,
          level: userUserLevel.currentLevel,
          levelProgress: userUserLevel.levelProgress,
          experience: userUserLevel.currentExp,
          experienceForNextLevel: userUserLevel.getExpForNextLevel()
        },
        plans: {
          currentPlan: 'Base', // This would come from subscription model
          availablePlans: ['Base', 'Silver', 'Gold', 'Diamond']
        },
        notifications: {
          pendingWithdrawals: pendingWithdrawals.length,
          unreadCount: 0 // This would come from notifications model
        },
        labels: {
          activeCount: activeLabelsCount,
          totalAvailable: allLabels.length
        },
        recentActivity: {
          transactions: recentTransactions.map(t => t.getSummary()),
          lastLogin: new Date().toISOString()
        }
      };

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard overview',
        error: error.message
      });
    }
  }

  // Get quick stats
  static async getQuickStats(req, res) {
    try {
      const userId = req.user.id;
      
      const [wallet, userLevel, todayEarning, weekEarning, monthEarning] = await Promise.all([
        Wallet.findByUserId(userId),
        UserLevel.findByUserId(userId),
        DailyEarning.getTodayEarning(userId),
        DailyEarning.getTotalEarnings(userId, 
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
          new Date()
        ),
        DailyEarning.getTotalEarnings(userId, 
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
          new Date()
        )
      ]);

      const stats = {
        balance: wallet ? wallet.balance : 0,
        todayEarning: todayEarning || 0,
        weekEarning: weekEarning || 0,
        monthEarning: monthEarning || 0,
        level: userLevel ? userLevel.currentLevel : 1,
        levelProgress: userLevel ? userLevel.levelProgress : 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting quick stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get quick stats',
        error: error.message
      });
    }
  }

  // Get earnings summary
  static async getEarningsSummary(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'week' } = req.query;
      
      let startDate, endDate;
      const now = new Date();
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
      }

      const totalEarnings = await DailyEarning.getTotalEarnings(userId, startDate, endDate);
      
      const summary = {
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalEarnings,
        averageDaily: period === 'today' ? totalEarnings : 
          Math.round(totalEarnings / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))
      };

      res.json({
        success: true,
        data: summary
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

  // Get user progress
  static async getUserProgress(req, res) {
    try {
      const userId = req.user.id;
      
      const [userLevel, wallet] = await Promise.all([
        UserLevel.findByUserId(userId),
        Wallet.findByUserId(userId)
      ]);

      if (!userLevel) {
        return res.status(404).json({
          success: false,
          message: 'User level not found'
        });
      }

      const progress = {
        level: {
          current: userLevel.currentLevel,
          progress: userLevel.levelProgress,
          experience: userLevel.currentExp,
          experienceForNextLevel: userLevel.getExpForNextLevel(),
          totalExperience: userLevel.totalExp
        },
        earnings: {
          total: wallet ? wallet.totalEarnings : 0,
          thisMonth: 0, // Would be calculated from daily earnings
          target: 1000 // This would come from user preferences or goals
        },
        achievements: {
          total: userLevel.achievements.length,
          recent: userLevel.achievements.slice(-3) // Last 3 achievements
        }
      };

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error getting user progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user progress',
        error: error.message
      });
    }
  }
}

module.exports = DashboardController;
