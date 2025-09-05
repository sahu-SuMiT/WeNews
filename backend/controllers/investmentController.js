const { db } = require('../config/firebase');

// Get all investment plans
const getInvestmentPlans = async (req, res) => {
  try {
    const plansSnapshot = await db.collection('investmentPlans').get();
    
    const plans = [];
    plansSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isActive) {
        plans.push({
          id: doc.id,
          ...data
        });
      }
    });

    // Sort by joining amount
    plans.sort((a, b) => a.joiningAmount - b.joiningAmount);

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching investment plans',
      error: error.message
    });
  }
};

// Get level structure
const getLevelStructure = async (req, res) => {
  try {
    const levelsSnapshot = await db.collection('levelStructure').get();
    
    const levels = [];
    levelsSnapshot.forEach(doc => {
      levels.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by level
    levels.sort((a, b) => a.level - b.level);

    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching level structure',
      error: error.message
    });
  }
};

// Purchase investment plan
const purchaseInvestmentPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.uid;

    // Check if user already has an active investment
    const existingInvestmentSnapshot = await db.collection('userInvestments')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    if (!existingInvestmentSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active investment plan'
      });
    }

    // Get the investment plan
    const planDoc = await db.collection('investmentPlans').doc(planId).get();
    if (!planDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Investment plan not found'
      });
    }
    const plan = planDoc.data();

    // Check user wallet balance
    const walletSnapshot = await db.collection('wallets')
      .where('userId', '==', userId)
      .get();
    
    if (walletSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const walletDoc = walletSnapshot.docs[0];
    const wallet = walletDoc.data();
    
    if (wallet.balance < plan.joiningAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Deduct amount from wallet
    await db.collection('wallets').doc(walletDoc.id).update({
      balance: wallet.balance - plan.joiningAmount,
      updatedAt: new Date()
    });

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.validity);

    // Create user investment
    const userInvestment = {
      userId,
      planId: planDoc.id,
      planName: plan.name.toLowerCase(),
      investmentAmount: plan.joiningAmount,
      startDate: new Date(),
      expiryDate,
      currentLevel: 1,
      totalReferrals: 0,
      totalEarnings: 0,
      lastPayoutDate: new Date(),
      isActive: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const investmentRef = await db.collection('userInvestments').add(userInvestment);

    res.json({
      success: true,
      message: 'Investment plan purchased successfully',
      data: {
        id: investmentRef.id,
        ...userInvestment
      }
    });

  } catch (error) {
    console.error('Error purchasing investment plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing investment plan',
      error: error.message
    });
  }
};

// Get user's current investment
const getUserInvestment = async (req, res) => {
  try {
    const userId = req.user.uid;

    const investmentSnapshot = await db.collection('userInvestments')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    if (investmentSnapshot.empty) {
      return res.json({
        success: true,
        data: null,
        message: 'No active investment found'
      });
    }

    const investmentDoc = investmentSnapshot.docs[0];
    const investment = {
      id: investmentDoc.id,
      ...investmentDoc.data()
    };

    // Calculate days since start
    const daysSinceStart = Math.ceil((new Date() - investment.startDate.toDate()) / (1000 * 60 * 60 * 24));

    // Get available levels based on days and referrals
    const levelsSnapshot = await db.collection('levelStructure')
      .where('openAfterDays', '<=', daysSinceStart)
      .where('requiredReferrals', '<=', investment.totalReferrals)
      .orderBy('level', 'asc')
      .get();

    const availableLevels = [];
    levelsSnapshot.forEach(doc => {
      availableLevels.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Calculate current level
    const currentLevel = availableLevels.length > 0 ? 
      Math.max(...availableLevels.map(l => l.level)) : 1;

    // Update user's current level if needed
    if (currentLevel > investment.currentLevel) {
      await db.collection('userInvestments').doc(investmentDoc.id).update({
        currentLevel,
        updatedAt: new Date()
      });
      investment.currentLevel = currentLevel;
    }

    res.json({
      success: true,
      data: {
        investment,
        availableLevels,
        daysSinceStart
      }
    });

  } catch (error) {
    console.error('Error fetching user investment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user investment',
      error: error.message
    });
  }
};

// Calculate and process daily earnings
const processDailyEarnings = async (req, res) => {
  try {
    const userId = req.user.uid;

    const investmentSnapshot = await db.collection('userInvestments')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    if (investmentSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No active investment found'
      });
    }

    const investmentDoc = investmentSnapshot.docs[0];
    const investment = investmentDoc.data();

    // Check if already claimed today
    const today = new Date();
    const lastPayout = investment.lastPayoutDate.toDate();
    
    if (today.toDateString() === lastPayout.toDateString()) {
      return res.status(400).json({
        success: false,
        message: 'Daily earnings already claimed for today'
      });
    }

    // Get the investment plan to get daily return
    const planDoc = await db.collection('investmentPlans').doc(investment.planId).get();
    if (!planDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Investment plan not found'
      });
    }
    const plan = planDoc.data();

    // Calculate daily earning
    const dailyEarning = plan.dailyReturn;

    // Add to wallet
    const walletSnapshot = await db.collection('wallets')
      .where('userId', '==', userId)
      .get();
    
    if (!walletSnapshot.empty) {
      const walletDoc = walletSnapshot.docs[0];
      const wallet = walletDoc.data();
      
      await db.collection('wallets').doc(walletDoc.id).update({
        balance: wallet.balance + dailyEarning,
        updatedAt: new Date()
      });
    }

    // Update investment
    await db.collection('userInvestments').doc(investmentDoc.id).update({
      totalEarnings: investment.totalEarnings + dailyEarning,
      lastPayoutDate: today,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Daily earnings processed successfully',
      data: {
        amount: dailyEarning,
        totalEarnings: investment.totalEarnings + dailyEarning
      }
    });

  } catch (error) {
    console.error('Error processing daily earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing daily earnings',
      error: error.message
    });
  }
};

module.exports = {
  getInvestmentPlans,
  getLevelStructure,
  purchaseInvestmentPlan,
  getUserInvestment,
  processDailyEarnings
};
