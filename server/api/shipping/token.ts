export default defineEventHandler(async (event) => {
  // Lấy token và shop ID từ biến môi trường hoặc giá trị mặc định
  const GHN_TOKEN = process.env.GHN_TOKEN || 'bbcba577-34da-11f0-9b81-222185cb68c8';
  const SHOP_ID = process.env.GHN_SHOP_ID || '196867';
  
  return {
    status: true,
    data: {
      token: GHN_TOKEN,
      shop_id: SHOP_ID
    },
    message: "Thông tin GHN token hiện tại"
  };
}); 