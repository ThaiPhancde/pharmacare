// Import tất cả các model cụ thể
import Unit from './Unit';
import Category from './Category';
import TypeMedicine from './Types';
import Medicine from './Medicine';
import Supplier from './Supplier';
import Purchase from './Purchase';
import Customer from './Customer';
import Invoice from './Invoice';
import Stock from './Stock';
import User from './User';
import Bank from './Bank';
import ChatbotQA from './ChatbotQA';

// Đảm bảo rằng các model đã được import và đăng ký đúng cách
export { 
  Unit, 
  Category, 
  TypeMedicine, 
  Medicine, 
  Supplier, 
  Purchase, 
  Customer, 
  Invoice, 
  Stock, 
  User,
  Bank,
  ChatbotQA
};

// Export default là một object chứa tất cả các model để sử dụng linh hoạt hơn
export default {
  Unit,
  Category,
  TypeMedicine,
  Medicine,
  Supplier,
  Purchase,
  Customer,
  Invoice,
  Stock,
  User,
  Bank,
  ChatbotQA
};