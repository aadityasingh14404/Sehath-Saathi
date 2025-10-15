import mongoose from "mongoose";

const statusEventSchema = new mongoose.Schema({
    status: { type: String, required: true },
    etaMinutes: { type: Number },
    note: { type: String },
    at: { type: Date, default: Date.now }
}, { _id: false });

const ambulanceTripSchema = new mongoose.Schema({
    bookingId: { type: String, index: true, unique: true },
    userId: { type: String },
    zone: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    initialReport: { type: String, default: '' },
    requestedAt: { type: Date },
    dispatchedAt: { type: Date },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    status: { type: String, default: 'requested' },
    etaMinutes: { type: Number },
    ambulance: {
        id: { type: String },
        driverName: { type: String },
        vehicleNo: { type: String }
    },
    events: [statusEventSchema]
}, { timestamps: true });

const ambulanceTripModel = mongoose.models.ambulance_trip || mongoose.model("ambulance_trip", ambulanceTripSchema);
export default ambulanceTripModel;


