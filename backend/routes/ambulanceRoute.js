import express from 'express';
import { triggerEmergency, requestBooking, acceptBooking, updateStatus, cancelBooking, getBooking } from '../controllers/ambulanceController.js';

const ambulanceRouter = express.Router();

ambulanceRouter.post('/trigger', triggerEmergency);
ambulanceRouter.post('/request', requestBooking);
ambulanceRouter.post('/accept', acceptBooking);
ambulanceRouter.post('/status', updateStatus);
ambulanceRouter.post('/cancel', cancelBooking);
ambulanceRouter.get('/:id', getBooking);

export default ambulanceRouter;


