const { db } = require('../config/firebase');

class Transaction {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.userId || '';
    this.type = data.type || ''; // credit, debit, withdrawal, earning
    this.amount = data.amount || 0;
    this.description = data.description || '';
    this.status = data.status || 'pending'; // pending, completed, failed, cancelled
    this.reference = data.reference || ''; // transaction ID, withdrawal ID, etc.
    this.metadata = data.metadata || {}; // additional data like source, category
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new transaction
  static async create(transactionData) {
    try {
      const transaction = {
        userId: transactionData.userId,
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        status: transactionData.status || 'pending',
        reference: transactionData.reference || '',
        metadata: transactionData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('transactions').add(transaction);
      transaction.id = docRef.id;
      
      return new Transaction(transaction);
    } catch (error) {
      throw error;
    }
  }

  // Find transaction by ID
  static async findById(id) {
    try {
      const doc = await db.collection('transactions').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      
      const transactionData = { id: doc.id, ...doc.data() };
      return new Transaction(transactionData);
    } catch (error) {
      throw error;
    }
  }

  // Get transactions for a user with filters
  static async findByUserId(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type = null,
        status = null,
        startDate = null,
        endDate = null
      } = options;

      let query = db.collection('transactions')
        .where('userId', '==', userId);

      if (type) {
        query = query.where('type', '==', type);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      // Order by creation date
      query = query.orderBy('createdAt', 'desc');

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const snapshot = await query.get();
      
      const transactions = [];
      snapshot.forEach(doc => {
        const transactionData = { id: doc.id, ...doc.data() };
        transactions.push(new Transaction(transactionData));
      });

      return transactions;
    } catch (error) {
      throw error;
    }
  }

  // Update transaction status
  async updateStatus(newStatus) {
    try {
      this.status = newStatus;
      this.updatedAt = new Date();

      await db.collection('transactions').doc(this.id).update({
        status: this.status,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get transaction summary
  getSummary() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      amount: this.amount,
      description: this.description,
      status: this.status,
      reference: this.reference,
      createdAt: this.createdAt
    };
  }
}

module.exports = Transaction;
