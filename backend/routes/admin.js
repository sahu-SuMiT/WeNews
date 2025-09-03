const express = require('express');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    // Get all users from Firebase
    const usersSnapshot = await require('../config/firebase').db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = { id: doc.id, ...doc.data() };
      // Remove password from response
      delete userData.password;
      users.push(userData);
    });

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role'
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const db = require('../config/firebase').db;
    
    // Get user count
    const usersSnapshot = await db.collection('users').get();
    const userCount = usersSnapshot.size;

    // Get news count
    const newsSnapshot = await db.collection('news').get();
    const newsCount = newsSnapshot.size;

    // Get active users (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsersSnapshot = await db.collection('users')
      .where('lastLogin', '>=', sevenDaysAgo)
      .get();
    const activeUserCount = activeUsersSnapshot.size;

    res.json({
      success: true,
      message: 'Admin stats retrieved successfully',
      data: {
        totalUsers: userCount,
        totalNews: newsCount,
        activeUsers: activeUserCount,
        adminUsers: usersSnapshot.docs.filter(doc => doc.data().role === 'admin').length
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin stats'
    });
  }
});

module.exports = router;
