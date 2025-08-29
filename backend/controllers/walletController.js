const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');

class WalletController {
  // Get wallet balance and summary
  static async getWalletBalance(req, res) {
    try {
      const userId = req.user.id;
      
      let wallet = await Wallet.findByUserId(userId);
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await Wallet.create(userId);
      }

      res.json({
        success: true,
        data: wallet.getSummary()
      });
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get wallet balance',
        error: error.message
      });
    }
  }

  // Get transaction history
  static async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type, status } = req.query;

      const transactions = await Transaction.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        status
      });

      const transactionSummaries = transactions.map(t => t.getSummary());

      res.json({
        success: true,
        data: transactionSummaries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactionSummaries.length
        }
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction history',
        error: error.message
      });
    }
  }

  // Request withdrawal
  static async requestWithdrawal(req, res) {
    try {
      const userId = req.user.id;
      const { amount, paymentMethod, paymentDetails } = req.body;

      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid withdrawal amount'
        });
      }

      // Check if user has sufficient balance
      const wallet = await Wallet.findByUserId(userId);
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance for withdrawal'
        });
      }

      // Create withdrawal request
      const withdrawal = await WithdrawalRequest.create({
        userId,
        amount,
        paymentMethod,
        paymentDetails
      });

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'withdrawal',
        amount,
        description: `Withdrawal request - ${paymentMethod}`,
        status: 'pending',
        reference: withdrawal.id,
        metadata: { paymentMethod, paymentDetails }
      });

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: withdrawal.getSummary()
      });
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit withdrawal request',
        error: error.message
      });
    }
  }

  // Get withdrawal history
  static async getWithdrawalHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;

      const withdrawals = await WithdrawalRequest.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      const withdrawalSummaries = withdrawals.map(w => w.getSummary());

      res.json({
        success: true,
        data: withdrawalSummaries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: withdrawalSummaries.length
        }
      });
    } catch (error) {
      console.error('Error getting withdrawal history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get withdrawal history',
        error: error.message
      });
    }
  }

  // Process withdrawal (Admin only)
  static async processWithdrawal(req, res) {
    try {
      const { withdrawalId } = req.params;
      const { status, adminNotes, rejectionReason } = req.body;

      const withdrawal = await WithdrawalRequest.findById(withdrawalId);
      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal request not found'
        });
      }

      // Update withdrawal status
      await withdrawal.updateStatus(status, adminNotes, rejectionReason);

      // If approved, update wallet balance
      if (status === 'approved') {
        const wallet = await Wallet.findByUserId(withdrawal.userId);
        if (wallet) {
          await wallet.updateBalance(withdrawal.amount, 'withdrawal');
        }

        // Update transaction status
        const transactions = await Transaction.findByUserId(withdrawal.userId, {
          reference: withdrawalId
        });
        if (transactions.length > 0) {
          await transactions[0].updateStatus('completed');
        }
      }

      res.json({
        success: true,
        message: 'Withdrawal processed successfully',
        data: withdrawal.getSummary()
      });
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process withdrawal',
        error: error.message
      });
    }
  }

  // Get wallet statistics
  static async getWalletStats(req, res) {
    try {
      const userId = req.user.id;
      
      const wallet = await Wallet.findByUserId(userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Get recent transactions
      const recentTransactions = await Transaction.findByUserId(userId, {
        page: 1,
        limit: 5
      });

      // Get pending withdrawals
      const pendingWithdrawals = await WithdrawalRequest.findByUserId(userId, {
        status: 'pending'
      });

      const stats = {
        balance: wallet.balance,
        totalEarnings: wallet.totalEarnings,
        totalWithdrawals: wallet.totalWithdrawals,
        recentTransactions: recentTransactions.map(t => t.getSummary()),
        pendingWithdrawals: pendingWithdrawals.map(w => w.getSummary()),
        pendingWithdrawalCount: pendingWithdrawals.length
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting wallet stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get wallet statistics',
        error: error.message
      });
    }
  }
}

module.exports = WalletController;
