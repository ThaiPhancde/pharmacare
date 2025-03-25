const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route danh sách đơn trả hàng
router.get('/', isAuth, returnController.getReturns);

// Route tạo đơn trả hàng mới
router.get('/add', isAuth, returnController.getAddReturn);
router.post('/add', isAuth, returnController.postAddReturn);

// Route xem chi tiết đơn trả hàng
router.get('/:id', isAuth, returnController.getReturn);

// Route xóa đơn trả hàng
router.delete('/:id', isAuth, returnController.deleteReturn);

module.exports = router; 