const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

// Middleware kiểm tra người dùng đã đăng nhập hay chưa
const isAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Route danh sách thuốc
router.get('/', isAuth, medicineController.getMedicines);

// Route thêm thuốc mới
router.get('/add', isAuth, medicineController.getAddMedicine);
router.post('/add', isAuth, medicineController.postAddMedicine);

// Route xem chi tiết thuốc
router.get('/:id', isAuth, medicineController.getMedicine);

// Route chỉnh sửa thuốc
router.get('/edit/:id', isAuth, medicineController.getEditMedicine);
router.post('/edit/:id', isAuth, medicineController.postEditMedicine);

// Route xóa thuốc
router.delete('/:id', isAuth, medicineController.deleteMedicine);

// Route tìm kiếm thuốc
router.get('/search', isAuth, medicineController.searchMedicine);

module.exports = router; 