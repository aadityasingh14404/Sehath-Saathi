import medicineOrderModel from "../models/medicineOrderModel.js";
import medicineModel from "../models/medicineModel.js";
import stockModel from "../models/stockModel.js";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import mongoose from "mongoose";

// Create medicine order
export const createMedicineOrder = async (req, res) => {
    try {
        const { userId, medicines, shippingAddress, notes, appointmentId, doctorId } = req.body;

        // Validate medicines and check stock
        let totalAmount = 0;
        const validatedMedicines = [];

        for (const medicine of medicines) {
            const medicineDoc = await medicineModel.findById(medicine.medicineId);
            if (!medicineDoc) {
                return res.status(404).json({ message: `Medicine ${medicine.medicineId} not found` });
            }

            // Check stock availability
            const stock = await stockModel.findOne({
                medicineId: medicine.medicineId,
                currentStock: { $gte: medicine.quantity },
                isActive: true
            });

            if (!stock) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${medicineDoc.name}` 
                });
            }

            const medicineTotal = medicine.quantity * medicineDoc.price;
            totalAmount += medicineTotal;

            validatedMedicines.push({
                medicineId: medicine.medicineId,
                quantity: medicine.quantity,
                price: medicineDoc.price,
                prescriptionRequired: medicineDoc.prescriptionRequired,
                prescriptionImage: medicine.prescriptionImage || ''
            });
        }

        // Generate order ID
        const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const orderData = {
            orderId,
            userId,
            doctorId: doctorId || null,
            appointmentId: appointmentId || null,
            medicines: validatedMedicines,
            totalAmount,
            finalAmount: totalAmount, // No discount for now
            shippingAddress,
            notes: notes || ''
        };

        const newOrder = new medicineOrderModel(orderData);
        await newOrder.save();

        // Populate the order with medicine details
        await newOrder.populate('medicines.medicineId', 'name brandName category');

        res.status(201).json({ 
            message: 'Order created successfully', 
            order: newOrder 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user orders
export const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        let query = { userId };
        if (status) query.status = status;

        const orders = await medicineOrderModel.find(query)
            .populate('medicines.medicineId', 'name brandName category image')
            .populate('doctorId', 'name speciality')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await medicineOrderModel.countDocuments(query);

        res.status(200).json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all orders (admin)
export const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};
        if (status) query.status = status;

        const orders = await medicineOrderModel.find(query)
            .populate('userId', 'name email phone')
            .populate('medicines.medicineId', 'name brandName category')
            .populate('doctorId', 'name speciality')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await medicineOrderModel.countDocuments(query);

        res.status(200).json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;

        const order = await medicineOrderModel.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If order is being delivered, update stock
        if (status === 'delivered' && order.status !== 'delivered') {
            for (const medicine of order.medicines) {
                await stockModel.findOneAndUpdate(
                    { medicineId: medicine.medicineId, isActive: true },
                    { $inc: { currentStock: -medicine.quantity } }
                );
            }
        }

        const updatedOrder = await medicineOrderModel.findOneAndUpdate(
            { orderId },
            { 
                status, 
                notes: notes || order.notes,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('medicines.medicineId', 'name brandName category');

        res.status(200).json({ 
            message: 'Order status updated successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await medicineOrderModel.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({ message: 'Cannot cancel delivered order' });
        }

        const updatedOrder = await medicineOrderModel.findOneAndUpdate(
            { orderId },
            { 
                status: 'cancelled',
                notes: `Cancelled: ${reason || 'No reason provided'}`,
                updatedAt: new Date()
            },
            { new: true }
        );

        res.status(200).json({ 
            message: 'Order cancelled successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await medicineOrderModel.findOne({ orderId })
            .populate('userId', 'name email phone address')
            .populate('medicines.medicineId', 'name brandName category image')
            .populate('doctorId', 'name speciality email')
            .populate('appointmentId', 'slotDate slotTime');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Doctor prescription functions

// Create prescription
export const createPrescription = async (req, res) => {
    try {
        const { doctorId, patientId, medicines, notes, appointmentId } = req.body;

        // Validate doctor
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Validate patient
        const patient = await userModel.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Create order with prescription
        const orderData = {
            userId: patientId,
            doctorId,
            appointmentId,
            medicines: medicines.map(med => ({
                medicineId: med.medicineId,
                quantity: med.quantity,
                prescriptionRequired: true,
                prescriptionImage: med.prescriptionImage || ''
            })),
            notes: `Prescription by Dr. ${doctor.name}: ${notes || ''}`,
            status: 'pending'
        };

        const result = await createMedicineOrder({ body: orderData }, res);
        return result;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get doctor prescriptions
export const getDoctorPrescriptions = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const prescriptions = await medicineOrderModel.find({ doctorId })
            .populate('userId', 'name email phone')
            .populate('medicines.medicineId', 'name brandName category')
            .populate('appointmentId', 'slotDate slotTime')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await medicineOrderModel.countDocuments({ doctorId });

        res.status(200).json({
            prescriptions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get order analytics
export const getOrderAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Total orders
        const totalOrders = await medicineOrderModel.countDocuments({
            createdAt: { $gte: startDate }
        });

        // Orders by status
        const ordersByStatus = await medicineOrderModel.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue analytics
        const revenueData = await medicineOrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $in: ['delivered', 'shipped'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$finalAmount' },
                    averageOrderValue: { $avg: '$finalAmount' }
                }
            }
        ]);

        // Daily sales trend
        const dailySales = await medicineOrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $in: ['delivered', 'shipped'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    totalRevenue: { $sum: '$finalAmount' },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        res.status(200).json({
            totalOrders,
            ordersByStatus,
            revenueData: revenueData[0] || { totalRevenue: 0, averageOrderValue: 0 },
            dailySales,
            period: `${period} days`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
