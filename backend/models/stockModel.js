import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'medicine', required: true },
    currentStock: { type: Number, required: true, default: 0 },
    minimumStock: { type: Number, required: true, default: 10 },
    maximumStock: { type: Number, required: true, default: 1000 },
    reorderLevel: { type: Number, required: true, default: 20 },
    expiryDate: { type: Date, required: true },
    batchNumber: { type: String, required: true },
    supplier: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    location: { type: String, default: 'Main Store' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const stockModel = mongoose.models.stock || mongoose.model("stock", stockSchema);
export default stockModel;
