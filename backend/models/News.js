const { db } = require('../config/firebase');

class News {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.content = data.content || '';
    this.summary = data.summary || '';
    this.author = data.author || {
      name: '',
      id: null
    };
    this.category = data.category || '';
    this.tags = data.tags || [];
    this.images = data.images || [];
    this.source = data.source || {
      name: '',
      url: ''
    };
    this.publishDate = data.publishDate || new Date();
    this.readTime = data.readTime || 5;
    this.language = data.language || 'en';
    this.status = data.status || 'published';
    this.views = data.views || 0;
    this.likes = data.likes || 0;
    this.dislikes = data.dislikes || 0;
    this.featured = data.featured || false;
    this.trending = data.trending || false;
    this.seo = data.seo || {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    };
    this.externalId = data.externalId || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new news article
  static async create(newsData) {
    try {
      const news = {
        title: newsData.title,
        content: newsData.content,
        summary: newsData.summary,
        author: {
          name: newsData.author.name,
          id: newsData.author.id || null
        },
        category: newsData.category,
        tags: newsData.tags || [],
        images: newsData.images || [],
        source: {
          name: newsData.source.name,
          url: newsData.source.url || ''
        },
        publishDate: newsData.publishDate || new Date(),
        readTime: newsData.readTime || 5,
        language: newsData.language || 'en',
        status: newsData.status || 'published',
        views: 0,
        likes: 0,
        dislikes: 0,
        featured: newsData.featured || false,
        trending: newsData.trending || false,
        seo: {
          metaTitle: newsData.seo?.metaTitle || '',
          metaDescription: newsData.seo?.metaDescription || '',
          keywords: newsData.seo?.keywords || []
        },
        externalId: newsData.externalId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('news').add(news);
      news.id = docRef.id;
      
      return new News(news);
    } catch (error) {
      throw error;
    }
  }

  // Find news by ID
  static async findById(id) {
    try {
      const doc = await db.collection('news').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      
      const newsData = { id: doc.id, ...doc.data() };
      return new News(newsData);
    } catch (error) {
      throw error;
    }
  }

  // Find news by external ID
  static async findByExternalId(externalId) {
    try {
      const snapshot = await db.collection('news')
        .where('externalId', '==', externalId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const newsData = { id: doc.id, ...doc.data() };
      return new News(newsData);
    } catch (error) {
      throw error;
    }
  }

  // Get all news with pagination and filters
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        status = 'published',
        language = 'en',
        featured = null,
        trending = null,
        search = null
      } = options;

      let query = db.collection('news');

      // Apply filters
      if (category) {
        query = query.where('category', '==', category);
      }
      if (status) {
        query = query.where('status', '==', status);
      }
      if (language) {
        query = query.where('language', '==', language);
      }
      if (featured !== null) {
        query = query.where('featured', '==', featured);
      }
      if (trending !== null) {
        query = query.where('trending', '==', trending);
      }

      // Apply search if provided
      if (search) {
        // Note: Firestore doesn't support full-text search natively
        // You might want to use Algolia or similar service for better search
        query = query.orderBy('title');
      }

      // Order by publish date
      query = query.orderBy('publishDate', 'desc');

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const snapshot = await query.get();
      
      const news = [];
      snapshot.forEach(doc => {
        const newsData = { id: doc.id, ...doc.data() };
        news.push(new News(newsData));
      });

      return news;
    } catch (error) {
      throw error;
    }
  }

  // Get trending news
  static async getTrendingNews(limit = 10) {
    try {
      const snapshot = await db.collection('news')
        .where('status', '==', 'published')
        .where('trending', '==', true)
        .orderBy('publishDate', 'desc')
        .orderBy('views', 'desc')
        .limit(limit)
        .get();
      
      const news = [];
      snapshot.forEach(doc => {
        const newsData = { id: doc.id, ...doc.data() };
        news.push(new News(newsData));
      });

      return news;
    } catch (error) {
      throw error;
    }
  }

  // Get featured news
  static async getFeaturedNews(limit = 10) {
    try {
      const snapshot = await db.collection('news')
        .where('status', '==', 'published')
        .where('featured', '==', true)
        .orderBy('publishDate', 'desc')
        .limit(limit)
        .get();
      
      const news = [];
      snapshot.forEach(doc => {
        const newsData = { id: doc.id, ...doc.data() };
        news.push(new News(newsData));
      });

      return news;
    } catch (error) {
      throw error;
    }
  }

  // Get news by category
  static async getNewsByCategory(category, limit = 20, page = 1) {
    try {
      const offset = (page - 1) * limit;
      
      const snapshot = await db.collection('news')
        .where('category', '==', category)
        .where('status', '==', 'published')
        .orderBy('publishDate', 'desc')
        .offset(offset)
        .limit(limit)
        .get();
      
      const news = [];
      snapshot.forEach(doc => {
        const newsData = { id: doc.id, ...doc.data() };
        news.push(new News(newsData));
      });

      return news;
    } catch (error) {
      throw error;
    }
  }

  // Update news article
  async update(updateData) {
    try {
      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };

      // Don't allow updating certain fields
      delete updateFields.id;
      delete updateFields.createdAt;

      await db.collection('news').doc(this.id).update(updateFields);
      
      // Update local instance
      Object.assign(this, updateFields);
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Increment views
  async incrementViews() {
    try {
      this.views += 1;
      await db.collection('news').doc(this.id).update({
        views: this.views,
        updatedAt: new Date()
      });
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Toggle like/dislike
  async toggleLike(action) {
    try {
      if (action === 'like') {
        this.likes += 1;
      } else if (action === 'dislike') {
        this.dislikes += 1;
      }

      await db.collection('news').doc(this.id).update({
        likes: this.likes,
        dislikes: this.dislikes,
        updatedAt: new Date()
      });

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Toggle featured status
  async toggleFeatured() {
    try {
      this.featured = !this.featured;
      await db.collection('news').doc(this.id).update({
        featured: this.featured,
        updatedAt: new Date()
      });
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Toggle trending status
  async toggleTrending() {
    try {
      this.trending = !this.trending;
      await db.collection('news').doc(this.id).update({
        trending: this.trending,
        updatedAt: new Date()
      });
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Change status
  async changeStatus(newStatus) {
    try {
      this.status = newStatus;
      await db.collection('news').doc(this.id).update({
        status: this.status,
        updatedAt: new Date()
      });
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete news article
  async delete() {
    try {
      await db.collection('news').doc(this.id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get related news (same category, different article)
  async getRelatedNews(limit = 5) {
    try {
      const snapshot = await db.collection('news')
        .where('category', '==', this.category)
        .where('status', '==', 'published')
        .where('id', '!=', this.id)
        .orderBy('publishDate', 'desc')
        .limit(limit)
        .get();
      
      const news = [];
      snapshot.forEach(doc => {
        const newsData = { id: doc.id, ...doc.data() };
        news.push(new News(newsData));
      });

      return news;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = News;
