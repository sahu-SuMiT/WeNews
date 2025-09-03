const User = require('../models/User');
require('dotenv').config();

async function promoteToAdmin() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node promoteToAdmin.js <email>');
      console.log('Example: node promoteToAdmin.js admin@wenews.com');
      process.exit(1);
    }

    console.log(`Promoting user ${email} to admin...`);
    
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    await user.update({ role: 'admin' });
    
    console.log('✅ User promoted to admin successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.firstName, user.lastName);
    console.log('Role:', user.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error.message);
    process.exit(1);
  }
}

promoteToAdmin();
