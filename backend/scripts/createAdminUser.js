const User = require('../models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@wenews.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      preferences: {
        categories: [],
        language: 'en',
        notifications: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@wenews.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('User ID:', adminUser.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
