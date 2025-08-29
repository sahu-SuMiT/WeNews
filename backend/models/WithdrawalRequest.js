const { db } = require('../config/firebase');

class WithdrawalRequest {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.userId || '';
    this.amount = data.amount || 0;
    this.status = data.status || 'pending'; // pending, approved, rejected, processing, completed
    this.paymentMethod = data.paymentMethod || ''; // bank_transfer, upi, paytm, etc.
    this.paymentDetails = data.paymentDetails || {}; // account number, UPI ID, etc.
    this.requestDate = data.requestDate || new Date();
    this.processedDate = data.processedDate || null;
    this.adminNotes = data.adminNotes || '';
    this.rejectionReason = data.rejectionReason || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new withdrawal request
  static async create(withdrawalData) {
    try {
      const withdrawal = {
        userId: withdrawalData.userId,
        amount: withdrawalData.amount,
        status: 'pending',
        paymentMethod: withdrawalData.paymentMethod,
        paymentDetails: withdrawalData.paymentDetails || {},
        requestDate: new Date(),
        processedDate: null,
        adminNotes: '',
        rejectionReason: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('withdrawalRequests').add(withdrawal);
      withdrawal.id = docRef.id;
      
      return new WithdrawalRequest(withdrawal);
    } catch (error) {
      throw error;
    }
  }

  // Find withdrawal request by ID
  static async findById(id) {
    try {
      const doc = await db.collection('withdrawalRequests').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      
      const withdrawalData = { id: doc.id, ...doc.data() };
      return new WithdrawalRequest(withdrawalData);
    } catch (error) {
      throw error;
    }
  }

  // Get withdrawal requests for a user
  static async findByUserId(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = null
      } = options;

      let query = db.collection('withdrawalRequests')
        .where('userId', '==', userId);

      if (status) {
        query = query.where('status', '==', status);
      }

      // Order by request date
      query = query.orderBy('requestDate', 'desc');

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const snapshot = await query.get();
      
      const withdrawals = [];
      snapshot.forEach(doc => {
        const withdrawalData = { id: doc.id, ...doc.data() };
        withdrawals.push(new WithdrawalRequest(withdrawalData));
      });

      return withdrawals;
    } catch (error) {
      throw error;
    }
  }

  // Get all withdrawal requests (admin)
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        status = null,
        startDate = null,
        endDate = null
      } = options;

      let query = db.collection('withdrawalRequests');

      if (status) {
        query = query.where('status', '==', status);
      }

      // Order by request date
      query = query.orderBy('requestDate', 'desc');

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const snapshot = await query.get();
      
      const withdrawals = [];
      snapshot.forEach(doc => {
        const withdrawalData = { id: doc.id, ...doc.data() };
        withdrawals.push(new WithdrawalRequest(withdrawalData));
      });

      return withdrawals;
    } catch (error) {
      throw error;
    }
  }

  // Update withdrawal status
  async updateStatus(newStatus, adminNotes = '', rejectionReason = '') {
    try {
      this.status = newStatus;
      this.adminNotes = adminNotes;
      this.rejectionReason = rejectionReason;
      this.updatedAt = new Date();

      if (newStatus === 'processing' || newStatus === 'completed') {
        this.processedDate = new Date();
      }

      await db.collection('withdrawalRequests').doc(this.id).update({
        status: this.status,
        adminNotes: this.adminNotes,
        rejectionReason: this.rejectionReason,
        processedDate: this.processedDate,
        updatedAt: this.updatedAt
      });

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get withdrawal summary
  getSummary() {
    return {
      id: this.id,
      userId: this.userId,
      amount: this.amount,
      status: this.status,
      paymentMethod: this.paymentMethod,
      requestDate: this.requestDate,
      processedDate: this.processedDate,
      adminNotes: this.adminNotes,
      rejectionReason: this.rejectionReason
    };
  }
}

module.exports = WithdrawalRequest;
