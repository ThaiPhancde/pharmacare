import { d as defineEventHandler, b as ChatbotQA } from '../../../_/nitro.mjs';
import fs from 'fs';
import path from 'path';
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

const importDatabaseData = defineEventHandler(async (event) => {
  try {
    if (event.node.req.method !== "POST") {
      return { success: false, message: "This endpoint requires a POST request" };
    }
    let totalFromDb = 0;
    let totalFromText = 0;
    const medicineJsonPath = path.resolve(process.cwd(), "database/pharmacare.medicines.json");
    const supplierJsonPath = path.resolve(process.cwd(), "database/pharmacare.suppliers.json");
    const categoryJsonPath = path.resolve(process.cwd(), "database/pharmacare.categories.json");
    const unitJsonPath = path.resolve(process.cwd(), "database/pharmacare.units.json");
    const typeJsonPath = path.resolve(process.cwd(), "database/pharmacare.typemedicines.json");
    const stockJsonPath = path.resolve(process.cwd(), "database/pharmacare.stocks.json");
    let medicines = [];
    let suppliers = [];
    let categories = [];
    let units = [];
    let types = [];
    let stocks = [];
    try {
      if (fs.existsSync(medicineJsonPath)) {
        medicines = JSON.parse(fs.readFileSync(medicineJsonPath, "utf-8"));
      }
      if (fs.existsSync(supplierJsonPath)) {
        suppliers = JSON.parse(fs.readFileSync(supplierJsonPath, "utf-8"));
      }
      if (fs.existsSync(categoryJsonPath)) {
        categories = JSON.parse(fs.readFileSync(categoryJsonPath, "utf-8"));
      }
      if (fs.existsSync(unitJsonPath)) {
        units = JSON.parse(fs.readFileSync(unitJsonPath, "utf-8"));
      }
      if (fs.existsSync(typeJsonPath)) {
        types = JSON.parse(fs.readFileSync(typeJsonPath, "utf-8"));
      }
      if (fs.existsSync(stockJsonPath)) {
        stocks = JSON.parse(fs.readFileSync(stockJsonPath, "utf-8"));
      }
    } catch (error) {
      console.error("Error reading database files:", error);
    }
    console.log(`Loaded ${medicines.length} medicines, ${categories.length} categories, ${stocks.length} stock items`);
    const categoryMap = new Map(categories.map((cat) => [cat._id.$oid, cat.name]));
    const unitMap = new Map(units.map((unit) => [unit._id.$oid, unit.name]));
    const typeMap = new Map(types.map((type) => [type._id.$oid, type.name]));
    const stockMap = /* @__PURE__ */ new Map();
    stocks.forEach((stock) => {
      if (stock.medicine_id && stock.medicine_id.$oid) {
        stockMap.set(stock.medicine_id.$oid, stock.quantity);
      }
    });
    const qaDataFromDb = [];
    const questionTemplates = [
      {
        type: "price",
        questions: [
          "$medicine c\xF3 gi\xE1 bao nhi\xEAu?",
          "$medicine c\xF3 gi\xE1 l\xE0 bao nhi\xEAu?",
          "Gi\xE1 c\u1EE7a $medicine l\xE0 bao nhi\xEAu?",
          "$medicine bao nhi\xEAu ti\u1EC1n?",
          "Cho h\u1ECFi gi\xE1 $medicine"
        ],
        answerTemplate: "$medicine c\xF3 gi\xE1 $price."
      },
      {
        type: "description",
        questions: [
          "$medicine l\xE0 thu\u1ED1c g\xEC?",
          "$medicine d\xF9ng \u0111\u1EC3 l\xE0m g\xEC?",
          "$medicine c\xF3 t\xE1c d\u1EE5ng g\xEC?",
          "C\xF4ng d\u1EE5ng c\u1EE7a $medicine l\xE0 g\xEC?"
        ],
        answerTemplate: "$medicine l\xE0 thu\u1ED1c $description. Thu\u1ED9c nh\xF3m $category, d\u1EA1ng $unit."
      },
      {
        type: "composition",
        questions: [
          "$medicine ch\u1EE9a ho\u1EA1t ch\u1EA5t g\xEC?",
          "$medicine c\xF3 th\xE0nh ph\u1EA7n g\xEC?",
          "Ho\u1EA1t ch\u1EA5t c\u1EE7a $medicine l\xE0 g\xEC?",
          "Th\xE0nh ph\u1EA7n ch\xEDnh trong $medicine l\xE0 g\xEC?"
        ],
        answerTemplate: "$medicine ch\u1EE9a ho\u1EA1t ch\u1EA5t $generic."
      },
      {
        type: "inventory",
        questions: [
          "$medicine c\xF2n bao nhi\xEAu trong kho?",
          "$medicine c\xF2n h\xE0ng kh\xF4ng?",
          "Hi\u1EC7u thu\u1ED1c c\xF2n $medicine kh\xF4ng?",
          "S\u1ED1 l\u01B0\u1EE3ng $medicine hi\u1EC7n c\xF3 l\xE0 bao nhi\xEAu?"
        ],
        answerTemplate: "$medicine hi\u1EC7n c\xF2n $quantity $unit trong kho."
      },
      {
        type: "prescription",
        questions: [
          "$medicine c\xF3 c\u1EA7n k\xEA \u0111\u01A1n kh\xF4ng?",
          "$medicine c\xF3 c\u1EA7n \u0111\u01A1n b\xE1c s\u0129 kh\xF4ng?",
          "$medicine c\xF3 th\u1EC3 mua t\u1EF1 do kh\xF4ng?",
          "C\xF3 th\u1EC3 mua $medicine kh\xF4ng c\u1EA7n \u0111\u01A1n thu\u1ED1c kh\xF4ng?"
        ],
        answerTemplate: "$medicine l\xE0 thu\u1ED1c $prescriptionStatus"
      }
    ];
    for (const medicine of medicines) {
      const medicineName = medicine.name;
      const medicineId = medicine._id.$oid;
      const price = medicine.price ? `${medicine.price.toLocaleString("vi-VN")} \u0111\u1ED3ng` : "kh\xF4ng c\xF3 th\xF4ng tin gi\xE1";
      const description = medicine.description || "kh\xF4ng c\xF3 m\xF4 t\u1EA3";
      const generic = medicine.generic || "kh\xF4ng c\xF3 th\xF4ng tin ho\u1EA1t ch\u1EA5t";
      const category = medicine.category_id && medicine.category_id.$oid ? categoryMap.get(medicine.category_id.$oid) || "kh\xF4ng x\xE1c \u0111\u1ECBnh" : "kh\xF4ng x\xE1c \u0111\u1ECBnh";
      const unit = medicine.unit_id && medicine.unit_id.$oid ? unitMap.get(medicine.unit_id.$oid) || "kh\xF4ng x\xE1c \u0111\u1ECBnh" : "vi\xEAn";
      const type = medicine.type_id && medicine.type_id.$oid ? typeMap.get(medicine.type_id.$oid) || "kh\xF4ng x\xE1c \u0111\u1ECBnh" : "kh\xF4ng x\xE1c \u0111\u1ECBnh";
      const quantity = stockMap.has(medicineId) ? stockMap.get(medicineId) : 0;
      const prescriptionStatus = type === "Prescription" ? "k\xEA \u0111\u01A1n, c\u1EA7n c\xF3 \u0111\u01A1n b\xE1c s\u0129 khi mua." : "kh\xF4ng k\xEA \u0111\u01A1n, c\xF3 th\u1EC3 mua tr\u1EF1c ti\u1EBFp t\u1EA1i hi\u1EC7u thu\u1ED1c.";
      questionTemplates.forEach((template) => {
        const questionTemplate = template.questions[Math.floor(Math.random() * template.questions.length)];
        const question = questionTemplate.replace(/\$medicine/g, medicineName);
        let answer = template.answerTemplate.replace(/\$medicine/g, medicineName);
        switch (template.type) {
          case "price":
            answer = answer.replace(/\$price/g, price);
            break;
          case "description":
            answer = answer.replace(/\$description/g, description).replace(/\$category/g, category).replace(/\$unit/g, unit);
            break;
          case "composition":
            answer = answer.replace(/\$generic/g, generic);
            break;
          case "inventory":
            answer = answer.replace(/\$quantity/g, quantity.toString()).replace(/\$unit/g, unit);
            break;
          case "prescription":
            answer = answer.replace(/\$prescriptionStatus/g, prescriptionStatus);
            break;
        }
        qaDataFromDb.push({
          question,
          answer,
          category: template.type,
          keywords: `${medicineName} ${template.type}`,
          medicineTerms: medicineName
        });
        template.questions.forEach((q) => {
          if (q !== questionTemplate) {
            const variantQuestion = q.replace(/\$medicine/g, medicineName);
            qaDataFromDb.push({
              question: variantQuestion,
              answer,
              category: template.type,
              keywords: `${medicineName} ${template.type}`,
              medicineTerms: medicineName
            });
          }
        });
      });
    }
    totalFromDb = qaDataFromDb.length;
    console.log(`Created ${totalFromDb} QA pairs from database`);
    const filePath = path.resolve(process.cwd(), "Medicine.txt");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");
    const qaDataFromText = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.includes("?")) {
        const question = line;
        let answer = "";
        let j = i + 1;
        while (j < lines.length && lines[j].trim() && !lines[j].trim().includes("?")) {
          if (answer) answer += " ";
          answer += lines[j].trim();
          j++;
        }
        if (answer) {
          const medicineTerms = extractMedicineTerms(question);
          const keywords = extractKeywords(question + " " + answer);
          qaDataFromText.push({
            question,
            answer,
            category: detectCategory(question),
            keywords: keywords.join(" "),
            medicineTerms: medicineTerms.join(" ")
          });
          i = j - 1;
        }
      }
    }
    totalFromText = qaDataFromText.length;
    console.log(`Created ${totalFromText} QA pairs from Medicine.txt`);
    await ChatbotQA.deleteMany({});
    const allQaPairs = [...qaDataFromDb, ...qaDataFromText];
    if (allQaPairs.length > 0) {
      await ChatbotQA.insertMany(allQaPairs);
      try {
        const db = ChatbotQA.db;
        const collection = db.collection("chatbotqas");
        await collection.dropIndexes();
        await collection.createIndex({
          question: "text",
          answer: "text",
          keywords: "text",
          medicineTerms: "text"
        });
        console.log("Successfully rebuilt text index for chatbot search");
      } catch (indexError) {
        console.warn("Warning: Failed to rebuild text index:", indexError.message);
      }
      return {
        success: true,
        message: `\u0110\xE3 import th\xE0nh c\xF4ng ${allQaPairs.length} c\xE2u h\u1ECFi v\xE0 tr\u1EA3 l\u1EDDi`,
        data: {
          fromDb: totalFromDb,
          fromText: totalFromText,
          total: allQaPairs.length
        }
      };
    } else {
      return { success: false, message: "Kh\xF4ng c\xF3 c\xE2u h\u1ECFi n\xE0o \u0111\u01B0\u1EE3c t\u1EA1o ra" };
    }
  } catch (error) {
    console.error("Error importing database data:", error);
    return { success: false, message: error.message || "Unknown error occurred" };
  }
});
function detectCategory(question) {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes("li\u1EC1u") || lowerQuestion.includes("l\u01B0\u1EE3ng")) {
    return "dosage";
  } else if (lowerQuestion.includes("t\xE1c d\u1EE5ng ph\u1EE5") || lowerQuestion.includes("ph\u1EA3n \u1EE9ng")) {
    return "side-effects";
  } else if (lowerQuestion.includes("ch\u1ED1ng ch\u1EC9 \u0111\u1ECBnh") || lowerQuestion.includes("b\u1EC7nh n\u1EC1n")) {
    return "contraindications";
  } else if (lowerQuestion.includes("t\u01B0\u01A1ng t\xE1c")) {
    return "interactions";
  } else if (lowerQuestion.includes("gi\xE1")) {
    return "price";
  } else {
    return "general";
  }
}
function extractMedicineTerms(text) {
  const medicineRegex = /([A-Z][a-zÀ-ỹ]+(?:\s+[A-Z][a-zÀ-ỹ]+)*(?:\s+\d+(?:mg|g))?)/g;
  const matches = text.match(medicineRegex) || [];
  return [...new Set(matches)];
}
function extractKeywords(text) {
  const stopwords = ["v\xE0", "ho\u1EB7c", "l\xE0", "c\xF3", "nh\u1EEFng", "c\xE1c", "c\u1EE7a", "cho", "trong", "v\u1EDBi", "kh\xF4ng", "\u0111\u01B0\u1EE3c", "c\u1EA7n", "ph\u1EA3i"];
  const words = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
  return [...new Set(words)].filter((word) => word.length > 2 && !stopwords.includes(word));
}

export { importDatabaseData as default };
//# sourceMappingURL=import-database-data.mjs.map
