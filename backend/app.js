const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const customerRoutes = require('./routes/customer');
const medicineRoutes = require('./routes/medicine');
const purchaseRoutes = require('./routes/purchase');
const invoiceRoutes = require('./routes/invoice');
const returnRoutes = require('./routes/return');
const stockRoutes = require('./routes/stock');
const bankRoutes = require('./routes/bank');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Global middleware to make user available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/', dashboardRoutes);
app.use('/customer', customerRoutes);
app.use('/medicine', medicineRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/return', returnRoutes);
app.use('/stock', stockRoutes);
app.use('/bank', bankRoutes);

// Root route
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.redirect('/dashboard');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy trang', path: req.url });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { 
    title: 'Lỗi máy chủ', 
    error: process.env.NODE_ENV === 'development' ? err : {} 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});

module.exports = app; 