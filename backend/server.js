console.log("--- SERVER V2 WITH DOCTORS NAMESPACE IS RUNNING ---");

// ... rest of your code
import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
// Always load .env from the backend folder regardless of where the server is started
dotenv.config({ path: new URL('./.env', import.meta.url).pathname });
import http from 'http';
import { Server } from 'socket.io';

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import medicineRouter from "./routes/medicineRoute.js";
import ambulanceRouter from "./routes/ambulanceRoute.js";

// app config
const app = express();
let port = Number(process.env.PORT) || 4000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/medicine", medicineRouter);
app.use("/api/ambulance", ambulanceRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

// --- Socket.IO Integration ---
// Guard against multiple initializations during dev restarts
const existingServer = globalThis.__HTTP_SERVER__;
const httpServer = existingServer || http.createServer(app);
httpServer.setMaxListeners(0);

const existingIo = globalThis.__IO__;
const io = existingIo || new Server(httpServer, {
  cors: {
    origin: "http://localhost:5174",
    methods: ["GET", "POST"]
  }
});

// Namespace for Appointments
const appointmentsNamespace = io.of("/prescripto.appointments");
appointmentsNamespace.on("connection", (socket) => {
  console.log(`✅ User connected to appointments: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected from appointments: ${socket.id}`);
  });
});

// THIS PART IS MISSING FROM YOUR CODE
const doctorsNamespace = io.of("/prescripto.doctors");
doctorsNamespace.on("connection", (socket) => {
  console.log(`✅ User connected to doctors: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected from doctors: ${socket.id}`);
  });
});

// Medicine namespace for real-time stock updates and analytics
const medicineNamespace = io.of("/prescripto.medicines");
medicineNamespace.on("connection", (socket) => {
  console.log(`✅ User connected to medicines: ${socket.id}`);
  
  // Join specific rooms for targeted updates
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log(`Admin joined medicine room: ${socket.id}`);
  });
  
  socket.on('join-doctor-room', (doctorId) => {
    socket.join(`doctor-${doctorId}`);
    console.log(`Doctor ${doctorId} joined medicine room: ${socket.id}`);
  });
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined medicine room: ${socket.id}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected from medicines: ${socket.id}`);
  });
});

// Ambulance namespace for emergency requests (non-breaking addition)
const ambulanceNamespace = io.of("/prescripto.ambulance");
ambulanceNamespace.on("connection", (socket) => {
  console.log(`✅ User connected to ambulance: ${socket.id}`);

  // Allow clients to join a zone room to receive targeted alerts
  socket.on('join-zone', (zone) => {
    const safeZone = (zone || 'general').toString();
    socket.join(`zone-${safeZone}`);
    socket.emit('joined-zone', { zone: safeZone });
  });

  // Allow clients to subscribe to a booking room by id for targeted updates
  socket.on('join-booking', (bookingId) => {
    const safeId = (bookingId || '').toString();
    if (!safeId) return;
    socket.join(`booking-${safeId}`);
    socket.emit('joined-booking', { bookingId: safeId });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected from ambulance: ${socket.id}`);
  });
});

// Export io for use in controllers
export { io };

// Use the httpServer to listen (only if not already listening)
if (!existingServer) {
  globalThis.__HTTP_SERVER__ = httpServer;
  globalThis.__IO__ = io;

  httpServer.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use. Switching to ${nextPort}...`);
      try { httpServer.close(); } catch {}
      port = nextPort;
      httpServer.listen(port, () => console.log(`🚀 Server started on PORT:${port}`));
    } else {
      console.error('HTTP server error:', err);
    }
  });

  const startServer = () => httpServer.listen(port, () => console.log(`🚀 Server started on PORT:${port}`));
  startServer();

  // Graceful shutdown to avoid lingering listeners on nodemon restarts
  const shutdown = () => {
    try { io.close(); } catch {}
    try { httpServer.close(() => process.exit(0)); } catch { process.exit(0); }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}