import mongoose from 'mongoose'

const symptomSchema = new mongoose.Schema(
  {
    symptom_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    keywords: [String],
    severity_questions: [String],
    associated_conditions: [String],
    red_flags: [String],
    common_medicines: [String],
    home_remedies: [String],
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Symptom || mongoose.model('Symptom', symptomSchema)
