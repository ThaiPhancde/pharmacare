const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route danh sách mua hàng
router.get('/', isAuth, purchaseController.getPurchases);

// Route tạo đơn mua hàng mới
router.get('/add', isAuth, purchaseController.getAddPurchase);
router.post('/add', isAuth, purchaseController.postAddPurchase);

// Route xem chi tiết đơn mua hàng
router.get('/:id', isAuth, purchaseController.getPurchase);

// Route xóa đơn mua hàng
router.delete('/:id', isAuth, purchaseController.deletePurchase);

module.exports = router; 