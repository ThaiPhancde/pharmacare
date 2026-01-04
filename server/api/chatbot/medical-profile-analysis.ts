/**
 * 🏥 MEDICAL PROFILE AI ANALYSIS
 * 
 * Phân tích hồ sơ y tế của khách hàng và đưa ra cảnh báo/khuyến nghị về thuốc:
 * - Kiểm tra dị ứng với thuốc trong giỏ hàng
 * - Phát hiện tương tác thuốc với thuốc đang dùng
 * - Cảnh báo với bệnh mãn tính
 * - Đề xuất hướng dẫn sử dụng thuốc sau khi thanh toán
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import Customer from '@/server/models/Customer'
import { Medicine } from '~/server/models'

// Rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 5000 // 5 giây giữa các request

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Database kiến thức dược phẩm cơ bản cho offline mode
const DRUG_INTERACTIONS = {
  // Thuốc chống đông máu
  'warfarin': ['aspirin', 'ibuprofen', 'naproxen', 'vitamin k', 'vitamin e'],
  'aspirin': ['warfarin', 'ibuprofen', 'naproxen', 'heparin'],
  
  // Thuốc tiểu đường
  'metformin': ['alcohol', 'contrast dye', 'glucophage'],
  'insulin': ['beta blockers', 'alcohol'],
  'glucophage': ['alcohol', 'contrast dye'],
  
  // Thuốc tim mạch
  'digoxin': ['amiodarone', 'quinidine', 'verapamil'],
  'lisinopril': ['potassium', 'spironolactone', 'nsaid'],
  'amlodipine': ['simvastatin', 'cyclosporine', 'simlo'],
  
  // Kháng sinh
  'ciprofloxacin': ['antacids', 'calcium', 'iron', 'zinc'],
  'metronidazole': ['alcohol', 'warfarin'],
  'tetracycline': ['antacids', 'calcium', 'iron', 'dairy'],
  'azithromycin': ['antacids', 'warfarin'],
  'zithromax': ['antacids', 'warfarin'],
  
  // Thuốc giảm đau
  'ibuprofen': ['aspirin', 'warfarin', 'lisinopril', 'amlodipine'],
  'paracetamol': ['warfarin', 'alcohol'],
  'hapacol': ['warfarin', 'alcohol'],
  'tramadol': ['ssri', 'maoi', 'carbamazepine'],
}

// Thuốc chống chỉ định với bệnh mãn tính
const CONTRAINDICATIONS = {
  'diabetes': ['corticosteroids', 'thiazide', 'beta blockers', 'cortone', 'prednisone', 'dexamethasone', 'cortisol'],
  'tiểu đường': ['corticosteroids', 'thiazide', 'beta blockers', 'cortone', 'prednisone', 'dexamethasone'],
  'hypertension': ['nsaid', 'decongestants', 'oral contraceptives', 'corticosteroids', 'ibuprofen', 'diclofenac'],
  'huyết áp': ['nsaid', 'decongestants', 'oral contraceptives', 'corticosteroids', 'ibuprofen'],
  'asthma': ['beta blockers', 'aspirin', 'nsaid', 'propranolol', 'atenolol'],
  'hen suyễn': ['beta blockers', 'aspirin', 'nsaid', 'propranolol', 'atenolol'],
  'kidney disease': ['nsaid', 'aminoglycosides', 'lithium', 'ibuprofen'],
  'suy thận': ['nsaid', 'aminoglycosides', 'lithium', 'ibuprofen'],
  'liver disease': ['paracetamol', 'statins', 'methotrexate', 'hapacol'],
  'gan': ['paracetamol', 'statins', 'methotrexate', 'hapacol'],
  'heart disease': ['nsaid', 'decongestants', 'tca', 'ibuprofen'],
  'tim': ['nsaid', 'decongestants', 'tca', 'ibuprofen'],
  'pregnancy': ['warfarin', 'statins', 'ace inhibitors', 'methotrexate', 'isotretinoin'],
  'mang thai': ['warfarin', 'statins', 'ace inhibitors', 'methotrexate', 'isotretinoin'],
  'gastric ulcer': ['nsaid', 'aspirin', 'corticosteroids', 'ibuprofen', 'diclofenac'],
  'dạ dày': ['nsaid', 'aspirin', 'corticosteroids', 'ibuprofen', 'diclofenac'],
  'epilepsy': ['tramadol', 'bupropion'],
  'động kinh': ['tramadol', 'bupropion'],
}

// Cảnh báo dị ứng phổ biến
const ALLERGY_WARNINGS = {
  'penicillin': ['amoxicillin', 'ampicillin', 'penicillin v', 'augmentin', 'amoxyclav'],
  'aspirin': ['aspirin', 'nsaid', 'ibuprofen', 'naproxen', 'diclofenac', 'voltaren', 'advil', 'motrin'],
  'sulfa': ['sulfamethoxazole', 'trimethoprim', 'bactrim', 'sulfasalazine'],
  'codeine': ['codeine', 'morphine', 'tramadol', 'oxycodone', 'terpin'],
  'nsaid': ['ibuprofen', 'naproxen', 'diclofenac', 'meloxicam', 'piroxicam', 'voltaren'],
  'cephalosporin': ['cephalexin', 'cefuroxime', 'ceftriaxone', 'cefixime', 'dalacin'],
  'clindamycin': ['dalacin', 'clindamycin'],
  'macrolide': ['azithromycin', 'zithromax', 'erythromycin', 'clarithromycin'],
}

// Hướng dẫn sử dụng thuốc
const USAGE_GUIDELINES = {
  'antibiotic': {
    instruction: 'Uống đủ liều theo chỉ định, không tự ý ngưng thuốc',
    food: 'Uống sau ăn 1-2 giờ để tăng hấp thu',
    warning: 'Tránh sữa và các sản phẩm từ sữa trong 2 giờ trước và sau khi uống'
  },
  'painkiller': {
    instruction: 'Chỉ uống khi đau, không vượt quá liều khuyến cáo',
    food: 'Nên uống sau ăn để tránh kích ứng dạ dày',
    warning: 'Không uống rượu khi đang dùng thuốc giảm đau'
  },
  'antihypertensive': {
    instruction: 'Uống đều đặn hàng ngày, không tự ý ngưng',
    food: 'Có thể uống lúc đói hoặc no',
    warning: 'Đứng dậy từ từ để tránh chóng mặt'
  },
  'antidiabetic': {
    instruction: 'Uống đúng giờ theo chỉ định bác sĩ',
    food: 'Thường uống trước bữa ăn 30 phút hoặc ngay trước ăn',
    warning: 'Theo dõi đường huyết thường xuyên, tránh bỏ bữa'
  },
  'vitamin': {
    instruction: 'Uống 1 viên/ngày hoặc theo hướng dẫn',
    food: 'Nên uống sau bữa ăn để tăng hấp thu',
    warning: 'Không uống quá liều khuyến cáo'
  },
}

/**
 * Helper function to categorize medicine and get usage guide
 */
function getMedicineGuideType(medicine: any): string {
  const medName = (medicine.name || '').toLowerCase()
  const category = (medicine.category?.name || '').toLowerCase()
  
  if (/antibiotic|kháng sinh|amox|cipro|azithro|cef|penicillin/i.test(medName + category)) {
    return 'antibiotic'
  } else if (/pain|giảm đau|ibuprofen|paracetamol|acetaminophen|nsaid|diclofenac/i.test(medName + category)) {
    return 'painkiller'
  } else if (/hypertension|huyết áp|lisinopril|amlodipine|losartan|atenolol/i.test(medName + category)) {
    return 'antihypertensive'
  } else if (/diabet|tiểu đường|metformin|glibenclamide|insulin/i.test(medName + category)) {
    return 'antidiabetic'
  } else if (/vitamin|khoáng|mineral|supplement|bổ sung/i.test(medName + category)) {
    return 'vitamin'
  }
  return 'general'
}

/**
 * Generate basic usage guides for medicines (no medical profile needed)
 */
function generateBasicUsageGuides(cartMedicines: any[]): Array<{ medicine: string; guide: any }> {
  const usageGuides: Array<{ medicine: string; guide: any }> = []
  
  for (const medicine of cartMedicines) {
    const guideType = getMedicineGuideType(medicine)
    const guide = USAGE_GUIDELINES[guideType as keyof typeof USAGE_GUIDELINES] || {
      instruction: 'Uống theo hướng dẫn trên nhãn hoặc theo chỉ định bác sĩ',
      food: 'Có thể uống trước hoặc sau ăn',
      warning: 'Đọc kỹ hướng dẫn sử dụng trước khi dùng'
    }
    usageGuides.push({ medicine: medicine.name, guide })
  }
  
  return usageGuides
}

/**
 * Phân tích offline dựa trên database kiến thức
 */
function analyzeOffline(
  medicalProfile: any,
  cartMedicines: any[]
): {
  warnings: string[]
  recommendations: string[]
  usageGuides: Array<{ medicine: string; guide: any }>
} {
  const warnings: string[] = []
  const recommendations: string[] = []
  const usageGuides: Array<{ medicine: string; guide: any }> = []

  const allergies = (medicalProfile?.allergies || []).map((a: string) => a.toLowerCase())
  const chronicConditions = (medicalProfile?.chronic_conditions || []).map((c: string) => c.toLowerCase())
  const currentMedications = (medicalProfile?.current_medications || []).map((m: string) => m.toLowerCase())
  const medicalNotes = (medicalProfile?.medical_notes || '').toLowerCase()
  const isPregnant = medicalProfile?.pregnancy_status === true

  // Check pregnancy status
  if (isPregnant) {
    for (const medicine of cartMedicines) {
      const medName = medicine.name?.toLowerCase() || ''
      // Check for pregnancy contraindicated drugs
      const pregnancyDrugs = ['warfarin', 'statin', 'ace', 'methotrexate', 'isotretinoin', 'tetracycline', 'doxycycline']
      if (pregnancyDrugs.some(drug => medName.includes(drug))) {
        warnings.push(`⚠️ PREGNANCY WARNING: "${medicine.name}" may harm the fetus! Do not use during pregnancy.`)
      }
    }
    recommendations.push(`🤰 Customer is pregnant - Please consult a doctor before using any medication`)
  }

  // Extract keywords from medical notes for analysis
  const noteKeywords: string[] = []
  if (medicalNotes) {
    // Common conditions in Vietnamese
    if (/tiểu đường|diabetes|đường huyết/i.test(medicalNotes)) noteKeywords.push('diabetes')
    if (/huyết áp|hypertension|tăng huyết áp/i.test(medicalNotes)) noteKeywords.push('hypertension')
    if (/tim|heart|tim mạch/i.test(medicalNotes)) noteKeywords.push('heart disease')
    if (/gan|liver|viêm gan/i.test(medicalNotes)) noteKeywords.push('liver disease')
    if (/thận|kidney|suy thận/i.test(medicalNotes)) noteKeywords.push('kidney disease')
    if (/dạ dày|gastric|loét/i.test(medicalNotes)) noteKeywords.push('gastric ulcer')
    if (/hen|asthma|khó thở/i.test(medicalNotes)) noteKeywords.push('asthma')
    if (/động kinh|epilepsy|co giật/i.test(medicalNotes)) noteKeywords.push('epilepsy')
    
    // Add extracted conditions to chronic conditions for checking
    chronicConditions.push(...noteKeywords)
  }

  console.log('[Medical Analysis] Checking medicines:', cartMedicines.map(m => m.name))
  console.log('[Medical Analysis] Allergies:', allergies)
  console.log('[Medical Analysis] Chronic conditions:', chronicConditions)
  console.log('[Medical Analysis] Current medications:', currentMedications)

  for (const medicine of cartMedicines) {
    const medName = medicine.name?.toLowerCase() || ''
    const category = medicine.category?.name?.toLowerCase() || ''
    const combinedName = medName + ' ' + category

    console.log('[Medical Analysis] Checking medicine:', medName, 'category:', category)

    // 1. Kiểm tra dị ứng
    for (const allergy of allergies) {
      const allergyLower = allergy.toLowerCase().trim()
      
      // Kiểm tra trực tiếp
      if (medName.includes(allergyLower) || allergyLower.includes(medName.split(' ')[0])) {
        warnings.push(`⚠️ ALLERGY WARNING: Customer is allergic to "${allergy}" - Medicine "${medicine.name}" may cause allergic reaction!`)
      }
      
      // Kiểm tra qua nhóm dị ứng - more flexible matching
      for (const [allergyKey, relatedDrugs] of Object.entries(ALLERGY_WARNINGS)) {
        // Check if customer's allergy matches this group
        if (allergyLower.includes(allergyKey) || allergyKey.includes(allergyLower)) {
          // Check if medicine matches any drug in this allergy group
          if (relatedDrugs.some(drug => combinedName.includes(drug.toLowerCase()))) {
            warnings.push(`⚠️ CROSS-ALLERGY WARNING: Customer allergic to "${allergy}" may react to "${medicine.name}"`)
            break
          }
        }
      }
    }

    // 2. Kiểm tra bệnh mãn tính - more flexible matching
    for (const condition of chronicConditions) {
      const conditionLower = condition.toLowerCase().trim()
      
      for (const [conditionKey, contraindicatedDrugs] of Object.entries(CONTRAINDICATIONS)) {
        // Check if customer's condition matches this key
        if (conditionLower.includes(conditionKey) || conditionKey.includes(conditionLower)) {
          // Check if medicine matches any contraindicated drug
          if (contraindicatedDrugs.some(drug => combinedName.includes(drug.toLowerCase()))) {
            warnings.push(`⚠️ CONTRAINDICATION: Customer has "${condition}" - Use "${medicine.name}" with caution!`)
            recommendations.push(`💡 With ${condition}, consult a doctor before using ${medicine.name}`)
            break
          }
        }
      }
    }

    // 3. Kiểm tra tương tác thuốc với thuốc đang dùng - more flexible
    for (const currentMed of currentMedications) {
      const currentMedLower = currentMed.toLowerCase().trim()
      
      for (const [drugKey, interactingDrugs] of Object.entries(DRUG_INTERACTIONS)) {
        // Check if customer's medication matches this key
        if (currentMedLower.includes(drugKey) || drugKey.includes(currentMedLower)) {
          // Check if medicine in cart interacts
          if (interactingDrugs.some(drug => combinedName.includes(drug.toLowerCase()))) {
            warnings.push(`⚠️ DRUG INTERACTION: "${medicine.name}" may interact with "${currentMed}" that customer is taking`)
            recommendations.push(`💡 If using ${medicine.name}, take at least 2-4 hours apart from ${currentMed}`)
            break
          }
        }
      }
    }

    // 4. Tạo hướng dẫn sử dụng
    let guideType = 'general'
    if (/antibiotic|kháng sinh|amox|cipro|azithro|cef|penicillin|dalacin|hasrax/i.test(medName + category)) {
      guideType = 'antibiotic'
    } else if (/pain|giảm đau|ibuprofen|paracetamol|acetaminophen|nsaid|diclofenac|hapacol/i.test(medName + category)) {
      guideType = 'painkiller'
    } else if (/hypertension|huyết áp|lisinopril|amlodipine|losartan|atenolol|cardiovascular|upsa/i.test(medName + category)) {
      guideType = 'antihypertensive'
    } else if (/diabet|tiểu đường|metformin|glibenclamide|insulin|glucophage/i.test(medName + category)) {
      guideType = 'antidiabetic'
    } else if (/vitamin|khoáng|mineral|supplement|bổ sung|zithromax/i.test(medName + category)) {
      guideType = 'vitamin'
    }

    const guide = USAGE_GUIDELINES[guideType as keyof typeof USAGE_GUIDELINES] || {
      instruction: 'Take as directed on the label or as prescribed by doctor',
      food: 'Can be taken before or after meals',
      warning: 'Read the instructions carefully before use'
    }

    usageGuides.push({ medicine: medicine.name, guide })
  }

  // Add general recommendations
  if (chronicConditions.length > 0) {
    recommendations.push(`💊 Customer has chronic conditions (${chronicConditions.join(', ')}), please advise carefully before selling medication`)
  }

  if (currentMedications.length > 0) {
    recommendations.push(`📋 Customer is taking ${currentMedications.length} other medications, check for interactions`)
  }

  console.log('[Medical Analysis] Warnings found:', warnings.length)
  console.log('[Medical Analysis] Recommendations:', recommendations.length)

  return { warnings, recommendations, usageGuides }
}

/**
 * Phân tích bằng Gemini AI
 */
async function analyzeWithAI(
  medicalProfile: any,
  cartMedicines: any[],
  apiKey: string
): Promise<{
  warnings: string[]
  recommendations: string[]
  usageGuides: Array<{ medicine: string; guide: any }>
}> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const medicineList = cartMedicines.map(m => `- ${m.name} (${m.category?.name || 'N/A'})`).join('\n')
  
  // Include medical_notes in the analysis
  const medicalNotes = medicalProfile?.medical_notes ? `\n- Ghi chú y tế: ${medicalProfile.medical_notes}` : ''
  const pregnancyInfo = medicalProfile?.pregnancy_status ? '\n- Đang mang thai: Có' : ''
  const ageInfo = medicalProfile?.age ? `\n- Tuổi: ${medicalProfile.age}` : ''
  const weightInfo = medicalProfile?.weight ? `\n- Cân nặng: ${medicalProfile.weight}kg` : ''
  
  const prompt = `Bạn là dược sĩ AI chuyên nghiệp. Phân tích hồ sơ y tế khách hàng và đơn thuốc sau:

## HỒ SƠ Y TẾ KHÁCH HÀNG:
- Bệnh mãn tính: ${(medicalProfile?.chronic_conditions || []).join(', ') || 'Không có'}
- Dị ứng thuốc: ${(medicalProfile?.allergies || []).join(', ') || 'Không có'}
- Thuốc đang dùng: ${(medicalProfile?.current_medications || []).join(', ') || 'Không có'}${ageInfo}${weightInfo}${pregnancyInfo}${medicalNotes}

## THUỐC TRONG GIỎ HÀNG:
${medicineList}

## YÊU CẦU PHÂN TÍCH:
Trả về JSON với format:
{
  "warnings": ["Cảnh báo nghiêm trọng về dị ứng, chống chỉ định, tương tác thuốc"],
  "recommendations": ["Khuyến nghị cho khách hàng"],
  "usageGuides": [
    {
      "medicine": "Tên thuốc",
      "guide": {
        "instruction": "Cách dùng chi tiết",
        "food": "Hướng dẫn uống với thức ăn",
        "warning": "Lưu ý đặc biệt",
        "dosage": "Liều dùng khuyến cáo (dựa trên tuổi/cân nặng nếu có)"
      }
    }
  ]
}

Lưu ý:
1. QUAN TRỌNG: Kiểm tra kỹ dị ứng - Nếu khách dị ứng với bất kỳ thuốc nào trong giỏ, PHẢI cảnh báo
2. Kiểm tra tương tác với thuốc đang dùng
3. Kiểm tra chống chỉ định với bệnh mãn tính
4. PHÂN TÍCH KỸ GHI CHÚ Y TẾ - Đây là thông tin quan trọng từ dược sĩ/bác sĩ
5. Nếu đang mang thai, PHẢI cảnh báo về các thuốc chống chỉ định với thai kỳ
6. Điều chỉnh liều dùng theo tuổi và cân nặng nếu có
7. Đưa ra hướng dẫn sử dụng cụ thể cho từng thuốc
8. Viết bằng tiếng Việt, dễ hiểu

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC.`

  try {
    // Rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    }
    lastRequestTime = Date.now()

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        warnings: parsed.warnings || [],
        recommendations: parsed.recommendations || [],
        usageGuides: parsed.usageGuides || []
      }
    }
  } catch (error) {
    console.error('[Medical AI] Gemini API error:', error)
  }

  // Fallback to offline analysis
  return analyzeOffline(medicalProfile, cartMedicines)
}

export default defineEventHandler(async (event) => {
  const method = event.method
  
  if (method !== 'POST') {
    return {
      status: false,
      message: 'Method not allowed'
    }
  }

  try {
    const body = await readBody(event)
    const { customer_id, cart_items, action } = body

    console.log('[Medical Profile Analysis] Request:', {
      customer_id,
      cart_items_count: cart_items?.length,
      action
    })

    // Validate input
    if (!customer_id && !body.medical_profile) {
      console.log('[Medical Profile Analysis] No customer_id or medical_profile provided')
      return {
        status: true,
        data: {
          has_warnings: false,
          warnings: [],
          recommendations: [],
          usageGuides: []
        },
        message: 'No customer selected - no analysis needed'
      }
    }

    // Get customer medical profile
    let medicalProfile = body.medical_profile
    if (customer_id && !medicalProfile) {
      const customer = await Customer.findById(customer_id).lean()
      console.log('[Medical Profile Analysis] Customer found:', customer ? 'yes' : 'no')
      console.log('[Medical Profile Analysis] Customer data:', JSON.stringify(customer, null, 2))
      if (!customer) {
        return {
          status: false,
          message: 'Customer not found'
        }
      }
      medicalProfile = customer.medical_profile
      console.log('[Medical Profile Analysis] Medical profile from DB:', JSON.stringify(medicalProfile, null, 2))
    }

    // Check if medical profile has any data
    const hasProfileData = medicalProfile && (
      (medicalProfile.chronic_conditions?.length > 0) ||
      (medicalProfile.allergies?.length > 0) ||
      (medicalProfile.current_medications?.length > 0) ||
      (medicalProfile.medical_notes?.trim()?.length > 0) ||
      (medicalProfile.pregnancy_status === true) ||
      (medicalProfile.blood_type?.trim()?.length > 0) ||
      (medicalProfile.age !== null && medicalProfile.age !== undefined) ||
      (medicalProfile.weight !== null && medicalProfile.weight !== undefined)
    )

    // Get medicine details for cart items
    let cartMedicines: any[] = []
    if (cart_items && cart_items.length > 0) {
      const medicineIds = cart_items.map((item: any) => item.medicine || item._id)
      // Get medicine details - don't populate category as it may not be a reference
      cartMedicines = await Medicine.find({ _id: { $in: medicineIds } }).lean()
      console.log('[Medical Profile Analysis] Found medicines:', cartMedicines.length)
      console.log('[Medical Profile Analysis] Medicine names:', cartMedicines.map(m => m.name))
    }

    // Always generate usage guides for medicines, even without medical profile
    if (cartMedicines.length === 0) {
      return {
        status: true,
        data: {
          has_warnings: false,
          has_profile: hasProfileData,
          medical_profile: medicalProfile,
          warnings: [],
          recommendations: [],
          usageGuides: []
        },
        message: 'No medicines in cart to analyze'
      }
    }

    // If no medical profile, just generate usage guides without warnings
    if (!hasProfileData) {
      console.log('[Medical Profile Analysis] No medical profile, generating basic usage guides')
      const basicUsageGuides = generateBasicUsageGuides(cartMedicines)
      return {
        status: true,
        data: {
          has_warnings: false,
          has_profile: false,
          warnings: [],
          recommendations: ['💊 Read the instructions carefully before use', '📞 Contact a doctor if you experience any unusual symptoms'],
          usageGuides: basicUsageGuides
        },
        message: 'Generated basic usage guides (no medical profile)'
      }
    }

    // Get API key
    const config = useRuntimeConfig()
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

    let analysisResult
    
    // action = 'quick' for POS checkout warnings (faster, offline)
    // action = 'full' for post-payment guide (can use AI)
    if (action === 'quick' || !apiKey) {
      // Quick offline analysis
      analysisResult = analyzeOffline(medicalProfile, cartMedicines)
    } else {
      // Full AI analysis
      analysisResult = await analyzeWithAI(medicalProfile, cartMedicines, apiKey)
    }

    return {
      status: true,
      data: {
        has_warnings: analysisResult.warnings.length > 0,
        has_profile: true,
        medical_profile: medicalProfile,
        warnings: analysisResult.warnings,
        recommendations: analysisResult.recommendations,
        usageGuides: analysisResult.usageGuides
      },
      message: 'Medical profile analysis completed'
    }

  } catch (error) {
    console.error('[Medical Profile Analysis] Error:', error)
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Analysis failed'
    }
  }
})
