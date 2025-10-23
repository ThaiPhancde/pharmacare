/**
 * Import Symptoms Database to MongoDB
 * Run: node scripts/import-symptoms.js
 */

import mongoose from 'mongoose'
import symptomsData from '../database/symptoms-database.json' assert { type: 'json' }
import * as dotenv from 'dotenv'

dotenv.config()

// Symptom Schema
const SymptomSchema = new mongoose.Schema({
  symptom_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  keywords: [String],
  severity_questions: [String],
  associated_conditions: [String],
  red_flags: [String],
  common_medicines: [String],
  home_remedies: [String]
}, { timestamps: true })

// Condition Schema
const ConditionSchema = new mongoose.Schema({
  condition_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  symptoms: [String],
  duration: String,
  treatment_approach: String,
  first_line_medicines: [String],
  when_to_see_doctor: [String]
}, { timestamps: true })

// Drug Interaction Schema
const DrugInteractionSchema = new mongoose.Schema({
  medicine1: { type: String, required: true },
  medicine2: { type: String, required: true },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true },
  description: String,
  recommendation: String
}, { timestamps: true })

const Symptom = mongoose.model('Symptom', SymptomSchema)
const Condition = mongoose.model('Condition', ConditionSchema)
const DrugInteraction = mongoose.model('DrugInteraction', DrugInteractionSchema)

async function importSymptoms() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI || '')
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await Symptom.deleteMany({})
    await Condition.deleteMany({})
    await DrugInteraction.deleteMany({})

    // Import Symptoms
    console.log('📥 Importing symptoms...')
    const symptoms = symptomsData.symptoms.map(s => ({
      symptom_id: s.id,
      name: s.name,
      keywords: s.keywords,
      severity_questions: s.severity_questions,
      associated_conditions: s.associated_conditions,
      red_flags: s.red_flags,
      common_medicines: s.common_medicines,
      home_remedies: s.home_remedies
    }))
    await Symptom.insertMany(symptoms)
    console.log(`✅ Imported ${symptoms.length} symptoms`)

    // Import Conditions
    console.log('📥 Importing conditions...')
    const conditions = symptomsData.conditions.map(c => ({
      condition_id: c.id,
      name: c.name,
      symptoms: c.symptoms,
      duration: c.duration,
      treatment_approach: c.treatment_approach,
      first_line_medicines: c.first_line_medicines,
      when_to_see_doctor: c.when_to_see_doctor
    }))
    await Condition.insertMany(conditions)
    console.log(`✅ Imported ${conditions.length} conditions`)

    // Import Drug Interactions
    console.log('📥 Importing drug interactions...')
    const interactions = symptomsData.drug_interactions.map(di => ({
      medicine1: di.medicine1,
      medicine2: di.medicine2,
      severity: di.severity,
      description: di.description,
      recommendation: di.recommendation
    }))
    await DrugInteraction.insertMany(interactions)
    console.log(`✅ Imported ${interactions.length} drug interactions`)

    console.log('\n🎉 Import completed successfully!')
    console.log(`\n📊 Summary:
- Symptoms: ${symptoms.length}
- Conditions: ${conditions.length}
- Drug Interactions: ${interactions.length}
`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run
importSymptoms()
