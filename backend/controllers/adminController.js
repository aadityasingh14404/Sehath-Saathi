import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// NEW FUNCTION ADDED
const completeAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
        res.json({ success: true, message: 'Appointment Marked as Completed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API for adding Doctor
const addDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            speciality,
            degree,
            experience,
            fees,
            about,
            address
        } = req.body;

        // basic validation
        if (!name || !email || !password || !speciality || !degree || !experience || !fees || !about || !address) {
            return res.json({ success: false, message: 'Missing details' });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' });
        }

        // unique email check
        const existing = await doctorModel.findOne({ email });
        if (existing) {
            return res.json({ success: false, message: 'Doctor already exists with this email' });
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // handle image upload (optional but model requires image)
        let imageURL = '';
        const imageFile = req.file;
        if (imageFile) {
            const uploadRes = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            imageURL = uploadRes.secure_url;
        } else {
            return res.json({ success: false, message: 'Doctor image is required' });
        }

        // parse address if sent as string
        let parsedAddress = address;
        if (typeof address === 'string') {
            try { parsedAddress = JSON.parse(address); } catch (_) {}
        }

        const newDoctor = new doctorModel({
            name,
            email,
            password: hashedPassword,
            image: imageURL,
            speciality,
            degree,
            experience,
            about,
            fees: Number(fees),
            address: parsedAddress,
            date: Date.now()
        });

        await newDoctor.save();
        res.json({ success: true, message: 'Doctor added successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password').sort({ date: -1 });
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {
        const totalUsers = await userModel.countDocuments();
        const totalDoctors = await doctorModel.countDocuments();
        const totalAppointments = await appointmentModel.countDocuments();

        const latestAppointments = await appointmentModel.find({}).sort({ date: -1 }).limit(10);

        const earningsAgg = await appointmentModel.aggregate([
            { $match: { payment: true } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const dashData = {
            totalUsers,
            totalDoctors,
            totalAppointments,
            totalEarnings: earningsAgg[0]?.total || 0,
            latestAppointments
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    completeAppointment, // ADDED TO EXPORT
    addDoctor,
    allDoctors,
    adminDashboard
}