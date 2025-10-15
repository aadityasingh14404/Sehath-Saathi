import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';

const MedicineOrder = () => {
    const [medicines, setMedicines] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);

    const [checkoutData, setCheckoutData] = useState({
        shippingAddress: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: '',
            phone: ''
        },
        notes: ''
    });

    const categories = [
        'Antibiotic', 'Pain Relief', 'Cardiovascular', 'Diabetes', 
        'Respiratory', 'Digestive', 'Neurological', 'Dermatological', 
        'Vitamins', 'Other'
    ];

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                limit: 100
            });
            
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory) params.append('category', selectedCategory);

            const response = await fetch(`http://localhost:4000/api/medicine?${params}`);
            const data = await response.json();
            
            if (response.ok) {
                setMedicines(data.medicines);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to fetch medicines');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (medicine) => {
        if (medicine.prescriptionRequired) {
            toast.error('This medicine requires a prescription. Please consult a doctor.');
            return;
        }

        const existingItem = cart.find(item => item._id === medicine._id);
        if (existingItem) {
            setCart(cart.map(item => 
                item._id === medicine._id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...medicine, quantity: 1 }]);
        }
        toast.success('Medicine added to cart');
    };

    const removeFromCart = (medicineId) => {
        setCart(cart.filter(item => item._id !== medicineId));
        toast.success('Medicine removed from cart');
    };

    const updateQuantity = (medicineId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(medicineId);
            return;
        }
        setCart(cart.map(item => 
            item._id === medicineId 
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    const getTotalAmount = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        if (!checkoutData.shippingAddress.line1 || !checkoutData.shippingAddress.city || 
            !checkoutData.shippingAddress.state || !checkoutData.shippingAddress.pincode || 
            !checkoutData.shippingAddress.phone) {
            toast.error('Please fill in all required shipping details');
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/medicine/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({
                    userId: localStorage.getItem('userId'),
                    medicines: cart.map(item => ({
                        medicineId: item._id,
                        quantity: item.quantity
                    })),
                    shippingAddress: checkoutData.shippingAddress,
                    notes: checkoutData.notes
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success('Order placed successfully!');
                setCart([]);
                setShowCheckout(false);
                setShowCart(false);
                setCheckoutData({
                    shippingAddress: {
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        pincode: '',
                        phone: ''
                    },
                    notes: ''
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to place order');
        }
    };

    const filteredMedicines = medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.brandName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className='p-6'>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Medicine Store</h1>
                <button
                    onClick={() => setShowCart(true)}
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 relative'
                >
                    <img src={assets.list_icon} alt='' className='w-4 h-4' />
                    Cart ({cart.length})
                    {cart.length > 0 && (
                        <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                            {cart.length}
                        </span>
                    )}
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
                    <button
                        onClick={fetchMedicines}
                        className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Medicines Grid */}
            {loading ? (
                <div className='flex items-center justify-center h-64'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                    <p className='ml-2 text-gray-600'>Loading medicines...</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                    {filteredMedicines.map((medicine) => (
                        <div key={medicine._id} className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'>
                            <div className='p-4'>
                                <div className='mb-3'>
                                    <h3 className='font-semibold text-gray-900 text-lg'>{medicine.name}</h3>
                                    <p className='text-gray-600 text-sm'>{medicine.brandName}</p>
                                    <p className='text-gray-500 text-xs'>{medicine.genericName}</p>
                                </div>
                                
                                <div className='mb-3'>
                                    <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                                        {medicine.category}
                                    </span>
                                    <span className='inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full ml-1'>
                                        {medicine.form}
                                    </span>
                                </div>

                                <div className='mb-3'>
                                    <p className='text-sm text-gray-600'>{medicine.description}</p>
                                    <p className='text-sm text-gray-500 mt-1'>Dosage: {medicine.dosage}</p>
                                </div>

                                <div className='flex items-center justify-between mb-3'>
                                    <span className='text-lg font-bold text-green-600'>₹{medicine.price}</span>
                                    {medicine.prescriptionRequired && (
                                        <span className='text-xs bg-red-100 text-red-800 px-2 py-1 rounded'>
                                            Prescription Required
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => addToCart(medicine)}
                                    disabled={medicine.prescriptionRequired}
                                    className={`w-full py-2 rounded-lg font-medium ${
                                        medicine.prescriptionRequired
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {medicine.prescriptionRequired ? 'Prescription Required' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cart Modal */}
            {showCart && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold'>Shopping Cart</h2>
                            <button
                                onClick={() => setShowCart(false)}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                ✕
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <p className='text-center text-gray-500 py-8'>Your cart is empty</p>
                        ) : (
                            <>
                                <div className='space-y-3 mb-4'>
                                    {cart.map((item) => (
                                        <div key={item._id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                                            <div className='flex-1'>
                                                <h4 className='font-medium'>{item.name}</h4>
                                                <p className='text-sm text-gray-500'>{item.brandName}</p>
                                                <p className='text-sm text-gray-500'>₹{item.price} each</p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                    className='w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm'
                                                >
                                                    -
                                                </button>
                                                <span className='w-8 text-center'>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                    className='w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm'
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item._id)}
                                                    className='text-red-600 hover:text-red-800 ml-2'
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className='border-t pt-4 mb-4'>
                                    <div className='flex justify-between items-center text-lg font-bold'>
                                        <span>Total:</span>
                                        <span>₹{getTotalAmount()}</span>
                                    </div>
                                </div>

                                <div className='flex gap-4'>
                                    <button
                                        onClick={() => {
                                            setShowCart(false);
                                            setShowCheckout(true);
                                        }}
                                        className='flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700'
                                    >
                                        Proceed to Checkout
                                    </button>
                                    <button
                                        onClick={() => setShowCart(false)}
                                        className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold'>Checkout</h2>
                            <button
                                onClick={() => setShowCheckout(false)}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }} className='space-y-4'>
                            <div>
                                <h3 className='text-lg font-semibold mb-3'>Shipping Address</h3>
                                <div className='space-y-3'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>Address Line 1 *</label>
                                        <input
                                            type='text'
                                            required
                                            value={checkoutData.shippingAddress.line1}
                                            onChange={(e) => setCheckoutData({
                                                ...checkoutData,
                                                shippingAddress: {
                                                    ...checkoutData.shippingAddress,
                                                    line1: e.target.value
                                                }
                                            })}
                                            className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>Address Line 2</label>
                                        <input
                                            type='text'
                                            value={checkoutData.shippingAddress.line2}
                                            onChange={(e) => setCheckoutData({
                                                ...checkoutData,
                                                shippingAddress: {
                                                    ...checkoutData.shippingAddress,
                                                    line2: e.target.value
                                                }
                                            })}
                                            className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                    <div className='grid grid-cols-2 gap-3'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>City *</label>
                                            <input
                                                type='text'
                                                required
                                                value={checkoutData.shippingAddress.city}
                                                onChange={(e) => setCheckoutData({
                                                    ...checkoutData,
                                                    shippingAddress: {
                                                        ...checkoutData.shippingAddress,
                                                        city: e.target.value
                                                    }
                                                })}
                                                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>State *</label>
                                            <input
                                                type='text'
                                                required
                                                value={checkoutData.shippingAddress.state}
                                                onChange={(e) => setCheckoutData({
                                                    ...checkoutData,
                                                    shippingAddress: {
                                                        ...checkoutData.shippingAddress,
                                                        state: e.target.value
                                                    }
                                                })}
                                                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            />
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-3'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>Pincode *</label>
                                            <input
                                                type='text'
                                                required
                                                value={checkoutData.shippingAddress.pincode}
                                                onChange={(e) => setCheckoutData({
                                                    ...checkoutData,
                                                    shippingAddress: {
                                                        ...checkoutData.shippingAddress,
                                                        pincode: e.target.value
                                                    }
                                                })}
                                                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>Phone *</label>
                                            <input
                                                type='tel'
                                                required
                                                value={checkoutData.shippingAddress.phone}
                                                onChange={(e) => setCheckoutData({
                                                    ...checkoutData,
                                                    shippingAddress: {
                                                        ...checkoutData.shippingAddress,
                                                        phone: e.target.value
                                                    }
                                                })}
                                                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Order Notes</label>
                                <textarea
                                    value={checkoutData.notes}
                                    onChange={(e) => setCheckoutData({...checkoutData, notes: e.target.value})}
                                    placeholder='Any special instructions...'
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    rows={3}
                                />
                            </div>

                            <div className='border-t pt-4'>
                                <div className='flex justify-between items-center text-lg font-bold mb-4'>
                                    <span>Total Amount:</span>
                                    <span>₹{getTotalAmount()}</span>
                                </div>
                                
                                <div className='flex gap-4'>
                                    <button
                                        type='submit'
                                        className='flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700'
                                    >
                                        Place Order
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setShowCheckout(false)}
                                        className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
                                    >
                                        Back to Cart
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineOrder;
