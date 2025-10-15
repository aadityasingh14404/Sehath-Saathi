import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const DoctorPrescription = () => {
    const [medicines, setMedicines] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState('');
    const [prescriptionMedicines, setPrescriptionMedicines] = useState([]);
    const [notes, setNotes] = useState('');

    const [medicineForm, setMedicineForm] = useState({
        medicineId: '',
        quantity: '',
        prescriptionImage: ''
    });

    useEffect(() => {
        fetchMedicines();
        fetchPatients();
        fetchAppointments();
    }, []);

    const fetchMedicines = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/medicine?limit=1000');
            const data = await response.json();
            
            if (response.ok) {
                setMedicines(data.medicines);
            }
        } catch (error) {
            console.error('Failed to fetch medicines:', error);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/user/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('doctorToken')}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setPatients(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/doctor/doctor-appointments', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('doctorToken')}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setAppointments(data.appointments);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        }
    };

    const addMedicineToPrescription = () => {
        if (!medicineForm.medicineId || !medicineForm.quantity) {
            toast.error('Please select medicine and enter quantity');
            return;
        }

        const selectedMedicine = medicines.find(m => m._id === medicineForm.medicineId);
        if (!selectedMedicine) {
            toast.error('Medicine not found');
            return;
        }

        const medicineExists = prescriptionMedicines.find(m => m.medicineId === medicineForm.medicineId);
        if (medicineExists) {
            toast.error('Medicine already added to prescription');
            return;
        }

        const newMedicine = {
            medicineId: medicineForm.medicineId,
            name: selectedMedicine.name,
            brandName: selectedMedicine.brandName,
            quantity: parseInt(medicineForm.quantity),
            price: selectedMedicine.price,
            prescriptionRequired: selectedMedicine.prescriptionRequired,
            prescriptionImage: medicineForm.prescriptionImage
        };

        setPrescriptionMedicines([...prescriptionMedicines, newMedicine]);
        setMedicineForm({ medicineId: '', quantity: '', prescriptionImage: '' });
        toast.success('Medicine added to prescription');
    };

    const removeMedicineFromPrescription = (medicineId) => {
        setPrescriptionMedicines(prescriptionMedicines.filter(m => m.medicineId !== medicineId));
    };

    const handleSubmitPrescription = async () => {
        if (!selectedPatient) {
            toast.error('Please select a patient');
            return;
        }

        if (prescriptionMedicines.length === 0) {
            toast.error('Please add at least one medicine to prescription');
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/medicine/prescriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('doctorToken')}`
                },
                body: JSON.stringify({
                    doctorId: localStorage.getItem('doctorId'),
                    patientId: selectedPatient,
                    medicines: prescriptionMedicines,
                    notes,
                    appointmentId: selectedAppointment || null
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success('Prescription created successfully');
                setPrescriptionMedicines([]);
                setNotes('');
                setSelectedPatient('');
                setSelectedAppointment('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to create prescription');
        }
    };

    const filteredMedicines = medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.brandName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = prescriptionMedicines.reduce((sum, medicine) => 
        sum + (medicine.quantity * medicine.price), 0
    );

    return (
        <div className='p-6'>
            <h1 className='text-2xl font-bold text-gray-800 mb-6'>Create Prescription</h1>

            {loading ? (
                <div className='flex items-center justify-center h-64'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                    <p className='ml-2 text-gray-600'>Loading...</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Left Side - Medicine Selection */}
                    <div className='bg-white p-6 rounded-lg shadow-sm'>
                        <h2 className='text-lg font-semibold text-gray-800 mb-4'>Select Medicines</h2>
                        
                        {/* Patient Selection */}
                        <div className='mb-4'>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Select Patient</label>
                            <select
                                value={selectedPatient}
                                onChange={(e) => setSelectedPatient(e.target.value)}
                                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value=''>Select Patient</option>
                                {patients.map(patient => (
                                    <option key={patient._id} value={patient._id}>
                                        {patient.name} - {patient.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Appointment Selection */}
                        <div className='mb-4'>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Select Appointment (Optional)</label>
                            <select
                                value={selectedAppointment}
                                onChange={(e) => setSelectedAppointment(e.target.value)}
                                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value=''>No Appointment</option>
                                {appointments.map(appointment => (
                                    <option key={appointment._id} value={appointment._id}>
                                        {appointment.userData.name} - {appointment.slotDate} {appointment.slotTime}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Medicine Search */}
                        <div className='mb-4'>
                            <input
                                type='text'
                                placeholder='Search medicines...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>

                        {/* Medicine Selection Form */}
                        <div className='space-y-4 mb-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Select Medicine</label>
                                <select
                                    value={medicineForm.medicineId}
                                    onChange={(e) => setMedicineForm({...medicineForm, medicineId: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                >
                                    <option value=''>Select Medicine</option>
                                    {filteredMedicines.map(medicine => (
                                        <option key={medicine._id} value={medicine._id}>
                                            {medicine.name} ({medicine.brandName}) - ₹{medicine.price}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Quantity</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={medicineForm.quantity}
                                    onChange={(e) => setMedicineForm({...medicineForm, quantity: e.target.value})}
                                    className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>

                            <button
                                onClick={addMedicineToPrescription}
                                className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700'
                            >
                                Add to Prescription
                            </button>
                        </div>

                        {/* Medicine List */}
                        <div className='max-h-64 overflow-y-auto'>
                            <h3 className='text-sm font-medium text-gray-700 mb-2'>Available Medicines</h3>
                            <div className='space-y-2'>
                                {filteredMedicines.slice(0, 10).map(medicine => (
                                    <div key={medicine._id} className='p-2 border border-gray-200 rounded-lg text-sm'>
                                        <div className='font-medium'>{medicine.name}</div>
                                        <div className='text-gray-500'>{medicine.brandName} - {medicine.dosage}</div>
                                        <div className='text-gray-500'>₹{medicine.price} | {medicine.category}</div>
                                        {medicine.prescriptionRequired && (
                                            <span className='text-xs bg-red-100 text-red-800 px-1 rounded'>Prescription Required</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Prescription */}
                    <div className='bg-white p-6 rounded-lg shadow-sm'>
                        <h2 className='text-lg font-semibold text-gray-800 mb-4'>Prescription</h2>
                        
                        {/* Prescription Medicines */}
                        <div className='mb-4'>
                            {prescriptionMedicines.length === 0 ? (
                                <p className='text-gray-500 text-center py-4'>No medicines added to prescription</p>
                            ) : (
                                <div className='space-y-2'>
                                    {prescriptionMedicines.map((medicine, index) => (
                                        <div key={medicine.medicineId} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                                            <div>
                                                <div className='font-medium'>{medicine.name}</div>
                                                <div className='text-sm text-gray-500'>{medicine.brandName}</div>
                                                <div className='text-sm text-gray-500'>Qty: {medicine.quantity} | ₹{medicine.price} each</div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className='text-sm font-medium'>₹{medicine.quantity * medicine.price}</span>
                                                <button
                                                    onClick={() => removeMedicineFromPrescription(medicine.medicineId)}
                                                    className='text-red-600 hover:text-red-800'
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Total Amount */}
                        {prescriptionMedicines.length > 0 && (
                            <div className='mb-4 p-3 bg-blue-50 rounded-lg'>
                                <div className='flex justify-between items-center'>
                                    <span className='font-semibold'>Total Amount:</span>
                                    <span className='font-bold text-lg'>₹{totalAmount}</span>
                                </div>
                            </div>
                        )}

                        {/* Prescription Notes */}
                        <div className='mb-4'>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Prescription Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder='Add prescription notes, dosage instructions, etc.'
                                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                rows={4}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmitPrescription}
                            disabled={prescriptionMedicines.length === 0 || !selectedPatient}
                            className='w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                        >
                            Create Prescription
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPrescription;
