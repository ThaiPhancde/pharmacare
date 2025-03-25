const Invoice = require('../models/invoice');
const Customer = require('../models/customer');
const Medicine = require('../models/medicine');

// Hiển thị danh sách hóa đơn
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.getAll();
    res.render('invoice/index', {
      title: 'Danh sách hóa đơn',
      invoices,
      active: 'invoice'
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hóa đơn:', error);
    res.status(500).render('500', { 
      title: 'Lỗi máy chủ', 
      error: process.env.NODE_ENV === 'development' ? error : {} 
    });
  }
};

// Hiển thị form tạo hóa đơn
exports.getAddInvoice = async (req, res) => {
  try {
    // Lấy danh sách khách hàng
    const customers = await Customer.getAll();
    
    // Lấy danh sách thuốc
    const medicines = await Medicine.getAll();
    
    // Tạo mã hóa đơn mới
    const invoiceId = await Invoice.generateInvoiceId();
    
    res.render('invoice/add', {
      title: 'Tạo hóa đơn mới',
      customers,
      medicines,
      invoiceId,
      active: 'invoice'
    });
  } catch (error) {
    console.error('Lỗi khi chuẩn bị dữ liệu cho form tạo hóa đơn:', error);
    res.status(500).render('500', { 
      title: 'Lỗi máy chủ', 
      error: process.env.NODE_ENV === 'development' ? error : {} 
    });
  }
};

// Xử lý tạo hóa đơn mới
exports.postAddInvoice = async (req, res) => {
  try {
    const { 
      invoice_id, 
      customer_id, 
      invoice_date,
      total_amount, 
      discount, 
      paid_amount, 
      due_amount,
      items
    } = req.body;
    
    // Kiểm tra thông tin
    if (!invoice_id || !invoice_date || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin hóa đơn và sản phẩm' });
    }
    
    // Tạo hóa đơn mới
    const invoice = await Invoice.create(
      invoice_id,
      customer_id || null,
      total_amount,
      discount || 0,
      paid_amount || 0,
      due_amount || 0,
      invoice_date
    );
    
    // Thêm chi tiết hóa đơn
    for (const item of items) {
      await Invoice.addInvoiceDetails(
        invoice.id,
        item.medicine_id,
        item.quantity,
        item.unit_price,
        item.total_price
      );
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Tạo hóa đơn thành công', 
      invoice_id: invoice.id 
    });
  } catch (error) {
    console.error('Lỗi khi tạo hóa đơn:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại' });
  }
};

// Lấy thông tin chi tiết hóa đơn
exports.getInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await Invoice.getInvoiceWithDetails(invoiceId);
    
    if (!invoice) {
      return res.redirect('/invoice');
    }
    
    res.render('invoice/view', {
      title: 'Chi tiết hóa đơn',
      invoice,
      active: 'invoice'
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết hóa đơn:', error);
    res.status(500).render('500', { 
      title: 'Lỗi máy chủ', 
      error: process.env.NODE_ENV === 'development' ? error : {} 
    });
  }
};

// Xóa hóa đơn
exports.deleteInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    
    await Invoice.delete(invoiceId);
    
    res.status(200).json({ success: true, message: 'Xóa hóa đơn thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa hóa đơn:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại' });
  }
}; 