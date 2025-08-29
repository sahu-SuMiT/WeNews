const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

// Mock data for testing
const mockData = {
  users: [
    {
      email: 'admin@wenews.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isVerified: true,
      kycStatus: 'verified'
    },
    {
      email: 'user1@wenews.com',
      password: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      isVerified: true,
      kycStatus: 'verified'
    },
    {
      email: 'user2@wenews.com',
      password: 'user123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'user',
      isVerified: true,
      kycStatus: 'verified'
    }
  ],
  labels: [
    {
      name: 'First Steps',
      description: 'Complete your first daily login',
      icon: '🎯',
      color: '#4CAF50',
      reward: 10,
      unlockConditions: [
        { type: 'daily_login_streak', value: 1, operator: 'gte' }
      ],
      category: 'achievement'
    },
    {
      name: 'Earning Master',
      description: 'Earn your first 100 coins',
      icon: '💰',
      color: '#FF9800',
      reward: 25,
      unlockConditions: [
        { type: 'total_earnings', value: 100, operator: 'gte' }
      ],
      category: 'milestone'
    },
    {
      name: 'Level Up',
      description: 'Reach level 5',
      icon: '⭐',
      color: '#9C27B0',
      reward: 50,
      unlockConditions: [
        { type: 'level', value: 5, operator: 'gte' }
      ],
      category: 'achievement'
    },
    {
      name: 'News Reader',
      description: 'Read 10 news articles',
      icon: '📰',
      color: '#2196F3',
      reward: 15,
      unlockConditions: [
        { type: 'news_read', value: 10, operator: 'gte' }
      ],
      category: 'achievement'
    }
  ],
  news: [
    {
      title: 'Breaking: New Technology Breakthrough',
      content: 'Scientists discover revolutionary quantum computing method...',
      summary: 'Major breakthrough in quantum computing technology',
      author: 'Tech Reporter',
      category: 'Technology',
      tags: ['technology', 'quantum', 'breakthrough'],
      isPublished: true,
      isFeatured: true
    },
    {
      title: 'Economic Update: Market Trends',
      content: 'Global markets show positive momentum...',
      summary: 'Analysis of current market trends and predictions',
      author: 'Finance Expert',
      category: 'Business',
      tags: ['business', 'finance', 'markets'],
      isPublished: true,
      isFeatured: false
    },
    {
      title: 'Sports: Championship Finals',
      content: 'Exciting match between top teams...',
      summary: 'Coverage of the championship finals',
      author: 'Sports Journalist',
      category: 'Sports',
      tags: ['sports', 'championship', 'finals'],
      isPublished: true,
      isFeatured: false
    }
  ]
};

// Helper function to hash passwords
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Seed users
async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  for (const userData of mockData.users) {
    try {
      // Check if user already exists
      const existingUser = await db.collection('users')
        .where('email', '==', userData.email)
        .get();
      
      if (existingUser.empty) {
        const hashedPassword = await hashPassword(userData.password);
        const user = {
          ...userData,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('users').add(user);
        console.log(`✅ Created user: ${userData.email}`);
      } else {
        console.log(`⏭️  User already exists: ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
}

// Seed labels
async function seedLabels() {
  console.log('🏷️  Seeding labels...');
  
  for (const labelData of mockData.labels) {
    try {
      // Check if label already exists
      const existingLabel = await db.collection('labels')
        .where('name', '==', labelData.name)
        .get();
      
      if (existingLabel.empty) {
        const label = {
          ...labelData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('labels').add(label);
        console.log(`✅ Created label: ${labelData.name}`);
      } else {
        console.log(`⏭️  Label already exists: ${labelData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating label ${labelData.name}:`, error.message);
    }
  }
}

// Seed news
async function seedNews() {
  console.log('📰 Seeding news...');
  
  for (const newsData of mockData.news) {
    try {
      // Check if news already exists
      const existingNews = await db.collection('news')
        .where('title', '==', newsData.title)
        .get();
      
      if (existingNews.empty) {
        const news = {
          ...newsData,
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('news').add(news);
        console.log(`✅ Created news: ${newsData.title}`);
      } else {
        console.log(`⏭️  News already exists: ${newsData.title}`);
      }
    } catch (error) {
      console.error(`❌ Error creating news ${newsData.title}:`, error.message);
    }
  }
}

// Main seeding function
async function seedAllData() {
  try {
    console.log('🚀 Starting mock data seeding...\n');
    
    await seedUsers();
    console.log('');
    
    await seedLabels();
    console.log('');
    
    await seedNews();
    console.log('');
    
    console.log('🎉 Mock data seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@wenews.com / admin123');
    console.log('User 1: user1@wenews.com / user123');
    console.log('User 2: user2@wenews.com / user123');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    process.exit(0);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedAllData();
}

module.exports = { seedAllData };
