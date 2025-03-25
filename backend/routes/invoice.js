const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route danh sách hóa đơn
router.get('/', isAuth, invoiceController.getInvoices);

// Route tạo hóa đơn mới
router.get('/add', isAuth, invoiceController.getAddInvoice);
router.post('/add', isAuth, invoiceController.postAddInvoice);

// Route xem chi tiết hóa đơn
router.get('/:id', isAuth, invoiceController.getInvoice);

// Route xóa hóa đơn
router.delete('/:id', isAuth, invoiceController.deleteInvoice);

module.exports = router; 