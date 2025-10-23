import mongoose from 'mongoose'

const conditionSchema = new mongoose.Schema(
  {
    condition_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    symptoms: [String],
    duration: String,
    treatment_approach: String,
    first_line_medicines: [String],
    when_to_see_doctor: [String],
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Condition || mongoose.model('Condition', conditionSchema)
