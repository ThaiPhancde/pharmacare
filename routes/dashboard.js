const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route Dashboard
router.get('/dashboard', isAuth, dashboardController.getDashboard);

module.exports = router; 