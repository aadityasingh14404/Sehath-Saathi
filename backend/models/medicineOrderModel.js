import mongoose from "mongoose";

const medicineOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', default: null },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointment', default: null },
    medicines: [{
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'medicine', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        prescriptionRequired: { type: Boolean, default: false },
        prescriptionImage: { type: String, default: '' }
    }],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: { type: String, default: 'online' },
    shippingAddress: {
        line1: { type: String, required: true },
        line2: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true }
    },
    deliveryDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const medicineOrderModel = mongoose.models.medicineOrder || mongoose.model("medicineOrder", medicineOrderSchema);
export default medicineOrderModel;
