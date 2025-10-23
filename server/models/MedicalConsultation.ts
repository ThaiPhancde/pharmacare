/**
 * Medical Consultation Model
 * Tracks patient consultation sessions with AI doctor
 */

import mongoose from 'mongoose'

const medicalConsultationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patientInfo: {
      age: Number,
      gender: String, // male/female/other
      weight: Number, // kg
      height: Number, // cm
      isPregnant: Boolean,
      isBreastfeeding: Boolean,
      chronicDiseases: [String], // ['diabetes', 'hypertension', 'asthma']
      allergies: [String], // ['penicillin', 'sulfa drugs']
      currentMedications: [
        {
          medicineName: String,
          dosage: String,
          frequency: String,
          startDate: Date,
        },
      ],
    },
    consultationStage: {
      type: String,
      enum: ['greeting', 'patient_info', 'symptoms_inquiry', 'medical_history', 'analysis', 'recommendation', 'follow_up', 'completed'],
      default: 'greeting',
    },
    symptoms: [
      {
        symptom: String,
        severity: String, // mild/moderate/severe
        duration: String, // '2 days', '1 week'
        frequency: String, // 'constant', 'intermittent'
        additionalInfo: String,
      },
    ],
    vitalSigns: {
      temperature: Number, // °C
      bloodPressure: String, // '120/80'
      heartRate: Number, // bpm
      respiratoryRate: Number, // breaths/min
    },
    diagnosis: {
      primary: String, // Main suspected condition
      differential: [String], // Alternative diagnoses
      reasoning: String, // AI's medical reasoning
      confidence: Number, // 0-100%
    },
    recommendations: [
      {
        medicineId: mongoose.Schema.Types.ObjectId,
        medicineName: String,
        dosage: String,
        frequency: String,
        duration: String,
        route: String, // oral/topical/injection
        timing: String, // 'before meals', 'after meals', 'bedtime'
        reasoning: String, // Why this medicine
        warnings: [String],
        expectedEffect: String,
        alternatives: [
          {
            medicineId: mongoose.Schema.Types.ObjectId,
            name: String,
            reason: String,
          },
        ],
      },
    ],
    interactions: [
      {
        medicine1: String,
        medicine2: String,
        severity: String, // mild/moderate/severe
        description: String,
        recommendation: String,
      },
    ],
    contraindications: [
      {
        medicine: String,
        reason: String,
        severity: String,
      },
    ],
    followUp: {
      scheduled: Boolean,
      date: Date,
      questions: [String],
      status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
      },
      response: {
        improvement: String, // 'improved', 'same', 'worse'
        sideEffects: [String],
        adherence: String, // 'full', 'partial', 'none'
        additionalSymptoms: [String],
      },
    },
    conversationHistory: [
      {
        role: String, // 'doctor' | 'patient'
        message: String,
        timestamp: Date,
        messageType: String, // 'text', 'card', 'form', 'buttons'
        actionButtons: [
          {
            label: String,
            action: String,
            data: mongoose.Schema.Types.Mixed,
          },
        ],
      },
    ],
    aiMetadata: {
      model: String, // 'gemini-2.0-flash'
      tokensUsed: Number,
      promptVersion: String,
      reasoning: String, // Chain-of-thought reasoning
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned', 'follow_up_pending'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
medicalConsultationSchema.index({ sessionId: 1, status: 1 })
medicalConsultationSchema.index({ 'followUp.date': 1, 'followUp.status': 1 })
medicalConsultationSchema.index({ createdAt: -1 })

export default mongoose.models.MedicalConsultation || mongoose.model('MedicalConsultation', medicalConsultationSchema)
