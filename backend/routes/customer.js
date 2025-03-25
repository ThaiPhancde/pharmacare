const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route danh sách khách hàng
router.get('/', isAuth, customerController.getCustomers);

// Route thêm khách hàng
router.get('/add', isAuth, customerController.getAddCustomer);
router.post('/add', isAuth, customerController.postAddCustomer);

// Route lấy thông tin khách hàng
router.get('/:id', isAuth, customerController.getCustomer);

// Route chỉnh sửa khách hàng
router.get('/edit/:id', isAuth, customerController.getEditCustomer);
router.post('/edit/:id', isAuth, customerController.postEditCustomer);

// Route xóa khách hàng
router.delete('/:id', isAuth, customerController.deleteCustomer);

// Route tìm kiếm khách hàng
router.get('/search', isAuth, customerController.searchCustomer);

module.exports = router; 