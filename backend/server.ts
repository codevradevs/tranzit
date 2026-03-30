import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth';
import shipmentRoutes from './routes/shipments';
import driverRoutes from './routes/drivers';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room based on user role and ID
  socket.on('join', (data: { userId: string; role: string }) => {
    socket.join(`user:${data.userId}`);
    if (data.role === 'driver') {
      socket.join('drivers');
    }
    console.log(`User ${data.userId} joined as ${data.role}`);
  });

  // Driver goes online/offline
  socket.on('driver:status', (data: { driverId: string; isOnline: boolean; location?: any }) => {
    socket.to('admin').emit('driver:status_update', {
      driverId: data.driverId,
      isOnline: data.isOnline,
      location: data.location,
      timestamp: new Date().toISOString()
    });
  });

  // Location tracking during delivery
  socket.on('location:update', (data: { shipmentId: string; location: any; driverId: string }) => {
    socket.to(`shipment:${data.shipmentId}`).emit('location:update', {
      shipmentId: data.shipmentId,
      location: data.location,
      timestamp: new Date().toISOString()
    });
    
    // Also notify shipper
    socket.to(`user:${data.driverId}`).emit('location:update', data);
  });

  // Job request to driver
  socket.on('job:request', (data: { driverId: string; shipment: any }) => {
    socket.to(`user:${data.driverId}`).emit('job:request', {
      shipment: data.shipment,
      timestamp: new Date().toISOString()
    });
  });

  // Driver accepts/rejects job
  socket.on('job:response', (data: { shipmentId: string; driverId: string; accepted: boolean }) => {
    io.emit('job:response', {
      shipmentId: data.shipmentId,
      driverId: data.driverId,
      accepted: data.accepted,
      timestamp: new Date().toISOString()
    });
  });

  // Shipment status updates
  socket.on('shipment:status', (data: { shipmentId: string; status: string; note?: string }) => {
    io.to(`shipment:${data.shipmentId}`).emit('shipment:status_update', {
      shipmentId: data.shipmentId,
      status: data.status,
      note: data.note,
      timestamp: new Date().toISOString()
    });
  });

  // Payment confirmation
  socket.on('payment:confirmed', (data: { shipmentId: string; transactionId: string }) => {
    io.to(`shipment:${data.shipmentId}`).emit('payment:confirmed', {
      shipmentId: data.shipmentId,
      transactionId: data.transactionId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 3005;


httpServer.listen(PORT, () => {
  console.log(`🚀 Tranzit Server running on port ${PORT}`);
  console.log(`📱 Socket.IO ready for real-time tracking`);
});

export { io };
