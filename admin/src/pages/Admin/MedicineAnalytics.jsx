import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const MedicineAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [orderAnalytics, setOrderAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('30');

    useEffect(() => {
        fetchAnalytics();
        fetchOrderAnalytics();
    }, [selectedPeriod]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/medicine/analytics?period=${selectedPeriod}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setAnalytics(data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to fetch analytics');
        }
    };

    const fetchOrderAnalytics = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/medicine/orders/analytics?period=${selectedPeriod}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setOrderAnalytics(data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to fetch order analytics');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-purple-100 text-purple-800';
            case 'shipped': return 'bg-indigo-100 text-indigo-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className='p-6'>
                <div className='flex items-center justify-center h-64'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                    <p className='ml-2 text-gray-600'>Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='p-6'>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Medicine Analytics</h1>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className='p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                    <option value='7'>Last 7 days</option>
                    <option value='30'>Last 30 days</option>
                    <option value='90'>Last 90 days</option>
                    <option value='365'>Last year</option>
                </select>
            </div>

            {/* Overview Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                <div className='bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500'>
                    <div className='flex items-center'>
                        <div className='p-2 bg-blue-100 rounded-lg'>
                            <img src={assets.list_icon} alt='' className='w-6 h-6 text-blue-600' />
                        </div>
                        <div className='ml-4'>
                            <p className='text-sm font-medium text-gray-600'>Total Medicines</p>
                            <p className='text-2xl font-bold text-gray-900'>{analytics?.totalMedicines || 0}</p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500'>
                    <div className='flex items-center'>
                        <div className='p-2 bg-red-100 rounded-lg'>
                            <img src={assets.cancel_icon} alt='' className='w-6 h-6 text-red-600' />
                        </div>
                        <div className='ml-4'>
                            <p className='text-sm font-medium text-gray-600'>Low Stock</p>
                            <p className='text-2xl font-bold text-gray-900'>{analytics?.lowStockCount || 0}</p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500'>
                    <div className='flex items-center'>
                        <div className='p-2 bg-yellow-100 rounded-lg'>
                            <img src={assets.appointment_icon} alt='' className='w-6 h-6 text-yellow-600' />
                        </div>
                        <div className='ml-4'>
                            <p className='text-sm font-medium text-gray-600'>Expiring Soon</p>
                            <p className='text-2xl font-bold text-gray-900'>{analytics?.expiringCount || 0}</p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500'>
                    <div className='flex items-center'>
                        <div className='p-2 bg-green-100 rounded-lg'>
                            <img src={assets.earning_icon} alt='' className='w-6 h-6 text-green-600' />
                        </div>
                        <div className='ml-4'>
                            <p className='text-sm font-medium text-gray-600'>Total Revenue</p>
                            <p className='text-2xl font-bold text-gray-900'>
                                {formatCurrency(orderAnalytics?.revenueData?.totalRevenue || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                {/* Top Selling Medicines */}
                <div className='bg-white p-6 rounded-lg shadow-sm'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>Top Selling Medicines</h3>
                    <div className='space-y-3'>
                        {analytics?.topSellingMedicines?.slice(0, 5).map((medicine, index) => (
                            <div key={medicine._id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                                <div className='flex items-center'>
                                    <span className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3'>
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className='font-medium text-gray-900'>{medicine.medicine.name}</p>
                                        <p className='text-sm text-gray-500'>{medicine.medicine.brandName}</p>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <p className='font-semibold text-gray-900'>{medicine.totalQuantity} sold</p>
                                    <p className='text-sm text-gray-500'>{formatCurrency(medicine.totalRevenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Distribution */}
                <div className='bg-white p-6 rounded-lg shadow-sm'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>Category Distribution</h3>
                    <div className='space-y-3'>
                        {analytics?.categoryDistribution?.map((category) => (
                            <div key={category._id} className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-gray-700'>{category._id}</span>
                                <div className='flex items-center'>
                                    <div className='w-24 bg-gray-200 rounded-full h-2 mr-2'>
                                        <div 
                                            className='bg-blue-600 h-2 rounded-full' 
                                            style={{ width: `${(category.count / analytics.totalMedicines) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className='text-sm text-gray-600'>{category.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                {/* Order Status Distribution */}
                <div className='bg-white p-6 rounded-lg shadow-sm'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>Order Status Distribution</h3>
                    <div className='space-y-3'>
                        {orderAnalytics?.ordersByStatus?.map((status) => (
                            <div key={status._id} className='flex items-center justify-between'>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status._id)}`}>
                                    {status._id.charAt(0).toUpperCase() + status._id.slice(1)}
                                </span>
                                <span className='text-sm font-medium text-gray-900'>{status.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue Summary */}
                <div className='bg-white p-6 rounded-lg shadow-sm'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>Revenue Summary</h3>
                    <div className='space-y-4'>
                        <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-600'>Total Orders</span>
                            <span className='font-semibold text-gray-900'>{orderAnalytics?.totalOrders || 0}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-600'>Average Order Value</span>
                            <span className='font-semibold text-gray-900'>
                                {formatCurrency(orderAnalytics?.revenueData?.averageOrderValue || 0)}
                            </span>
                        </div>
                        <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-600'>Total Revenue</span>
                            <span className='font-semibold text-gray-900'>
                                {formatCurrency(orderAnalytics?.revenueData?.totalRevenue || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Sales Trend */}
            {analytics?.monthlySales && analytics.monthlySales.length > 0 && (
                <div className='bg-white p-6 rounded-lg shadow-sm'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4'>Sales Trend</h3>
                    <div className='space-y-3'>
                        {analytics.monthlySales.map((month) => (
                            <div key={`${month._id.year}-${month._id.month}`} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                                <span className='text-sm font-medium text-gray-700'>
                                    {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        year: 'numeric' 
                                    })}
                                </span>
                                <div className='text-right'>
                                    <p className='font-semibold text-gray-900'>{month.totalOrders} orders</p>
                                    <p className='text-sm text-gray-500'>{formatCurrency(month.totalRevenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineAnalytics;
