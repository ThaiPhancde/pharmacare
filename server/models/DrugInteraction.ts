import mongoose from 'mongoose'

const drugInteractionSchema = new mongoose.Schema(
  {
    medicine1: {
      type: String,
      required: true,
      index: true,
    },
    medicine2: {
      type: String,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true,
    },
    description: String,
    recommendation: String,
  },
  {
    timestamps: true,
  },
)

// Compound index for faster lookups
drugInteractionSchema.index({ medicine1: 1, medicine2: 1 })

export default mongoose.models.DrugInteraction || mongoose.model('DrugInteraction', drugInteractionSchema)
