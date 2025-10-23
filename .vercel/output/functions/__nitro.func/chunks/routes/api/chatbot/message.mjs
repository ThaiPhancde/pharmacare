import { d as defineEventHandler, r as readBody, b as ChatbotQA, M as Medicine, e as SupplierModel, C as Category, I as Invoice, S as Stock, f as Unit, P as Purchase, h as CustomerReturn } from '../../../_/nitro.mjs';
import 'mongoose';
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

function detectCategory(text) {
  const lowerText = text.toLowerCase();
  if (/liều\s+lượng|dùng\s+bao\s+nhiêu|uống\s+như\s+thế\s+nào/.test(lowerText)) {
    return "dosage";
  } else if (/tác\s+dụng\s+phụ|phản\s+ứng|tác\s+hại/.test(lowerText)) {
    return "side-effects";
  } else if (/chống\s+chỉ\s+định|không\s+nên\s+dùng|bệnh\s+nền/.test(lowerText)) {
    return "contraindications";
  } else if (/tương\s+tác|tương\s+tác\s+với|kết\s+hợp/.test(lowerText)) {
    return "interactions";
  } else if (/giá|giá\s+bao\s+nhiêu|bao\s+nhiêu\s+tiền|mua\s+với\s+giá|giá\s+thuốc|có\s+giá|giá\s+là|chi\s+phí/.test(lowerText)) {
    return "price";
  } else if (/thống\s+kê|bao\s+nhiêu|số\s+lượng|tổng\s+cộng|tổng\s+số/.test(lowerText)) {
    return "statistics";
  }
  return null;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function extractMedicineNames(text) {
  const commonMedicines = [
    "paracetamol",
    "brufen",
    "aspirin",
    "ibuprofen",
    "amoxicillin",
    "panadol",
    "efferalgan",
    "tylenol",
    "hapacol",
    "para",
    "thu\u1ED1c gi\u1EA3m \u0111au",
    "thu\u1ED1c h\u1EA1 s\u1ED1t",
    "kh\xE1ng sinh"
  ];
  const medicineMatches = [];
  const medicineRegex = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+\d+(?:mg|g))?)/g;
  const matches = text.match(medicineRegex) || [];
  medicineMatches.push(...matches);
  for (const medicine of commonMedicines) {
    const regex = new RegExp(`\\b${escapeRegExp(medicine)}\\b`, "i");
    if (regex.test(text.toLowerCase())) {
      medicineMatches.push(medicine.toLowerCase());
    }
  }
  return [...new Set(medicineMatches)];
}
async function searchWeb(query) {
  try {
    const apiKey = process.env.TAVILY_API_KEY || "tvly-YOUR_API_KEY";
    const searchUrl = `https://api.tavily.com/search`;
    const response = await $fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query + " thu\u1ED1c d\u01B0\u1EE3c ph\u1EA9m vi\u1EC7t nam",
        search_depth: "basic",
        max_results: 3,
        include_answer: true,
        include_raw_content: false,
        include_images: false
      })
    });
    return response;
  } catch (error) {
    console.error("Web search error:", error);
    return null;
  }
}
async function getDashboardStats() {
  var _a, _b, _c;
  try {
    const [
      totalMedicines,
      totalSuppliers,
      totalInvoices,
      totalStock,
      totalPurchases,
      totalReturns,
      expiringMedicines
    ] = await Promise.all([
      Medicine.countDocuments({}),
      SupplierModel.countDocuments({}),
      Invoice.countDocuments({}),
      Stock.aggregate([
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]),
      Purchase.countDocuments({}),
      CustomerReturn.countDocuments({}),
      Stock.countDocuments({
        expiry_date: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
          // 30 days
        }
      })
    ]);
    const revenueData = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          todayRevenue: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0))] },
                "$total",
                0
              ]
            }
          }
        }
      }
    ]);
    return {
      totalMedicines,
      totalSuppliers,
      totalInvoices,
      totalStock: ((_a = totalStock[0]) == null ? void 0 : _a.total) || 0,
      totalPurchases,
      totalReturns,
      expiringMedicines,
      totalRevenue: ((_b = revenueData[0]) == null ? void 0 : _b.totalRevenue) || 0,
      todayRevenue: ((_c = revenueData[0]) == null ? void 0 : _c.todayRevenue) || 0
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return null;
  }
}
async function handleAdvancedStatsQuestion(message) {
  try {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("t\u1ED5ng quan") || lowerMessage.includes("dashboard") || lowerMessage.includes("b\xE1o c\xE1o")) {
      const stats = await getDashboardStats();
      if (stats) {
        return {
          success: true,
          data: {
            answer: `T\u1ED5ng quan h\u1EC7 th\u1ED1ng PharmaCare:
- T\u1ED5ng s\u1ED1 thu\u1ED1c: ${stats.totalMedicines} lo\u1EA1i
- Nh\xE0 cung c\u1EA5p: ${stats.totalSuppliers}
- H\xF3a \u0111\u01A1n: ${stats.totalInvoices}
- T\u1ED3n kho: ${stats.totalStock} s\u1EA3n ph\u1EA9m
- \u0110\u01A1n nh\u1EADp: ${stats.totalPurchases}
- \u0110\u01A1n tr\u1EA3: ${stats.totalReturns}
- Thu\u1ED1c s\u1EAFp h\u1EBFt h\u1EA1n (30 ng\xE0y): ${stats.expiringMedicines}
- Doanh thu t\u1ED5ng: ${stats.totalRevenue.toLocaleString("vi-VN")} \u0111\u1ED3ng
- Doanh thu h\xF4m nay: ${stats.todayRevenue.toLocaleString("vi-VN")} \u0111\u1ED3ng`,
            source: "database-dashboard"
          }
        };
      }
    }
    if (lowerMessage.includes("doanh thu") || lowerMessage.includes("revenue")) {
      const stats = await getDashboardStats();
      if (stats) {
        return {
          success: true,
          data: {
            answer: `Th\xF4ng tin doanh thu:
- T\u1ED5ng doanh thu: ${stats.totalRevenue.toLocaleString("vi-VN")} \u0111\u1ED3ng
- Doanh thu h\xF4m nay: ${stats.todayRevenue.toLocaleString("vi-VN")} \u0111\u1ED3ng
- S\u1ED1 h\xF3a \u0111\u01A1n: ${stats.totalInvoices}`,
            source: "database-revenue"
          }
        };
      }
    }
    if (lowerMessage.includes("h\u1EBFt h\u1EA1n") || lowerMessage.includes("expir")) {
      const expiringMeds = await Stock.find({
        expiry_date: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
        }
      }).populate("medicine_id").limit(5);
      if (expiringMeds.length > 0) {
        let answer = `C\xF3 ${expiringMeds.length} thu\u1ED1c s\u1EAFp h\u1EBFt h\u1EA1n trong 30 ng\xE0y t\u1EDBi:
`;
        for (const med of expiringMeds) {
          if (med.medicine_id) {
            const medicine = med.medicine_id;
            answer += `- ${medicine.name}: H\u1EBFt h\u1EA1n ${new Date(med.expiry_date).toLocaleDateString("vi-VN")}
`;
          }
        }
        return {
          success: true,
          data: {
            answer,
            source: "database-expiring"
          }
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error handling advanced stats question:", error);
    return null;
  }
}
async function handlePriceQuestion(message) {
  try {
    const medicineNames = extractMedicineNames(message);
    if (medicineNames.length > 0) {
      const medicineName = medicineNames[0];
      const medicine = await Medicine.findOne({
        name: { $regex: new RegExp(medicineName, "i") }
      });
      if (medicine && medicine.price) {
        return {
          success: true,
          data: {
            answer: `${medicine.name} c\xF3 gi\xE1 ${medicine.price.toLocaleString("vi-VN")} \u0111\u1ED3ng.`,
            source: "database-direct"
          }
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error handling price question:", error);
    return null;
  }
}
async function handleStatsQuestion(message) {
  try {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("nh\xE0 cung c\u1EA5p") || lowerMessage.includes("supplier")) {
      if (lowerMessage.includes("bao nhi\xEAu") || lowerMessage.includes("s\u1ED1 l\u01B0\u1EE3ng")) {
        const count = await SupplierModel.countDocuments({});
        return {
          success: true,
          data: {
            answer: `Hi\u1EC7n t\u1EA1i h\u1EC7 th\u1ED1ng c\xF3 ${count} nh\xE0 cung c\u1EA5p thu\u1ED1c.`,
            source: "database-direct"
          }
        };
      }
    }
    if (lowerMessage.includes("lo\u1EA1i thu\u1ED1c") || lowerMessage.includes("medicine")) {
      if (lowerMessage.includes("bao nhi\xEAu") || lowerMessage.includes("s\u1ED1 l\u01B0\u1EE3ng")) {
        const count = await Medicine.countDocuments({});
        return {
          success: true,
          data: {
            answer: `Hi\u1EC7n t\u1EA1i h\u1EC7 th\u1ED1ng c\xF3 ${count} lo\u1EA1i thu\u1ED1c.`,
            source: "database-direct"
          }
        };
      }
    }
    const categoryMatch = lowerMessage.match(/thuốc (.*?) có bao nhiêu/i);
    if (categoryMatch && categoryMatch[1]) {
      const categoryName = categoryMatch[1];
      const category = await Category.findOne({
        name: { $regex: new RegExp(categoryName, "i") }
      });
      if (category) {
        const count = await Medicine.countDocuments({ category_id: category._id });
        return {
          success: true,
          data: {
            answer: `Hi\u1EC7n t\u1EA1i h\u1EC7 th\u1ED1ng c\xF3 ${count} lo\u1EA1i thu\u1ED1c ${categoryName}.`,
            source: "database-direct"
          }
        };
      }
    }
    if (lowerMessage.includes("h\xF3a \u0111\u01A1n") || lowerMessage.includes("invoice")) {
      if (lowerMessage.includes("bao nhi\xEAu") || lowerMessage.includes("s\u1ED1 l\u01B0\u1EE3ng")) {
        const count = await Invoice.countDocuments({});
        return {
          success: true,
          data: {
            answer: `Hi\u1EC7n t\u1EA1i h\u1EC7 th\u1ED1ng c\xF3 ${count} h\xF3a \u0111\u01A1n.`,
            source: "database-direct"
          }
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error handling stats question:", error);
    return null;
  }
}
async function handleStockQuestion(message) {
  try {
    const medicineNames = extractMedicineNames(message);
    const lowerMessage = message.toLowerCase();
    if (medicineNames.length > 0 && (lowerMessage.includes("c\xF2n") || lowerMessage.includes("t\u1ED3n kho") || lowerMessage.includes("s\u1ED1 l\u01B0\u1EE3ng"))) {
      const medicineName = medicineNames[0];
      const medicine = await Medicine.findOne({
        name: { $regex: new RegExp(medicineName, "i") }
      });
      if (medicine) {
        const stock = await Stock.findOne({ medicine_id: medicine._id });
        let unitName = "\u0111\u01A1n v\u1ECB";
        if (medicine.unit_id) {
          const unit = await Unit.findById(medicine.unit_id);
          if (unit) unitName = unit.name;
        }
        const quantity = stock ? stock.quantity : 0;
        return {
          success: true,
          data: {
            answer: `${medicine.name} hi\u1EC7n c\xF2n ${quantity} ${unitName} trong kho.`,
            source: "database-direct"
          }
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error handling stock question:", error);
    return null;
  }
}
const message = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { message } = body;
    if (!message) {
      return { success: false, message: "User message is required" };
    }
    console.log(`Processing query: "${message}"`);
    if (detectCategory(message) === "price") {
      const priceResponse = await handlePriceQuestion(message);
      if (priceResponse) {
        console.log("Tr\u1EA3 l\u1EDDi c\xE2u h\u1ECFi v\u1EC1 gi\xE1 t\u1EEB database tr\u1EF1c ti\u1EBFp");
        return priceResponse;
      }
    }
    if (detectCategory(message) === "statistics") {
      const statsResponse = await handleStatsQuestion(message);
      if (statsResponse) {
        console.log("Tr\u1EA3 l\u1EDDi c\xE2u h\u1ECFi th\u1ED1ng k\xEA t\u1EEB database tr\u1EF1c ti\u1EBFp");
        return statsResponse;
      }
    }
    const advancedStatsResponse = await handleAdvancedStatsQuestion(message);
    if (advancedStatsResponse) {
      console.log("Tr\u1EA3 l\u1EDDi c\xE2u h\u1ECFi th\u1ED1ng k\xEA n\xE2ng cao t\u1EEB database");
      return advancedStatsResponse;
    }
    const stockResponse = await handleStockQuestion(message);
    if (stockResponse) {
      console.log("Tr\u1EA3 l\u1EDDi c\xE2u h\u1ECFi v\u1EC1 t\u1ED3n kho t\u1EEB database tr\u1EF1c ti\u1EBFp");
      return stockResponse;
    }
    const exactMatch = await ChatbotQA.findOne({
      question: { $regex: new RegExp(`^${message.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") }
    });
    if (exactMatch) {
      console.log(`Found exact match: "${exactMatch.question}"`);
      return {
        success: true,
        data: {
          answer: exactMatch.answer,
          source: "database"
        }
      };
    }
    try {
      const ChatbotQAWithMethods = ChatbotQA;
      const similarQuestions = await ChatbotQAWithMethods.findSimilar(message, 5);
      console.log(`Found ${similarQuestions.length} similar questions`);
      if (similarQuestions.length > 0) {
        console.log(`Top result: "${similarQuestions[0].question}" with score ${similarQuestions[0].searchScore}`);
        if (similarQuestions[0].category) {
          console.log(`Category: ${similarQuestions[0].category}`);
        }
        similarQuestions.forEach((q, idx) => {
          if (idx < 3) {
            console.log(`Result ${idx + 1}: "${q.question}" (score: ${q.searchScore}, category: ${q.category || "none"})`);
          }
        });
      }
      if (similarQuestions.length > 0 && similarQuestions[0].searchScore > 0) {
        return {
          success: true,
          data: {
            answer: similarQuestions[0].answer,
            source: "database"
          }
        };
      }
      console.log("No similar questions found with sufficient score");
    } catch (searchError) {
      const error = searchError;
      console.log("Search error:", error.message);
    }
    try {
      const apiKey = "AIzaSyA8CSwRjVF7ZES5Blg3KOlZc0eO7UyNdmA";
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      let webSearchContext = "";
      if (!message.toLowerCase().includes("trong kho") && !message.toLowerCase().includes("trong h\u1EC7 th\u1ED1ng") && !message.toLowerCase().includes("c\u1EE7a ch\xFAng ta") && !message.toLowerCase().includes("pharmacare")) {
        const webResults = await searchWeb(message);
        if (webResults && webResults.answer) {
          webSearchContext = `

Th\xF4ng tin t\u1EEB internet: ${webResults.answer}`;
        }
      }
      const dbStats = await getDashboardStats();
      const dbContext = dbStats ? `
      Th\xF4ng tin t\u1EEB database PharmaCare:
      - T\u1ED5ng s\u1ED1 thu\u1ED1c: ${dbStats.totalMedicines}
      - Nh\xE0 cung c\u1EA5p: ${dbStats.totalSuppliers}
      - T\u1ED3n kho: ${dbStats.totalStock} s\u1EA3n ph\u1EA9m
      ` : "";
      const context = `You are PharmaCare Assistant, a helpful chatbot specializing in medicine and pharmacy information. 
      
      IMPORTANT RULES:
      1. Always prioritize data from PharmaCare database over internet information
      2. For prices, stock quantities, and app-specific data, ONLY use database information
      3. For general medicine knowledge (side effects, dosage guidelines), you can use internet information
      4. Always clearly state the source of information
      5. Respond in Vietnamese language
      
      ${dbContext}
      ${webSearchContext}
      
      When answering:
      - Be helpful, clear, and accurate
      - For app-specific questions (prices, stock), say "kh\xF4ng c\xF3 th\xF4ng tin" if not in database
      - For general medicine questions, provide helpful information but note to consult professionals
      `;
      const allQuestions = await ChatbotQA.find({}).limit(5);
      let additionalContext = "";
      if (allQuestions.length > 0) {
        additionalContext = "\n\nHere are some example Q&As from our database that might be helpful:\n";
        allQuestions.forEach((qa, index) => {
          additionalContext += `${index + 1}. Q: ${qa.question}
A: ${qa.answer}

`;
        });
      }
      const fullContext = context + additionalContext;
      const response = await $fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${fullContext}

User question: ${message}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      });
      const responseData = response;
      if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content && responseData.candidates[0].content.parts && responseData.candidates[0].content.parts[0] && typeof responseData.candidates[0].content.parts[0].text === "string") {
        const answer = responseData.candidates[0].content.parts[0].text;
        return {
          success: true,
          data: {
            answer,
            source: "gemini"
          }
        };
      } else {
        throw new Error("Invalid response from Gemini API");
      }
    } catch (apiError) {
      const error = apiError;
      console.error("Gemini API error:", error);
      return {
        success: true,
        data: {
          answer: "Xin l\u1ED7i, t\xF4i kh\xF4ng th\u1EC3 tr\u1EA3 l\u1EDDi c\xE2u h\u1ECFi n\xE0y v\xE0o l\xFAc n\xE0y. Vui l\xF2ng th\u1EED l\u1EA1i ho\u1EB7c li\xEAn h\u1EC7 v\u1EDBi d\u01B0\u1EE3c s\u0129 \u0111\u1EC3 \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3.",
          source: "fallback"
        }
      };
    }
  } catch (error) {
    const err = error;
    console.error("Chatbot message error:", err);
    return { success: false, message: err.message || "\u0110\xE3 x\u1EA3y ra l\u1ED7i khi x\u1EED l\xFD y\xEAu c\u1EA7u c\u1EE7a b\u1EA1n" };
  }
});

export { message as default };
//# sourceMappingURL=message.mjs.map
