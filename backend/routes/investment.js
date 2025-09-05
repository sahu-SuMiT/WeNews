const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getInvestmentPlans,
  getLevelStructure,
  purchaseInvestmentPlan,
  getUserInvestment,
  processDailyEarnings
} = require('../controllers/investmentController');

// Get all investment plans
router.get('/plans', getInvestmentPlans);

// Get level structure
router.get('/levels', getLevelStructure);

// Protected routes
router.use(auth);

// Purchase investment plan
router.post('/purchase', purchaseInvestmentPlan);

// Get user's current investment
router.get('/my-investment', getUserInvestment);

// Process daily earnings
router.post('/claim-daily', processDailyEarnings);

module.exports = router;
