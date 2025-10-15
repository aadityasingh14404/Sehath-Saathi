import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    genericName: { type: String, required: true },
    brandName: { type: String, required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['Antibiotic', 'Pain Relief', 'Cardiovascular', 'Diabetes', 'Respiratory', 'Digestive', 'Neurological', 'Dermatological', 'Vitamins', 'Other']
    },
    description: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g., "500mg", "10ml"
    form: { 
        type: String, 
        required: true,
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Patch']
    },
    manufacturer: { type: String, required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true }, // For profit calculation
    prescriptionRequired: { type: Boolean, default: false },
    sideEffects: [{ type: String }],
    contraindications: [{ type: String }],
    drugInteractions: [{ type: String }],
    storageConditions: { type: String, default: 'Store in cool, dry place' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate to link stocks for a medicine
medicineSchema.virtual('stocks', {
    ref: 'stock',
    localField: '_id',
    foreignField: 'medicineId'
});

const medicineModel = mongoose.models.medicine || mongoose.model("medicine", medicineSchema);
export default medicineModel;
