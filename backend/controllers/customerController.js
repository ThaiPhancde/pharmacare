const Customer = require('../models/customer');

// Hiển thị danh sách khách hàng
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.getAll();
    res.render('customer/index', {
      title: 'Danh sách khách hàng',
      customers,
      active: 'customer'
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách hàng:', error);
    res.status(500).render('500', { 
      title: 'Lỗi máy chủ', 
      error: process.env.NODE_ENV === 'development' ? error : {} 
    });
  }
};

// Hiển thị form thêm khách hàng
exports.getAddCustomer = (req, res) => {
  res.render('customer/add', {
    title: 'Thêm khách hàng mới',
    active: 'customer'
  });
};

// Xử lý thêm khách hàng
exports.postAddCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Kiểm tra thông tin
    if (!name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên khách hàng' });
    }
    
    // Tạo khách hàng mới
    await Customer.create(name, email, phone, address);
    
    res.status(201).json({ success: true, message: 'Thêm khách hàng thành công' });
  } catch (error) {
    console.error('Lỗi khi thêm khách hàng:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại' });
  }
};

// Lấy thông tin khách hàng
exports.getCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    }
    
    res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khách hàng:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại' });
  }
};

// Hiển thị form chỉnh sửa khách hàng
exports.getEditCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.redirect('/customer');
    }
    
    res.render('customer/edit', {
      title: 'Chỉnh sửa khách hàng',
      customer,
      active: 'customer'
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khách hàng để chỉnh sửa:', error);
    res.status(500).render('500', { 
      title: 'Lỗi máy chủ', 
      error: process.env.NODE_ENV === 'development' ? error : {} 
    });
  }
};

// Xử lý chỉnh sửa khách hàng
exports.postEditCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { name, email, phone, address } = req.body;
    
    // Kiểm tra thông tin
    if (!name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên khách hàng' });
    }
    
    // Cập nhật thông tin
    await Customer.update(customerId, name, email, phone, address);
    
    res.status(200).json({ success: true, message: 'Cập nhật thông tin khách hàng thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin khách hàng:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại' });
  }
};

// Xóa khách hàng
exports.deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    await Customer.delete(customerId);
    
    res.status(200).json({ success: true, message: 'Xóa khách hàng thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa khách hàng:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại' });
  }
};

// Tìm kiếm khách hàng
exports.searchCustomer = async (req, res) => {
  try {
    const searchTerm = req.query.term;
    
    if (!searchTerm) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập từ khóa tìm kiếm' });
    }
    
    const customers = await Customer.search(searchTerm);
    
    res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm khách hàng:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại' });
  }
}; 