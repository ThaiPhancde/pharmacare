const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route trang đăng nhập
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Route đăng xuất
router.get('/logout', isAuth, authController.logout);

// Route đổi mật khẩu
router.get('/change-password', isAuth, authController.getChangePassword);
router.post('/change-password', isAuth, authController.postChangePassword);

module.exports = router; 