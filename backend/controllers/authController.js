const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Hiển thị trang đăng nhập
exports.getLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', {
    title: 'Đăng nhập',
    errorMessage: null
  });
};

// Xử lý đăng nhập
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Kiểm tra thông tin đăng nhập
    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        errorMessage: 'Vui lòng nhập email và mật khẩu'
      });
    }
    
    // Tìm người dùng theo email
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        errorMessage: 'Email không tồn tại'
      });
    }
    
    // Kiểm tra mật khẩu
    const isMatch = await user.verifyPassword(password);
    
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        errorMessage: 'Mật khẩu không chính xác'
      });
    }
    
    // Lưu thông tin người dùng vào session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    // Chuyển hướng tới trang dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.render('auth/login', {
      title: 'Đăng nhập',
      errorMessage: 'Đã xảy ra lỗi, vui lòng thử lại'
    });
  }
};

// Đăng xuất
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Lỗi khi đăng xuất:', err);
    }
    res.redirect('/auth/login');
  });
};

// Hiển thị trang đổi mật khẩu
exports.getChangePassword = (req, res) => {
  res.render('auth/change-password', {
    title: 'Đổi mật khẩu',
    errorMessage: null,
    successMessage: null
  });
};

// Xử lý đổi mật khẩu
exports.postChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id;
    
    // Kiểm tra thông tin
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render('auth/change-password', {
        title: 'Đổi mật khẩu',
        errorMessage: 'Vui lòng nhập đầy đủ thông tin',
        successMessage: null
      });
    }
    
    // Kiểm tra mật khẩu mới và xác nhận
    if (newPassword !== confirmPassword) {
      return res.render('auth/change-password', {
        title: 'Đổi mật khẩu',
        errorMessage: 'Mật khẩu mới và xác nhận không khớp',
        successMessage: null
      });
    }
    
    // Tìm người dùng
    const user = await User.findById(userId);
    
    if (!user) {
      return res.render('auth/change-password', {
        title: 'Đổi mật khẩu',
        errorMessage: 'Người dùng không tồn tại',
        successMessage: null
      });
    }
    
    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.verifyPassword(currentPassword);
    
    if (!isMatch) {
      return res.render('auth/change-password', {
        title: 'Đổi mật khẩu',
        errorMessage: 'Mật khẩu hiện tại không chính xác',
        successMessage: null
      });
    }
    
    // Cập nhật mật khẩu mới
    await User.updatePassword(userId, newPassword);
    
    res.render('auth/change-password', {
      title: 'Đổi mật khẩu',
      errorMessage: null,
      successMessage: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.render('auth/change-password', {
      title: 'Đổi mật khẩu',
      errorMessage: 'Đã xảy ra lỗi, vui lòng thử lại',
      successMessage: null
    });
  }
}; 