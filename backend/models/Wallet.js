const { db } = require('../config/firebase');

class Wallet {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.userId || '';
    this.balance = data.balance || 0;
    this.totalEarnings = data.totalEarnings || 0;
    this.totalWithdrawals = data.totalWithdrawals || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new wallet for user
  static async create(userId) {
    try {
      const wallet = {
        userId,
        balance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('wallets').add(wallet);
      wallet.id = docRef.id;
      
      return new Wallet(wallet);
    } catch (error) {
      throw error;
    }
  }

  // Find wallet by user ID
  static async findByUserId(userId) {
    try {
      const snapshot = await db.collection('wallets')
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const walletData = { id: doc.id, ...doc.data() };
      return new Wallet(walletData);
    } catch (error) {
      throw error;
    }
  }

  // Update balance
  async updateBalance(amount, type) {
    try {
      let newBalance = this.balance;
      let newTotalEarnings = this.totalEarnings;
      let newTotalWithdrawals = this.totalWithdrawals;

      if (type === 'credit') {
        newBalance += amount;
        newTotalEarnings += amount;
      } else if (type === 'debit') {
        newBalance -= amount;
        if (type === 'withdrawal') {
          newTotalWithdrawals += amount;
        }
      }

      await db.collection('wallets').doc(this.id).update({
        balance: newBalance,
        totalEarnings: newTotalEarnings,
        totalWithdrawals: newTotalWithdrawals,
        updatedAt: new Date()
      });

      this.balance = newBalance;
      this.totalEarnings = newTotalEarnings;
      this.totalWithdrawals = newTotalWithdrawals;
      this.updatedAt = new Date();

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get wallet summary
  getSummary() {
    return {
      id: this.id,
      userId: this.userId,
      balance: this.balance,
      totalEarnings: this.totalEarnings,
      totalWithdrawals: this.totalWithdrawals,
      isActive: this.isActive
    };
  }
}

module.exports = Wallet;
