const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const News = require('../models/News');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
  body('preferences.categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('preferences.categories.*')
    .optional()
    .isIn(['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'politics', 'world'])
    .withMessage('Invalid category'),
  body('preferences.language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'hi', 'zh'])
    .withMessage('Invalid language'),
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await user.update(req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   GET /api/user/saved-articles
// @desc    Get user's saved articles
// @access  Private
router.get('/saved-articles', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get saved articles with pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const savedArticleIds = user.savedArticles.slice(startIndex, endIndex);

    // Fetch actual article data
    const savedArticles = [];
    for (const articleId of savedArticleIds) {
      const article = await News.findById(articleId);
      if (article && article.status === 'published') {
        savedArticles.push(article);
      }
    }

    res.json({
      success: true,
      data: {
        savedArticles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: user.savedArticles.length,
          totalPages: Math.ceil(user.savedArticles.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get saved articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching saved articles'
    });
  }
});

// @route   POST /api/user/save-article
// @desc    Save an article to user's saved list
// @access  Private
router.post('/save-article', [
  auth,
  body('articleId')
    .notEmpty()
    .withMessage('Article ID is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { articleId } = req.body;

    // Check if article exists
    const article = await News.findById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (article.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot save unpublished articles'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await user.addSavedArticle(articleId);

    res.json({
      success: true,
      message: 'Article saved successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Save article error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving article'
    });
  }
});

// @route   DELETE /api/user/saved-articles/:articleId
// @desc    Remove an article from user's saved list
// @access  Private
router.delete('/saved-articles/:articleId', auth, async (req, res) => {
  try {
    const { articleId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await user.removeSavedArticle(articleId);

    res.json({
      success: true,
      message: 'Article removed from saved list successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Remove saved article error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing saved article'
    });
  }
});

// @route   GET /api/user/reading-history
// @desc    Get user's reading history
// @access  Private
router.get('/reading-history', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get reading history with pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const historyEntries = user.readingHistory.slice(startIndex, endIndex);

    // Fetch actual article data
    const readingHistory = [];
    for (const entry of historyEntries) {
      const article = await News.findById(entry.article);
      if (article && article.status === 'published') {
        readingHistory.push({
          article,
          readAt: entry.readAt
        });
      }
    }

    res.json({
      success: true,
      data: {
        readingHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: user.readingHistory.length,
          totalPages: Math.ceil(user.readingHistory.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reading history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reading history'
    });
  }
});

// @route   POST /api/user/reading-history
// @desc    Add article to reading history
// @access  Private
router.post('/reading-history', [
  auth,
  body('articleId')
    .notEmpty()
    .withMessage('Article ID is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { articleId } = req.body;

    // Check if article exists
    const article = await News.findById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (article.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add unpublished articles to reading history'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await user.addReadingHistory(articleId);

    res.json({
      success: true,
      message: 'Article added to reading history successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Add reading history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to reading history'
    });
  }
});

// @route   PUT /api/user/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  auth,
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('categories.*')
    .optional()
    .isIn(['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'politics', 'world'])
    .withMessage('Invalid category'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'hi', 'zh'])
    .withMessage('Invalid language'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updateData = {};
    if (req.body.categories !== undefined) updateData['preferences.categories'] = req.body.categories;
    if (req.body.language !== undefined) updateData['preferences.language'] = req.body.language;
    if (req.body.notifications !== undefined) updateData['preferences.notifications'] = req.body.notifications;

    const updatedUser = await user.update(updateData);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences'
    });
  }
});

// @route   GET /api/user/recommendations
// @desc    Get personalized news recommendations based on user preferences
// @access  Private
router.get('/recommendations', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let recommendations = [];

    // If user has category preferences, get news from those categories
    if (user.preferences.categories && user.preferences.categories.length > 0) {
      for (const category of user.preferences.categories) {
        const categoryNews = await News.getNewsByCategory(category, Math.ceil(limit / user.preferences.categories.length), 1);
        recommendations.push(...categoryNews);
      }
    } else {
      // If no preferences, get trending news
      recommendations = await News.getTrendingNews(limit);
    }

    // Remove duplicates and limit results
    const uniqueRecommendations = recommendations
      .filter((article, index, self) => 
        index === self.findIndex(a => a.id === article.id)
      )
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        recommendations: uniqueRecommendations
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recommendations'
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  auth,
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete user
    await user.delete();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
});

module.exports = router;
