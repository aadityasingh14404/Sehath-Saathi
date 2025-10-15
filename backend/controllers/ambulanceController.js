import { io } from "../server.js";
import ambulanceTripModel from "../models/ambulanceTripModel.js";

// In-memory booking store for demo purposes
// Key: bookingId -> value: booking record
const bookingStore = new Map();

const generateId = () => Math.random().toString(36).slice(2, 10);

// POST /api/ambulance/trigger (simple broadcast - legacy demo)
const triggerEmergency = async (req, res) => {

    try {
        const { userId = 'unknown', lat, lng, zone = 'general', notes = '' } = req.body || {};

        const payload = {
            userId,
            location: { lat, lng },
            zone,
            notes,
            requestedAt: new Date().toISOString(),
            status: 'requested'
        };

        const ambulanceNs = io.of('/prescripto.ambulance');
        ambulanceNs.to(`zone-${zone}`).emit('ambulance:request', payload);
        ambulanceNs.emit('ambulance:request', payload);

        res.json({ success: true, message: 'Emergency dispatched', payload });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// POST /api/ambulance/request - creates a booking and notifies drivers
const requestBooking = async (req, res) => {
    try {
        const { userId = 'unknown', lat, lng, zone = 'general', notes = '' } = req.body || {};
        const bookingId = generateId();
        const record = {
            bookingId,
            userId,
            zone,
            location: { lat, lng },
            notes,
            status: 'requested',
            createdAt: Date.now(),
            ambulance: null // { id, driverName, vehicleNo }
        };
        bookingStore.set(bookingId, record);

        // Persist initial trip record with dispatch time and initial report
        await ambulanceTripModel.create({
            bookingId,
            userId,
            zone,
            location: { lat, lng },
            initialReport: notes,
            requestedAt: new Date(record.createdAt),
            dispatchedAt: new Date(),
            status: 'requested',
            events: [{ status: 'requested', note: 'Request created', at: new Date() }]
        });

        const ambulanceNs = io.of('/prescripto.ambulance');
        // Notify zone listeners and drivers
        ambulanceNs.to(`zone-${zone}`).emit('ambulance:request', record);
        ambulanceNs.to('drivers').emit('ambulance:request', record);

        res.json({ success: true, booking: record });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// POST /api/ambulance/accept - driver accepts a booking
const acceptBooking = async (req, res) => {
    try {
        const { bookingId, ambulanceId = 'amb-001', driverName = 'On-call Driver', vehicleNo = 'UP14 XX 1234' } = req.body || {};
        const record = bookingStore.get(bookingId);
        if (!record) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (record.status !== 'requested') return res.json({ success: false, message: 'Already accepted' });

        record.status = 'assigned';
        record.ambulance = { id: ambulanceId, driverName, vehicleNo };
        bookingStore.set(bookingId, record);

        // Persist acceptance
        await ambulanceTripModel.updateOne(
            { bookingId },
            {
                $set: {
                    status: 'assigned',
                    acceptedAt: new Date(),
                    ambulance: { id: ambulanceId, driverName, vehicleNo }
                },
                $push: { events: { status: 'assigned', note: 'Driver accepted', at: new Date() } }
            }
        );

        const ambulanceNs = io.of('/prescripto.ambulance');
        ambulanceNs.to(`booking-${bookingId}`).emit('ambulance:assigned', record);
        res.json({ success: true, booking: record });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// POST /api/ambulance/status - update live status (driver en-route, arrived, completed)
const updateStatus = async (req, res) => {
    try {
        const { bookingId, status, etaMinutes } = req.body || {};
        const record = bookingStore.get(bookingId);
        if (!record) return res.status(404).json({ success: false, message: 'Booking not found' });
        record.status = status || record.status;
        if (etaMinutes !== undefined) record.etaMinutes = etaMinutes;
        bookingStore.set(bookingId, record);

        // Persist status transition
        const setFields = { status: record.status };
        if (etaMinutes !== undefined) setFields.etaMinutes = etaMinutes;
        if (status === 'completed') setFields.completedAt = new Date();
        await ambulanceTripModel.updateOne(
            { bookingId },
            {
                $set: setFields,
                $push: { events: { status: record.status, etaMinutes, at: new Date() } }
            }
        );

        const ambulanceNs = io.of('/prescripto.ambulance');
        ambulanceNs.to(`booking-${bookingId}`).emit('ambulance:status', { bookingId, status: record.status, etaMinutes: record.etaMinutes });
        res.json({ success: true, booking: record });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// POST /api/ambulance/cancel - user cancels
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.body || {};
        const record = bookingStore.get(bookingId);
        if (!record) return res.status(404).json({ success: false, message: 'Booking not found' });
        record.status = 'cancelled';
        bookingStore.set(bookingId, record);
        const ambulanceNs = io.of('/prescripto.ambulance');
        ambulanceNs.to(`booking-${bookingId}`).emit('ambulance:cancelled', { bookingId });
        // Persist cancellation
        await ambulanceTripModel.updateOne(
            { bookingId },
            { $set: { status: 'cancelled', cancelledAt: new Date() }, $push: { events: { status: 'cancelled', at: new Date() } } }
        );
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// GET /api/ambulance/:id - get booking
const getBooking = async (req, res) => {
    try {
        const { id } = req.params;
        // Return live booking (if present) and the persisted trip record
        const live = bookingStore.get(id) || null;
        const trip = await ambulanceTripModel.findOne({ bookingId: id });
        if (!live && !trip) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, booking: live, trip });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export { triggerEmergency, requestBooking, acceptBooking, updateStatus, cancelBooking, getBooking };


