import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import shipmentRoutes from './routes/shipments.js';
import driverRoutes from './routes/drivers.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'tranzit-server' }));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (data: { userId: string; role: string }) => {
    socket.join(`user:${data.userId}`);
    if (data.role === 'driver') socket.join('drivers');
    if (data.role === 'admin') socket.join('admin');
  });

  socket.on('driver:status', (data: { driverId: string; isOnline: boolean; location?: any }) => {
    socket.to('admin').emit('driver:status_update', { ...data, timestamp: new Date().toISOString() });
  });

  socket.on('location:update', (data: { shipmentId: string; location: any; driverId: string }) => {
    socket.to(`shipment:${data.shipmentId}`).emit('location:update', { ...data, timestamp: new Date().toISOString() });
  });

  socket.on('job:request', (data: { driverId: string; shipment: any }) => {
    socket.to(`user:${data.driverId}`).emit('job:request', { ...data, timestamp: new Date().toISOString() });
  });

  socket.on('job:response', (data: { shipmentId: string; driverId: string; accepted: boolean }) => {
    io.emit('job:response', { ...data, timestamp: new Date().toISOString() });
  });

  socket.on('shipment:status', (data: { shipmentId: string; status: string; note?: string }) => {
    io.to(`shipment:${data.shipmentId}`).emit('shipment:status_update', { ...data, timestamp: new Date().toISOString() });
  });

  socket.on('payment:confirmed', (data: { shipmentId: string; transactionId: string }) => {
    io.to(`shipment:${data.shipmentId}`).emit('payment:confirmed', { ...data, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.set('io', io);

const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
  console.log(`🚀 Tranzit Server running on port ${PORT}`);
  console.log(`📱 Socket.IO ready for real-time tracking`);
});

export { io };
