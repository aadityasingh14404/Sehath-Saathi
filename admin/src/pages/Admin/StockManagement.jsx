import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const StockManagement = () => {
    const [stocks, setStocks] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [lowStockMedicines, setLowStockMedicines] = useState([]);
    const [expiringMedicines, setExpiringMedicines] = useState([]);

    const [formData, setFormData] = useState({
        medicineId: '',
        currentStock: '',
        minimumStock: '',
        maximumStock: '',
        reorderLevel: '',
        expiryDate: '',
        batchNumber: '',
        supplier: '',
        purchaseDate: '',
        purchasePrice: '',
        sellingPrice: '',
        location: 'Main Store'
    });

    const backendBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
    const aToken = localStorage.getItem('aToken') || '';

    useEffect(() => {
        fetchStocks();
        fetchMedicines();
        fetchLowStockMedicines();
        fetchExpiringMedicines();
    }, []);

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendBase}/api/medicine/low-stock`, {
                headers: { aToken }
            });
            const data = await response.json();
            
            if (response.ok) {
                setStocks(data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to fetch stock data');
        } finally {
            setLoading(false);
        }
    };

    const fetchMedicines = async () => {
        try {
            const response = await fetch(`${backendBase}/api/medicine?limit=1000`);
            const data = await response.json();
            
            if (response.ok) {
                setMedicines(data.medicines);
            }
        } catch (error) {
            console.error('Failed to fetch medicines:', error);
        }
    };

    const fetchLowStockMedicines = async () => {
        try {
            const response = await fetch(`${backendBase}/api/medicine/low-stock`, {
                headers: { aToken }
            });
            const data = await response.json();
            
            if (response.ok) {
                setLowStockMedicines(data);
            }
        } catch (error) {
            console.error('Failed to fetch low stock medicines:', error);
        }
    };

    const fetchExpiringMedicines = async () => {
        try {
            const response = await fetch(`${backendBase}/api/medicine/expiring?days=30`, {
                headers: { aToken }
            });
            const data = await response.json();
            
            if (response.ok) {
                setExpiringMedicines(data);
            }
        } catch (error) {
            console.error('Failed to fetch expiring medicines:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingStock 
                ? `${backendBase}/api/medicine/stock/${editingStock._id}`
                : `${backendBase}/api/medicine/${formData.medicineId}/stock`;
            
            const method = editingStock ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify({
                    ...formData,
                    currentStock: parseInt(formData.currentStock),
                    minimumStock: parseInt(formData.minimumStock),
                    maximumStock: parseInt(formData.maximumStock),
                    reorderLevel: parseInt(formData.reorderLevel),
                    purchasePrice: parseFloat(formData.purchasePrice),
                    sellingPrice: parseFloat(formData.sellingPrice),
                    expiryDate: new Date(formData.expiryDate),
                    purchaseDate: new Date(formData.purchaseDate)
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success(editingStock ? 'Stock updated successfully' : 'Stock added successfully');
                setShowAddForm(false);
                setEditingStock(null);
                resetForm();
                fetchStocks();
                fetchLowStockMedicines();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to save stock');
        }
    };

    const handleEdit = (stock) => {
        setEditingStock(stock);
        setFormData({
            medicineId: stock.medicineId._id,
            currentStock: stock.currentStock.toString(),
            minimumStock: stock.minimumStock.toString(),
            maximumStock: stock.maximumStock.toString(),
            reorderLevel: stock.reorderLevel.toString(),
            expiryDate: new Date(stock.expiryDate).toISOString().split('T')[0],
            batchNumber: stock.batchNumber,
            supplier: stock.supplier,
            purchaseDate: new Date(stock.purchaseDate).toISOString().split('T')[0],
            purchasePrice: stock.purchasePrice.toString(),
            sellingPrice: stock.sellingPrice.toString(),
            location: stock.location
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setFormData({
            medicineId: '',
            currentStock: '',
            minimumStock: '',
            maximumStock: '',
            reorderLevel: '',
            expiryDate: '',
            batchNumber: '',
            supplier: '',
            purchaseDate: '',
            purchasePrice: '',
            sellingPrice: '',
            location: 'Main Store'
        });
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setEditingStock(null);
        resetForm();
    };

    const getStockStatus = (currentStock, reorderLevel) => {
        if (currentStock <= reorderLevel) return 'Low';
        if (currentStock <= reorderLevel * 1.5) return 'Medium';
        return 'Good';
    };

    const getStockStatusColor = (status) => {
        switch (status) {
            case 'Low': return 'bg-red-100 text-red-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Good': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDaysUntilExpiry = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className='p-6'>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Stock Management</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2'
                >
                    <img src={assets.add_icon} alt='' className='w-4 h-4' />
                    Add Stock
                </button>
            </div>

            {/* Alerts */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                    <h3 className='text-lg font-semibold text-red-800 mb-2'>Low Stock Alert</h3>
                    <p className='text-red-600'>{lowStockMedicines.length} medicines are running low</p>
                    {lowStockMedicines.slice(0, 3).map((stock) => (
                        <p key={stock._id} className='text-sm text-red-600 mt-1'>
                            • {stock.medicineId.name} - {stock.currentStock} remaining
                        </p>
                    ))}
                </div>
                
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                    <h3 className='text-lg font-semibold text-yellow-800 mb-2'>Expiring Soon</h3>
                    <p className='text-yellow-600'>{expiringMedicines.length} medicines expiring in 30 days</p>
                    {expiringMedicines.slice(0, 3).map((stock) => (
                        <p key={stock._id} className='text-sm text-yellow-600 mt-1'>
                            • {stock.medicineId.name} - {getDaysUntilExpiry(stock.expiryDate)} days left
                        </p>
                    ))}
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                        <h2 className='text-xl font-bold mb-4'>
                            {editingStock ? 'Edit Stock' : 'Add New Stock'}
                        </h2>
                        <form onSubmit={handleSubmit} className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Medicine *</label>
                                <select
                                    required
                                    value={formData.medicineId}
                                    onChange={(e) => setFormData({...formData, medicineId: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    disabled={editingStock}
                                >
                                    <option value=''>Select Medicine</option>
                                    {medicines.map(medicine => (
                                        <option key={medicine._id} value={medicine._id}>
                                            {medicine.name} ({medicine.brandName})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Current Stock *</label>
                                    <input
                                        type='number'
                                        required
                                        value={formData.currentStock}
                                        onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Minimum Stock *</label>
                                    <input
                                        type='number'
                                        required
                                        value={formData.minimumStock}
                                        onChange={(e) => setFormData({...formData, minimumStock: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Maximum Stock *</label>
                                    <input
                                        type='number'
                                        required
                                        value={formData.maximumStock}
                                        onChange={(e) => setFormData({...formData, maximumStock: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Reorder Level *</label>
                                    <input
                                        type='number'
                                        required
                                        value={formData.reorderLevel}
                                        onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Expiry Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Purchase Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Batch Number *</label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.batchNumber}
                                        onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Supplier *</label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Purchase Price *</label>
                                    <input
                                        type='number'
                                        required
                                        step='0.01'
                                        value={formData.purchasePrice}
                                        onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Selling Price *</label>
                                    <input
                                        type='number'
                                        required
                                        step='0.01'
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Location</label>
                                <input
                                    type='text'
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>

                            <div className='flex gap-4 pt-4'>
                                <button
                                    type='submit'
                                    className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
                                >
                                    {editingStock ? 'Update' : 'Add'} Stock
                                </button>
                                <button
                                    type='button'
                                    onClick={handleCancel}
                                    className='bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600'
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock List */}
            <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
                {loading ? (
                    <div className='p-8 text-center'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                        <p className='mt-2 text-gray-600'>Loading stock data...</p>
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Medicine</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Current Stock</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Expiry Date</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Batch Number</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Supplier</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='bg-white divide-y divide-gray-200'>
                                {stocks.map((stock) => {
                                    const status = getStockStatus(stock.currentStock, stock.reorderLevel);
                                    const daysUntilExpiry = getDaysUntilExpiry(stock.expiryDate);
                                    
                                    return (
                                        <tr key={stock._id} className='hover:bg-gray-50'>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div>
                                                    <div className='text-sm font-medium text-gray-900'>{stock.medicineId.name}</div>
                                                    <div className='text-sm text-gray-500'>{stock.medicineId.brandName}</div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                {stock.currentStock}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockStatusColor(status)}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                <div>{new Date(stock.expiryDate).toLocaleDateString()}</div>
                                                <div className={`text-xs ${daysUntilExpiry <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {daysUntilExpiry} days left
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                {stock.batchNumber}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                {stock.supplier}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                                <button
                                                    onClick={() => handleEdit(stock)}
                                                    className='text-blue-600 hover:text-blue-900'
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockManagement;
