import medicineModel from "../models/medicineModel.js";
import stockModel from "../models/stockModel.js";
import medicineOrderModel from "../models/medicineOrderModel.js";
import mongoose from "mongoose";

// Get all medicines with pagination and filters
export const getAllMedicines = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search, prescriptionRequired } = req.query;
        const query = { isActive: true };

        if (category) query.category = category;
        if (prescriptionRequired !== undefined) query.prescriptionRequired = prescriptionRequired === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { brandName: { $regex: search, $options: 'i' } }
            ];
        }

        const medicines = await medicineModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('stocks', 'currentStock minimumStock expiryDate');

        const total = await medicineModel.countDocuments(query);

        res.status(200).json({
            medicines,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single medicine by ID
export const getMedicineById = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await medicineModel.findById(id)
            .populate('stocks', 'currentStock minimumStock expiryDate batchNumber');

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.status(200).json(medicine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add new medicine
export const addMedicine = async (req, res) => {
    try {
        const medicineData = req.body;
        const newMedicine = new medicineModel(medicineData);
        await newMedicine.save();

        res.status(201).json({ message: 'Medicine added successfully', medicine: newMedicine });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update medicine
export const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body, updatedAt: new Date() };
        
        const updatedMedicine = await medicineModel.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        );

        if (!updatedMedicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.status(200).json({ message: 'Medicine updated successfully', medicine: updatedMedicine });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete medicine (soft delete)
export const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedMedicine = await medicineModel.findByIdAndUpdate(
            id, 
            { isActive: false, updatedAt: new Date() }, 
            { new: true }
        );

        if (!deletedMedicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.status(200).json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Stock Management Functions

// Add stock for medicine
export const addStock = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const stockData = { ...req.body, medicineId };

        // Check if medicine exists
        const medicine = await medicineModel.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        const newStock = new stockModel(stockData);
        await newStock.save();

        // Update medicine's current stock
        await medicineModel.findByIdAndUpdate(medicineId, {
            $inc: { currentStock: stockData.currentStock }
        });

        res.status(201).json({ message: 'Stock added successfully', stock: newStock });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update stock
export const updateStock = async (req, res) => {
    try {
        const { stockId } = req.params;
        const updateData = { ...req.body, updatedAt: new Date() };

        const updatedStock = await stockModel.findByIdAndUpdate(stockId, updateData, { new: true });
        
        if (!updatedStock) {
            return res.status(404).json({ message: 'Stock not found' });
        }

        res.status(200).json({ message: 'Stock updated successfully', stock: updatedStock });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get low stock medicines
export const getLowStockMedicines = async (req, res) => {
    try {
        const lowStockMedicines = await stockModel.find({
            $expr: { $lte: ["$currentStock", "$reorderLevel"] },
            isActive: true
        }).populate('medicineId', 'name brandName category');

        res.status(200).json(lowStockMedicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get expiring medicines
export const getExpiringMedicines = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(days));

        const expiringMedicines = await stockModel.find({
            expiryDate: { $lte: expiryDate },
            isActive: true
        }).populate('medicineId', 'name brandName category');

        res.status(200).json(expiringMedicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Analytics Functions

// Get medicine analytics
export const getMedicineAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Total medicines
        const totalMedicines = await medicineModel.countDocuments({ isActive: true });

        // Low stock count
        const lowStockCount = await stockModel.countDocuments({
            $expr: { $lte: ["$currentStock", "$reorderLevel"] },
            isActive: true
        });

        // Expiring medicines count (next 30 days)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const expiringCount = await stockModel.countDocuments({
            expiryDate: { $lte: expiryDate },
            isActive: true
        });

        // Sales analytics
        const salesData = await medicineOrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $in: ['delivered', 'shipped'] }
                }
            },
            {
                $unwind: '$medicines'
            },
            {
                $group: {
                    _id: '$medicines.medicineId',
                    totalQuantity: { $sum: '$medicines.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$medicines.quantity', '$medicines.price'] } }
                }
            },
            {
                $lookup: {
                    from: 'medicines',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'medicine'
                }
            },
            {
                $unwind: '$medicine'
            },
            {
                $sort: { totalQuantity: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Category-wise distribution
        const categoryDistribution = await medicineModel.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Monthly sales trend
        const monthlySales = await medicineOrderModel.aggregate([
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
                        month: { $month: '$createdAt' }
                    },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$finalAmount' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.status(200).json({
            totalMedicines,
            lowStockCount,
            expiringCount,
            topSellingMedicines: salesData,
            categoryDistribution,
            monthlySales,
            period: `${period} days`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get medicine sales report
export const getMedicineSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, medicineId } = req.query;
        
        let matchQuery = {};
        if (startDate && endDate) {
            matchQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (medicineId) {
            matchQuery['medicines.medicineId'] = new mongoose.Types.ObjectId(medicineId);
        }

        const salesReport = await medicineOrderModel.aggregate([
            { $match: matchQuery },
            { $unwind: '$medicines' },
            {
                $group: {
                    _id: '$medicines.medicineId',
                    totalQuantity: { $sum: '$medicines.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$medicines.quantity', '$medicines.price'] } },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'medicines',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'medicine'
                }
            },
            {
                $unwind: '$medicine'
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        res.status(200).json(salesReport);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search medicines
export const searchMedicines = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const medicines = await medicineModel.find({
            $and: [
                { isActive: true },
                {
                    $or: [
                        { name: { $regex: q, $options: 'i' } },
                        { genericName: { $regex: q, $options: 'i' } },
                        { brandName: { $regex: q, $options: 'i' } },
                        { category: { $regex: q, $options: 'i' } }
                    ]
                }
            ]
        }).limit(20);

        res.status(200).json(medicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
