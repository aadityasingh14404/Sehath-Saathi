import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const MedicineManagement = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        brandName: '',
        category: '',
        description: '',
        dosage: '',
        form: '',
        manufacturer: '',
        price: '',
        costPrice: '',
        prescriptionRequired: false,
        sideEffects: '',
        contraindications: '',
        drugInteractions: '',
        storageConditions: 'Store in cool, dry place'
    });

    const categories = [
        'Antibiotic', 'Pain Relief', 'Cardiovascular', 'Diabetes', 
        'Respiratory', 'Digestive', 'Neurological', 'Dermatological', 
        'Vitamins', 'Other'
    ];

    const forms = [
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 
        'Ointment', 'Drops', 'Inhaler', 'Patch'
    ];

    useEffect(() => {
        fetchMedicines();
    }, [currentPage, searchTerm, selectedCategory]);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10
            });
            
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory) params.append('category', selectedCategory);

            const response = await fetch(`http://localhost:4000/api/medicine?${params}`);
            const data = await response.json();
            
            if (response.ok) {
                setMedicines(data.medicines);
                setTotalPages(data.totalPages);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to fetch medicines');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingMedicine 
                ? `http://localhost:4000/api/medicine/${editingMedicine._id}`
                : 'http://localhost:4000/api/medicine';
            
            const method = editingMedicine ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    ...formData,
                    sideEffects: formData.sideEffects.split(',').map(s => s.trim()).filter(s => s),
                    contraindications: formData.contraindications.split(',').map(s => s.trim()).filter(s => s),
                    drugInteractions: formData.drugInteractions.split(',').map(s => s.trim()).filter(s => s),
                    price: parseFloat(formData.price),
                    costPrice: parseFloat(formData.costPrice)
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success(editingMedicine ? 'Medicine updated successfully' : 'Medicine added successfully');
                setShowAddForm(false);
                setEditingMedicine(null);
                resetForm();
                fetchMedicines();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to save medicine');
        }
    };

    const handleEdit = (medicine) => {
        setEditingMedicine(medicine);
        setFormData({
            name: medicine.name,
            genericName: medicine.genericName,
            brandName: medicine.brandName,
            category: medicine.category,
            description: medicine.description,
            dosage: medicine.dosage,
            form: medicine.form,
            manufacturer: medicine.manufacturer,
            price: medicine.price.toString(),
            costPrice: medicine.costPrice.toString(),
            prescriptionRequired: medicine.prescriptionRequired,
            sideEffects: medicine.sideEffects.join(', '),
            contraindications: medicine.contraindications.join(', '),
            drugInteractions: medicine.drugInteractions.join(', '),
            storageConditions: medicine.storageConditions
        });
        setShowAddForm(true);
    };

    const handleDelete = async (medicineId) => {
        if (window.confirm('Are you sure you want to delete this medicine?')) {
            try {
                const response = await fetch(`http://localhost:4000/api/medicine/${medicineId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });

                const data = await response.json();
                
                if (response.ok) {
                    toast.success('Medicine deleted successfully');
                    fetchMedicines();
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error('Failed to delete medicine');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            genericName: '',
            brandName: '',
            category: '',
            description: '',
            dosage: '',
            form: '',
            manufacturer: '',
            price: '',
            costPrice: '',
            prescriptionRequired: false,
            sideEffects: '',
            contraindications: '',
            drugInteractions: '',
            storageConditions: 'Store in cool, dry place'
        });
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setEditingMedicine(null);
        resetForm();
    };

    return (
        <div className='p-6'>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Medicine Management</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2'
                >
                    <img src={assets.add_icon} alt='' className='w-4 h-4' />
                    Add Medicine
                </button>
            </div>

            {/* Search and Filter */}
            <div className='bg-white p-4 rounded-lg shadow-sm mb-6'>
                <div className='flex gap-4 items-center'>
                    <div className='flex-1'>
                        <input
                            type='text'
                            placeholder='Search medicines...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className='p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        <option value=''>All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                        <h2 className='text-xl font-bold mb-4'>
                            {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                        </h2>
                        <form onSubmit={handleSubmit} className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Generic Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.genericName}
                                        onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Brand Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.brandName}
                                        onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Category *</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>Select Category</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Description *</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    rows={3}
                                />
                            </div>

                            <div className='grid grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Dosage *</label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.dosage}
                                        onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Form *</label>
                                    <select
                                        required
                                        value={formData.form}
                                        onChange={(e) => setFormData({...formData, form: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>Select Form</option>
                                        {forms.map(form => (
                                            <option key={form} value={form}>{form}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Manufacturer *</label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.manufacturer}
                                        onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Selling Price *</label>
                                    <input
                                        type='number'
                                        required
                                        step='0.01'
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Cost Price *</label>
                                    <input
                                        type='number'
                                        required
                                        step='0.01'
                                        value={formData.costPrice}
                                        onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                                        className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center gap-2'>
                                <input
                                    type='checkbox'
                                    id='prescriptionRequired'
                                    checked={formData.prescriptionRequired}
                                    onChange={(e) => setFormData({...formData, prescriptionRequired: e.target.checked})}
                                    className='w-4 h-4'
                                />
                                <label htmlFor='prescriptionRequired' className='text-sm font-medium text-gray-700'>
                                    Prescription Required
                                </label>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Side Effects (comma separated)</label>
                                <input
                                    type='text'
                                    value={formData.sideEffects}
                                    onChange={(e) => setFormData({...formData, sideEffects: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Contraindications (comma separated)</label>
                                <input
                                    type='text'
                                    value={formData.contraindications}
                                    onChange={(e) => setFormData({...formData, contraindications: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Drug Interactions (comma separated)</label>
                                <input
                                    type='text'
                                    value={formData.drugInteractions}
                                    onChange={(e) => setFormData({...formData, drugInteractions: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Storage Conditions</label>
                                <input
                                    type='text'
                                    value={formData.storageConditions}
                                    onChange={(e) => setFormData({...formData, storageConditions: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>

                            <div className='flex gap-4 pt-4'>
                                <button
                                    type='submit'
                                    className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
                                >
                                    {editingMedicine ? 'Update' : 'Add'} Medicine
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

            {/* Medicines List */}
            <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
                {loading ? (
                    <div className='p-8 text-center'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                        <p className='mt-2 text-gray-600'>Loading medicines...</p>
                    </div>
                ) : (
                    <>
                        <div className='overflow-x-auto'>
                            <table className='w-full'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Medicine</th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Category</th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Dosage</th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Price</th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Prescription</th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {medicines.map((medicine) => (
                                        <tr key={medicine._id} className='hover:bg-gray-50'>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div>
                                                    <div className='text-sm font-medium text-gray-900'>{medicine.name}</div>
                                                    <div className='text-sm text-gray-500'>{medicine.brandName}</div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                                                    {medicine.category}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                {medicine.dosage} ({medicine.form})
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                ₹{medicine.price}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    medicine.prescriptionRequired 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {medicine.prescriptionRequired ? 'Required' : 'Not Required'}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                                <div className='flex gap-2'>
                                                    <button
                                                        onClick={() => handleEdit(medicine)}
                                                        className='text-blue-600 hover:text-blue-900'
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(medicine._id)}
                                                        className='text-red-600 hover:text-red-900'
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className='px-6 py-3 border-t border-gray-200 flex items-center justify-between'>
                                <div className='text-sm text-gray-700'>
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className='flex gap-2'>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MedicineManagement;
