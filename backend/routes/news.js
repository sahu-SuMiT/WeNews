const express = require('express');
const { body, query, validationResult } = require('express-validator');
const News = require('../models/News');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/news
// @desc    Get all news with filters and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'politics', 'world']),
  query('status').optional().isIn(['draft', 'published', 'archived']),
  query('language').optional().isIn(['en', 'es', 'fr', 'de', 'hi', 'zh']),
  query('featured').optional().isBoolean(),
  query('trending').optional().isBoolean(),
  query('search').optional().isString()
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

    const {
      page = 1,
      limit = 20,
      category,
      status = 'published',
      language = 'en',
      featured,
      trending,
      search
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      status,
      language,
      featured: featured === 'true' ? true : featured === 'false' ? false : null,
      trending: trending === 'true' ? true : trending === 'false' ? false : null,
      search
    };

    const news = await News.findAll(options);

    res.json({
      success: true,
      data: {
        news,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: news.length
        }
      }
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news'
    });
  }
});

// @route   GET /api/news/trending
// @desc    Get trending news
// @access  Public
router.get('/trending', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const news = await News.getTrendingNews(parseInt(limit));

    res.json({
      success: true,
      data: {
        news
      }
    });
  } catch (error) {
    console.error('Get trending news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending news'
    });
  }
});

// @route   GET /api/news/featured
// @desc    Get featured news
// @access  Public
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const news = await News.getFeaturedNews(parseInt(limit));

    res.json({
      success: true,
      data: {
        news
      }
    });
  } catch (error) {
    console.error('Get featured news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured news'
    });
  }
});

// @route   GET /api/news/category/:category
// @desc    Get news by category
// @access  Public
router.get('/category/:category', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate category
    const validCategories = ['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'politics', 'world'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const news = await News.getNewsByCategory(category, parseInt(limit), parseInt(page));

    res.json({
      success: true,
      data: {
        news,
        category,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: news.length
        }
      }
    });
  } catch (error) {
    console.error('Get news by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news by category'
    });
  }
});

// @route   GET /api/news/:id
// @desc    Get news by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Increment views if article is published
    if (news.status === 'published') {
      await news.incrementViews();
    }

    res.json({
      success: true,
      data: {
        news
      }
    });
  } catch (error) {
    console.error('Get news by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news article'
    });
  }
});

// @route   POST /api/news
// @desc    Create a new news article
// @access  Private
router.post('/', [
  auth,
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
  body('summary')
    .notEmpty()
    .withMessage('Summary is required')
    .isLength({ max: 500 })
    .withMessage('Summary cannot exceed 500 characters'),
  body('author.name')
    .notEmpty()
    .withMessage('Author name is required'),
  body('category')
    .isIn(['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'politics', 'world'])
    .withMessage('Invalid category'),
  body('source.name')
    .notEmpty()
    .withMessage('Source name is required'),
  body('readTime')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Read time must be between 1 and 120 minutes'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'hi', 'zh'])
    .withMessage('Invalid language'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status')
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

    const newsData = {
      ...req.body,
      author: {
        name: req.body.author.name,
        id: req.user.id
      }
    };

    const news = await News.create(newsData);

    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: {
        news
      }
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating news article'
    });
  }
});

// @route   PUT /api/news/:id
// @desc    Update news article
// @access  Private
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('summary')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Summary cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'politics', 'world'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'hi', 'zh'])
    .withMessage('Invalid language')
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

    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Check if user is the author or has admin privileges
    if (news.author.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own articles.'
      });
    }

    const updatedNews = await news.update(req.body);

    res.json({
      success: true,
      message: 'News article updated successfully',
      data: {
        news: updatedNews
      }
    });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating news article'
    });
  }
});

// @route   DELETE /api/news/:id
// @desc    Delete news article
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Check if user is the author or has admin privileges
    if (news.author.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own articles.'
      });
    }

    await news.delete();

    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting news article'
    });
  }
});

// @route   POST /api/news/:id/like
// @desc    Like/dislike news article
// @access  Private
router.post('/:id/like', [
  auth,
  body('action')
    .isIn(['like', 'dislike'])
    .withMessage('Action must be either "like" or "dislike"')
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

    const { id } = req.params;
    const { action } = req.body;

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    if (news.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot like/unlike unpublished articles'
      });
    }

    const updatedNews = await news.toggleLike(action);

    res.json({
      success: true,
      message: `Article ${action}d successfully`,
      data: {
        news: updatedNews
      }
    });
  } catch (error) {
    console.error('Like/dislike news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing like/dislike'
    });
  }
});

// @route   GET /api/news/:id/related
// @desc    Get related news articles
// @access  Public
router.get('/:id/related', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    const relatedNews = await news.getRelatedNews(parseInt(limit));

    res.json({
      success: true,
      data: {
        relatedNews
      }
    });
  } catch (error) {
    console.error('Get related news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching related news'
    });
  }
});

module.exports = router;
