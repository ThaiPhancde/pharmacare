const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route danh sách tài khoản ngân hàng
router.get('/', isAuth, bankController.getBankAccounts);

// Route thêm tài khoản ngân hàng mới
router.get('/add', isAuth, bankController.getAddBankAccount);
router.post('/add', isAuth, bankController.postAddBankAccount);

// Route chỉnh sửa tài khoản ngân hàng
router.get('/edit/:id', isAuth, bankController.getEditBankAccount);
router.post('/edit/:id', isAuth, bankController.postEditBankAccount);

// Route xóa tài khoản ngân hàng
router.delete('/:id', isAuth, bankController.deleteBankAccount);

module.exports = router;