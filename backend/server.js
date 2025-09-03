const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { db } = require('./config/firebase');

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const userRoutes = require('./routes/user');
const walletRoutes = require('./routes/wallet');
const earningsRoutes = require('./routes/earnings');
const labelsRoutes = require('./routes/labels');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());//cors is pulic right now
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test Firebase connection
db.collection('test').doc('connection').get()
  .then(() => console.log('Connected to Firebase Firestore'))
  .catch(err => console.error('Firebase connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/labels', labelsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'WeNews API is running',
    database: 'Firebase Firestore',
    timestamp: new Date().toISOString(),
    features: [
      'User Authentication',
      'News Management',
      'Wallet System',
      'Earnings & Rewards',
      'Labels & Achievements',
      'Dashboard Overview'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`WeNews API server running on port ${PORT}`);
  console.log(`Database: Firebase Firestore`);
  console.log(`Features: Wallet, Earnings, Labels, News, User Management, Dashboard`);
});
