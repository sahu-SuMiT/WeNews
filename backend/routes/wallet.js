const express = require('express');
const { body, query, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { auth, adminAuth } = require('../middleware/auth');
const WalletController = require('../controllers/walletController');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Get wallet balance and summary
router.get('/balance', WalletController.getWalletBalance);

// Get transaction history
router.get('/transactions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['credit', 'debit', 'withdrawal', 'earning']).withMessage('Invalid transaction type'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status')
], validateRequest, WalletController.getTransactionHistory);

// Request withdrawal
router.post('/withdraw', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('paymentDetails').isObject().withMessage('Payment details must be an object')
], validateRequest, WalletController.requestWithdrawal);

// Get withdrawal history
router.get('/withdrawals', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'processing', 'completed']).withMessage('Invalid status')
], validateRequest, WalletController.getWithdrawalHistory);

// Get wallet statistics
router.get('/stats', WalletController.getWalletStats);

// Admin routes
router.use(adminAuth);

// Process withdrawal (Admin only)
router.put('/withdrawals/:withdrawalId/process', [
  param('withdrawalId').notEmpty().withMessage('Withdrawal ID is required'),
  body('status').isIn(['approved', 'rejected', 'processing', 'completed']).withMessage('Invalid status'),
  body('adminNotes').optional().isString().withMessage('Admin notes must be a string'),
  body('rejectionReason').optional().isString().withMessage('Rejection reason must be a string')
], validateRequest, WalletController.processWithdrawal);

module.exports = router;
