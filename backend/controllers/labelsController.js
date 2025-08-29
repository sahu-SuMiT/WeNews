const Label = require('../models/Label');
const UserLevel = require('../models/UserLevel');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

class LabelsController {
  // Get user's active labels
  static async getActiveLabels(req, res) {
    try {
      const userId = req.user.id;
      
      // Get all active labels
      const allLabels = await Label.findAll({ isActive: true });
      
      // Get user data to check unlock conditions
      const userLevel = await UserLevel.findByUserId(userId);
      const wallet = await Wallet.findByUserId(userId);
      
      const userData = {
        currentLevel: userLevel ? userLevel.currentLevel : 1,
        totalEarnings: wallet ? wallet.totalEarnings : 0,
        loginStreak: 0, // This would come from user model
        totalReferrals: 0, // This would come from user model
        newsReadCount: 0 // This would come from user model
      };

      // Check which labels are unlocked for this user
      const activeLabels = [];
      for (const label of allLabels) {
        const isUnlocked = await label.checkUnlockConditions(userData);
        if (isUnlocked) {
          activeLabels.push({
            ...label.getSummary(),
            isUnlocked: true
          });
        }
      }

      res.json({
        success: true,
        data: activeLabels
      });
    } catch (error) {
      console.error('Error getting active labels:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active labels',
        error: error.message
      });
    }
  }

  // Get label details with unlock conditions
  static async getLabelDetails(req, res) {
    try {
      const { labelId } = req.params;
      const userId = req.user.id;
      
      const label = await Label.findById(labelId);
      if (!label) {
        return res.status(404).json({
          success: false,
          message: 'Label not found'
        });
      }

      // Get user data to check unlock conditions
      const userLevel = await UserLevel.findByUserId(userId);
      const wallet = await Wallet.findByUserId(userId);
      
      const userData = {
        currentLevel: userLevel ? userLevel.currentLevel : 1,
        totalEarnings: wallet ? wallet.totalEarnings : 0,
        loginStreak: 0,
        totalReferrals: 0,
        newsReadCount: 0
      };

      const isUnlocked = await label.checkUnlockConditions(userData);

      const labelData = {
        ...label.getSummary(),
        isUnlocked,
        userProgress: this.getUserProgressForLabel(label, userData)
      };

      res.json({
        success: true,
        data: labelData
      });
    } catch (error) {
      console.error('Error getting label details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get label details',
        error: error.message
      });
    }
  }

  // Get user progress for a specific label
  static getUserProgressForLabel(label, userData) {
    const progress = {};
    
    if (label.unlockConditions && label.unlockConditions.length > 0) {
      for (const condition of label.unlockConditions) {
        const { type, value } = condition;
        
        let currentValue = 0;
        let targetValue = value;
        
        switch (type) {
          case 'daily_login_streak':
            currentValue = userData.loginStreak || 0;
            break;
          case 'total_earnings':
            currentValue = userData.totalEarnings || 0;
            break;
          case 'level':
            currentValue = userData.currentLevel || 1;
            break;
          case 'referrals':
            currentValue = userData.totalReferrals || 0;
            break;
          case 'news_read':
            currentValue = userData.newsReadCount || 0;
            break;
          default:
            currentValue = 0;
        }
        
        progress[type] = {
          current: currentValue,
          target: targetValue,
          percentage: Math.min(Math.round((currentValue / targetValue) * 100), 100)
        };
      }
    }
    
    return progress;
  }

  // Claim label reward
  static async claimLabelReward(req, res) {
    try {
      const { labelId } = req.params;
      const userId = req.user.id;
      
      const label = await Label.findById(labelId);
      if (!label) {
        return res.status(404).json({
          success: false,
          message: 'Label not found'
        });
      }

      // Check if user has already claimed this label reward
      const userLevel = await UserLevel.findByUserId(userId);
      if (!userLevel) {
        return res.status(404).json({
          success: false,
          message: 'User level not found'
        });
      }

      const alreadyClaimed = userLevel.achievements.find(a => a.labelId === labelId);
      if (alreadyClaimed) {
        return res.status(400).json({
          success: false,
          message: 'Label reward already claimed'
        });
      }

      // Check if user meets unlock conditions
      const wallet = await Wallet.findByUserId(userId);
      const userData = {
        currentLevel: userLevel.currentLevel,
        totalEarnings: wallet ? wallet.totalEarnings : 0,
        loginStreak: 0,
        totalReferrals: 0,
        newsReadCount: 0
      };

      const isUnlocked = await label.checkUnlockConditions(userData);
      if (!isUnlocked) {
        return res.status(400).json({
          success: false,
          message: 'Label conditions not met yet'
        });
      }

      // Add achievement to user level
      const achievement = {
        id: labelId,
        labelId: labelId,
        name: label.name,
        description: label.description,
        reward: label.reward,
        unlockedAt: new Date()
      };

      await userLevel.addAchievement(achievement);

      // Add reward to wallet if there's a monetary reward
      if (label.reward > 0) {
        let userWallet = wallet;
        if (!userWallet) {
          userWallet = await Wallet.create(userId);
        }
        await userWallet.updateBalance(label.reward, 'credit');

        // Create transaction record
        await Transaction.create({
          userId,
          type: 'credit',
          amount: label.reward,
          description: `Label reward: ${label.name}`,
          status: 'completed',
          reference: labelId,
          metadata: { source: 'label_reward', labelId }
        });
      }

      res.json({
        success: true,
        message: 'Label reward claimed successfully',
        data: {
          achievement,
          reward: label.reward,
          labelName: label.name
        }
      });
    } catch (error) {
      console.error('Error claiming label reward:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to claim label reward',
        error: error.message
      });
    }
  }

  // Get all available labels (for admin or discovery)
  static async getAllLabels(req, res) {
    try {
      const { page = 1, limit = 50, category } = req.query;
      
      const labels = await Label.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        category
      });

      const labelSummaries = labels.map(l => l.getSummary());

      res.json({
        success: true,
        data: labelSummaries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: labelSummaries.length
        }
      });
    } catch (error) {
      console.error('Error getting all labels:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get labels',
        error: error.message
      });
    }
  }

  // Create new label (Admin only)
  static async createLabel(req, res) {
    try {
      const { name, description, icon, color, reward, unlockConditions, category } = req.body;

      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message: 'Name and description are required'
        });
      }

      // Check if label with same name already exists
      const existingLabel = await Label.findByName(name);
      if (existingLabel) {
        return res.status(400).json({
          success: false,
          message: 'Label with this name already exists'
        });
      }

      const label = await Label.create({
        name,
        description,
        icon,
        color,
        reward: reward || 0,
        unlockConditions: unlockConditions || [],
        category: category || 'general'
      });

      res.status(201).json({
        success: true,
        message: 'Label created successfully',
        data: label.getSummary()
      });
    } catch (error) {
      console.error('Error creating label:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create label',
        error: error.message
      });
    }
  }

  // Update label (Admin only)
  static async updateLabel(req, res) {
    try {
      const { labelId } = req.params;
      const updateData = req.body;

      const label = await Label.findById(labelId);
      if (!label) {
        return res.status(404).json({
          success: false,
          message: 'Label not found'
        });
      }

      await label.update(updateData);

      res.json({
        success: true,
        message: 'Label updated successfully',
        data: label.getSummary()
      });
    } catch (error) {
      console.error('Error updating label:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update label',
        error: error.message
      });
    }
  }

  // Get user achievements summary
  static async getUserAchievements(req, res) {
    try {
      const userId = req.user.id;
      
      const userLevel = await UserLevel.findByUserId(userId);
      if (!userLevel) {
        return res.status(404).json({
          success: false,
          message: 'User level not found'
        });
      }

      const achievements = userLevel.achievements || [];
      const totalRewards = achievements.reduce((sum, a) => sum + (a.reward || 0), 0);

      const summary = {
        totalAchievements: achievements.length,
        totalRewards,
        achievements: achievements.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          reward: a.reward,
          unlockedAt: a.unlockedAt
        }))
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user achievements',
        error: error.message
      });
    }
  }
}

module.exports = LabelsController;
