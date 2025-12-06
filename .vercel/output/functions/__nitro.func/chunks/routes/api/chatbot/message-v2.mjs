import { d as defineEventHandler, r as readBody, M as Medicine, S as Stock, C as Category, e as SupplierModel, I as Invoice } from '../../../_/nitro.mjs';
import mongoose from 'mongoose';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'zod';
import 'bcryptjs';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

async function fetchDatabaseContext() {
  try {
    console.log("[fetchDatabaseContext] Starting...");
    const medicines = await Medicine.find().populate("category_id").populate("unit_id").populate("type_id").populate("supplier_id").lean();
    console.log(`[fetchDatabaseContext] Fetched ${medicines.length} medicines`);
    const formattedMedicines = await Promise.all(
      medicines.map(async (med) => {
        const stock = await Stock.findOne({ medicine_id: med._id }).lean();
        return {
          id: med._id.toString(),
          name: med.name,
          description: med.description,
          category: med.category_id ? med.category_id.name : "Unknown",
          categoryId: med.category_id ? med.category_id._id.toString() : null,
          type: med.type_id ? med.type_id.name : "Unknown",
          unit: med.unit_id ? med.unit_id.name : "Unit",
          unitId: med.unit_id ? med.unit_id._id.toString() : null,
          supplier: med.supplier_id ? med.supplier_id.name : "Unknown",
          supplierId: med.supplier_id ? med.supplier_id._id.toString() : null,
          price: med.price || 0,
          dosage: med.dosage || null,
          sideEffects: med.side_effects || null,
          contraindications: med.contraindications || null,
          interactions: med.interactions || null,
          stockQuantity: stock ? stock.quantity : 0,
          stockStatus: stock && stock.quantity > 0 ? "available" : "out_of_stock",
          expiryDate: stock ? stock.expiry_date : null,
          batchNumber: stock ? stock.batch_number : null,
          image: med.image || null
        };
      })
    );
    const sampleMedicines = formattedMedicines.slice(0, 30);
    const categories = await Category.find().lean();
    const formattedCategories = categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      description: cat.description || ""
    }));
    const suppliers = await SupplierModel.find().lean();
    const formattedSuppliers = suppliers.map((sup) => ({
      id: sup._id.toString(),
      name: sup.name,
      contact: sup.phone || sup.email || ""
    }));
    const priceStats = {
      min: Math.min(...formattedMedicines.map((m) => m.price)),
      max: Math.max(...formattedMedicines.map((m) => m.price)),
      avg: formattedMedicines.reduce((sum, m) => sum + m.price, 0) / formattedMedicines.length
    };
    const stockStats = {
      total: formattedMedicines.length,
      available: formattedMedicines.filter((m) => m.stockStatus === "available").length,
      outOfStock: formattedMedicines.filter((m) => m.stockStatus === "out_of_stock").length,
      totalQuantity: formattedMedicines.reduce((sum, m) => sum + m.stockQuantity, 0)
    };
    const thirtyDaysFromNow = /* @__PURE__ */ new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringMedicines = formattedMedicines.filter(
      (m) => m.expiryDate && new Date(m.expiryDate) <= thirtyDaysFromNow
    );
    const invoiceStats = await Invoice.aggregate([
      { $unwind: "$medicines" },
      {
        $group: {
          _id: "$medicines.medicine_id",
          totalSold: { $sum: "$medicines.quantity" },
          totalRevenue: { $sum: { $multiply: ["$medicines.quantity", "$medicines.price"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    const topMedicines = await Promise.all(
      invoiceStats.map(async (stat) => {
        const med = await Medicine.findById(stat._id).lean();
        return {
          id: stat._id.toString(),
          name: med ? med.name : "Unknown",
          totalSold: stat.totalSold,
          revenue: stat.totalRevenue
        };
      })
    );
    console.log("[fetchDatabaseContext] Context prepared successfully");
    return {
      medicines: formattedMedicines,
      sampleMedicines,
      // For prompt
      categories: formattedCategories,
      suppliers: formattedSuppliers,
      priceStats,
      stockStats,
      expiringMedicines,
      topMedicines
    };
  } catch (error) {
    console.error("[fetchDatabaseContext] Error:", error);
    return {
      medicines: [],
      sampleMedicines: [],
      categories: [],
      suppliers: [],
      priceStats: { min: 0, max: 0, avg: 0 },
      stockStats: { total: 0, available: 0, outOfStock: 0, totalQuantity: 0 },
      expiringMedicines: [],
      topMedicines: []
    };
  }
}
const messageV2 = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { message, sessionData } = body;
    if (!message) {
      return {
        success: false,
        message: "Tin nh\u1EAFn kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng"
      };
    }
    console.log(`[Chatbot] Processing query: "${message}"`);
    const dbContext = await fetchDatabaseContext();
    const chatHistory = (sessionData == null ? void 0 : sessionData.chatHistory) || [];
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyA8CSwRjVF7ZES5Blg3KOlZc0eO7UyNdmA";
    if (!apiKey) ;
    const prompt = `
You are PharmaCare Assistant, an AI chatbot for a pharmacy management system. Answer questions based on the database information provided below.

DATABASE INFORMATION:

Medicines (${dbContext.medicines.length} total, showing sample of 30):
${JSON.stringify(dbContext.sampleMedicines, null, 2)}

Categories (${dbContext.categories.length} categories):
${JSON.stringify(dbContext.categories)}

Suppliers (${dbContext.suppliers.length} suppliers):
${JSON.stringify(dbContext.suppliers)}

Price Statistics:
- Minimum price: ${dbContext.priceStats.min.toLocaleString("vi-VN")} VND
- Maximum price: ${dbContext.priceStats.max.toLocaleString("vi-VN")} VND
- Average price: ${Math.round(dbContext.priceStats.avg).toLocaleString("vi-VN")} VND

Stock Statistics:
- Total medicines: ${dbContext.stockStats.total}
- Available in stock: ${dbContext.stockStats.available}
- Out of stock: ${dbContext.stockStats.outOfStock}
- Total quantity: ${dbContext.stockStats.totalQuantity} units

Expiring Medicines (within 30 days): ${dbContext.expiringMedicines.length}
${dbContext.expiringMedicines.length > 0 ? JSON.stringify(dbContext.expiringMedicines.slice(0, 5)) : "None"}

Top Selling Medicines:
${JSON.stringify(dbContext.topMedicines)}

IMPORTANT INSTRUCTIONS:

1. When answering questions about medicines, use ONLY the information from the database above.

2. For price-related queries, use the "price" field from medicine data.

3. For stock queries, use "stockQuantity" and "stockStatus" fields.

4. If the user asks to see specific medicines (by category, price range, name, symptom, etc.), include a JSON object in your response:
   {
     "action": "show_medicines",
     "medicine_ids": ["id1", "id2", "id3"]
   }

5. If the user asks for details about a specific medicine, include:
   {
     "action": "show_medicine_details",
     "medicine_id": "specific_id"
   }

6. If the user asks about stock availability, include:
   {
     "action": "show_stock_info",
     "medicine_id": "specific_id"
   }

7. If a medicine is out of stock and the user wants alternatives, include:
   {
     "action": "show_alternatives",
     "original_medicine_id": "id",
     "alternative_medicine_ids": ["alt_id1", "alt_id2"]
   }
   Find alternatives by matching category or similar purpose.

8. For questions about statistics, dashboard, or inventory:
   - Use the statistics provided above
   - Provide clear numerical answers
   - Reference specific medicines when relevant

9. Always respond in Vietnamese language.

10. Be helpful, clear, and accurate. If information is not in the database, say so politely.

11. For dosage, side effects, and medical advice, provide the database information but also recommend consulting a pharmacist or doctor.

Chat History (last 5 messages):
${chatHistory.slice(-5).map(
      (item) => `${item.sender === "user" ? "Kh\xE1ch h\xE0ng" : "Tr\u1EE3 l\xFD"}: ${item.text}`
    ).join("\n")}

Customer Question: ${message}
`;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await $fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });
    const responseData = response;
    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0]) {
      throw new Error("Invalid Gemini API response");
    }
    const aiResponse = responseData.candidates[0].content.parts[0].text;
    let actionData = null;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*"action"[\s\S]*\}/);
      if (jsonMatch) {
        actionData = JSON.parse(jsonMatch[0]);
        if (actionData.action === "show_medicines" && actionData.medicine_ids) {
          const medicineIds = actionData.medicine_ids.map((id) => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch {
              return null;
            }
          }).filter((id) => id !== null);
          if (medicineIds.length > 0) {
            const medicines = await Medicine.find({ _id: { $in: medicineIds } }).populate("category_id").populate("unit_id").populate("supplier_id").limit(10);
            const formattedMedicines = await Promise.all(
              medicines.map(async (med) => {
                const stock = await Stock.findOne({ medicine_id: med._id });
                return {
                  id: med._id,
                  name: med.name,
                  description: med.description,
                  category: med.category_id ? med.category_id.name : "Unknown",
                  unit: med.unit_id ? med.unit_id.name : "Unit",
                  price: med.price,
                  stockQuantity: stock ? stock.quantity : 0,
                  stockStatus: stock && stock.quantity > 0 ? "available" : "out_of_stock",
                  image: med.image
                };
              })
            );
            return {
              success: true,
              message: aiResponse.replace(jsonMatch[0], "").trim(),
              data: {
                type: "medicine_search_results",
                medicines: formattedMedicines
              }
            };
          }
        }
        if (actionData.action === "show_medicine_details" && actionData.medicine_id) {
          try {
            const medicineId = new mongoose.Types.ObjectId(actionData.medicine_id);
            const medicine = await Medicine.findById(medicineId).populate("category_id").populate("unit_id").populate("type_id").populate("supplier_id");
            if (medicine) {
              const stock = await Stock.findOne({ medicine_id: medicine._id });
              const formattedMedicine = {
                id: medicine._id,
                name: medicine.name,
                description: medicine.description,
                category: medicine.category_id ? medicine.category_id.name : "Unknown",
                type: medicine.type_id ? medicine.type_id.name : "Unknown",
                unit: medicine.unit_id ? medicine.unit_id.name : "Unit",
                supplier: medicine.supplier_id ? medicine.supplier_id.name : "Unknown",
                price: medicine.price,
                dosage: medicine.dosage,
                sideEffects: medicine.side_effects,
                contraindications: medicine.contraindications,
                interactions: medicine.interactions,
                stockQuantity: stock ? stock.quantity : 0,
                stockStatus: stock && stock.quantity > 0 ? "available" : "out_of_stock",
                expiryDate: stock ? stock.expiry_date : null,
                batchNumber: stock ? stock.batch_number : null,
                image: medicine.image
              };
              return {
                success: true,
                message: aiResponse.replace(jsonMatch[0], "").trim(),
                data: {
                  type: "medicine_details",
                  medicine: formattedMedicine
                }
              };
            }
          } catch (e) {
            console.error("Error fetching medicine details:", e);
          }
        }
        if (actionData.action === "show_stock_info" && actionData.medicine_id) {
          try {
            const medicineId = new mongoose.Types.ObjectId(actionData.medicine_id);
            const medicine = await Medicine.findById(medicineId).populate("unit_id");
            const stock = await Stock.findOne({ medicine_id: medicineId });
            if (medicine) {
              return {
                success: true,
                message: aiResponse.replace(jsonMatch[0], "").trim(),
                data: {
                  type: "stock_info",
                  medicine: {
                    id: medicine._id,
                    name: medicine.name,
                    unit: medicine.unit_id ? medicine.unit_id.name : "Unit",
                    stockQuantity: stock ? stock.quantity : 0,
                    stockStatus: stock && stock.quantity > 0 ? "available" : "out_of_stock",
                    expiryDate: stock ? stock.expiry_date : null,
                    batchNumber: stock ? stock.batch_number : null
                  }
                }
              };
            }
          } catch (e) {
            console.error("Error fetching stock info:", e);
          }
        }
        if (actionData.action === "show_alternatives") {
          const alternativeIds = (actionData.alternative_medicine_ids || []).map((id) => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch {
              return null;
            }
          }).filter((id) => id !== null);
          if (alternativeIds.length > 0) {
            const alternatives = await Medicine.find({ _id: { $in: alternativeIds } }).populate("category_id").populate("unit_id").limit(5);
            const formattedAlternatives = await Promise.all(
              alternatives.map(async (med) => {
                const stock = await Stock.findOne({ medicine_id: med._id });
                return {
                  id: med._id,
                  name: med.name,
                  description: med.description,
                  category: med.category_id ? med.category_id.name : "Unknown",
                  price: med.price,
                  stockQuantity: stock ? stock.quantity : 0,
                  stockStatus: stock && stock.quantity > 0 ? "available" : "out_of_stock",
                  image: med.image
                };
              })
            );
            return {
              success: true,
              message: aiResponse.replace(jsonMatch[0], "").trim(),
              data: {
                type: "alternative_medicines",
                alternatives: formattedAlternatives
              }
            };
          }
        }
      }
    } catch (jsonError) {
      console.error("Error parsing action data:", jsonError);
    }
    return {
      success: true,
      message: aiResponse,
      data: null
    };
  } catch (error) {
    console.error("[Chatbot] Error:", error);
    return {
      success: false,
      message: "Xin l\u1ED7i, \u0111\xE3 x\u1EA3y ra l\u1ED7i khi x\u1EED l\xFD y\xEAu c\u1EA7u c\u1EE7a b\u1EA1n. Vui l\xF2ng th\u1EED l\u1EA1i.",
      error: error.message
    };
  }
});

export { messageV2 as default };
//# sourceMappingURL=message-v2.mjs.map
