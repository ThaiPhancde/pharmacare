const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route danh sách kho
router.get('/', isAuth, stockController.getStocks);

// Route thêm kho mới
router.get('/add', isAuth, stockController.getAddStock);
router.post('/add', isAuth, stockController.postAddStock);

// Route xem thuốc hết hạn
router.get('/expired', isAuth, stockController.getExpiredStock);

// Route xem thuốc sắp hết
router.get('/low-stock', isAuth, stockController.getLowStock);

// Route chỉnh sửa kho
router.get('/edit/:id', isAuth, stockController.getEditStock);
router.post('/edit/:id', isAuth, stockController.postEditStock);

// Route xóa kho
router.delete('/:id', isAuth, stockController.deleteStock);

module.exports = router; 