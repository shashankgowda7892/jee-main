const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');

// Use route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
