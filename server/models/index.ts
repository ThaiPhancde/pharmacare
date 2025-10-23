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
import CustomerReturn from './CustomerReturn';
import MedicalConsultation from './MedicalConsultation';
import Symptom from './Symptom';
import MedicalCondition from './MedicalCondition';
import DrugInteraction from './DrugInteraction';
// New HR & Service modules
import Employee from './Employee';
import Attendance from './Attendance';
import Payroll from './Payroll';
import Expense from './Expense';
import Loan from './Loan';
import Service from './Service';
import Appointment from './Appointment';
import Voucher from './Voucher';

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
  ChatbotQA,
  CustomerReturn,
  MedicalConsultation,
  Symptom,
  MedicalCondition,
  DrugInteraction,
  Employee,
  Attendance,
  Payroll,
  Expense,
  Loan,
  Service,
  Appointment,
  Voucher
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
  ChatbotQA,
  CustomerReturn,
  MedicalConsultation,
  Symptom,
  MedicalCondition,
  DrugInteraction,
  Employee,
  Attendance,
  Payroll,
  Expense,
  Loan,
  Service,
  Appointment,
  Voucher
};