const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id || null;
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.profilePicture = data.profilePicture || null;
    this.preferences = data.preferences || {
      categories: [],
      language: 'en',
      notifications: true
    };
    this.savedArticles = data.savedArticles || [];
    this.readingHistory = data.readingHistory || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastLogin = data.lastLogin || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new user
  static async create(userData) {
    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const existingUsername = await this.findByUsername(userData.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = {
        username: userData.username,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profilePicture: userData.profilePicture || null,
        preferences: {
          categories: userData.preferences?.categories || [],
          language: userData.preferences?.language || 'en',
          notifications: userData.preferences?.notifications !== undefined ? userData.preferences.notifications : true
        },
        savedArticles: [],
        readingHistory: [],
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('users').add(user);
      user.id = docRef.id;
      
      return new User(user);
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      
      const userData = { id: doc.id, ...doc.data() };
      return new User(userData);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const userData = { id: doc.id, ...doc.data() };
      return new User(userData);
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const snapshot = await db.collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const userData = { id: doc.id, ...doc.data() };
      return new User(userData);
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };

      // Don't allow updating certain fields
      delete updateFields.id;
      delete updateFields.createdAt;
      delete updateFields.password; // Use separate method for password update

      await db.collection('users').doc(this.id).update(updateFields);
      
      // Update local instance
      Object.assign(this, updateFields);
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await db.collection('users').doc(this.id).update({
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      this.password = hashedPassword;
      this.updatedAt = new Date();
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Get public profile (without sensitive data)
  getPublicProfile() {
    const publicProfile = { ...this };
    delete publicProfile.password;
    return publicProfile;
  }

  // Add saved article
  async addSavedArticle(articleId) {
    try {
      if (!this.savedArticles.includes(articleId)) {
        this.savedArticles.push(articleId);
        await db.collection('users').doc(this.id).update({
          savedArticles: this.savedArticles,
          updatedAt: new Date()
        });
      }
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Remove saved article
  async removeSavedArticle(articleId) {
    try {
      this.savedArticles = this.savedArticles.filter(id => id !== articleId);
      await db.collection('users').doc(this.id).update({
        savedArticles: this.savedArticles,
        updatedAt: new Date()
      });
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Add reading history
  async addReadingHistory(articleId) {
    try {
      const historyEntry = {
        article: articleId,
        readAt: new Date()
      };
      
      // Remove if already exists and add to front
      this.readingHistory = this.readingHistory.filter(entry => entry.article !== articleId);
      this.readingHistory.unshift(historyEntry);
      
      // Keep only last 100 entries
      if (this.readingHistory.length > 100) {
        this.readingHistory = this.readingHistory.slice(0, 100);
      }
      
      await db.collection('users').doc(this.id).update({
        readingHistory: this.readingHistory,
        updatedAt: new Date()
      });
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      this.lastLogin = new Date();
      await db.collection('users').doc(this.id).update({
        lastLogin: this.lastLogin,
        updatedAt: new Date()
      });
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  async delete() {
    try {
      await db.collection('users').doc(this.id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
