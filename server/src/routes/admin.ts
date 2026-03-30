import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../models/database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tranzit_dev_secret_key_change_in_production';

const requireAdmin = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

router.get('/dashboard', requireAdmin, (req, res) => {
  try {
    const stats = db.getDashboardStats();
    const recentShipments = db.getAllShipments().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    const recentUsers = db.getAllUsers().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    res.json({ stats, recentShipments, onlineDrivers: db.getOnlineDrivers(), recentUsers });
  } catch { res.status(500).json({ error: 'Failed to get dashboard data' }); }
});

router.get('/users', requireAdmin, (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    let users = db.getAllUsers();
    if (role) users = users.filter(u => u.role === role);
    const total = users.length;
    const start = (parseInt(page as string) - 1) * parseInt(limit as string);
    res.json({ users: users.slice(start, start + parseInt(limit as string)), pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
  } catch { res.status(500).json({ error: 'Failed to get users' }); }
});

router.get('/users/:id', requireAdmin, (req, res) => {
  try {
    const user = db.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const shipments = user.role === 'shipper' ? db.getShipmentsByShipper(req.params.id) : user.role === 'driver' ? db.getShipmentsByDriver(req.params.id) : [];
    res.json({ user, shipments });
  } catch { res.status(500).json({ error: 'Failed to get user' }); }
});

router.post('/users/:id/verify', requireAdmin, (req, res) => {
  try {
    const user = db.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.updateUser(req.params.id, { isVerified: req.body.verified });
    res.json({ message: `User ${req.body.verified ? 'verified' : 'unverified'} successfully` });
  } catch { res.status(500).json({ error: 'Failed to verify user' }); }
});

router.get('/shipments', requireAdmin, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let shipments = db.getAllShipments().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (status) shipments = shipments.filter(s => s.status === status);
    const total = shipments.length;
    const start = (parseInt(page as string) - 1) * parseInt(limit as string);
    res.json({ shipments: shipments.slice(start, start + parseInt(limit as string)), pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
  } catch { res.status(500).json({ error: 'Failed to get shipments' }); }
});

router.get('/analytics/revenue', requireAdmin, (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const shipments = db.getAllShipments().filter(s => s.payment.status === 'completed');
    const byPeriod: Record<string, number> = {};
    shipments.forEach(s => {
      const d = new Date(s.createdAt);
      const key = period === 'day' ? d.toISOString().split('T')[0] : period === 'week' ? (() => { const w = new Date(d); w.setDate(d.getDate() - d.getDay()); return w.toISOString().split('T')[0]; })() : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byPeriod[key] = (byPeriod[key] || 0) + s.price.total;
    });
    const chartData = Object.entries(byPeriod).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));
    const totalRevenue = shipments.reduce((sum, s) => sum + s.price.total, 0);
    res.json({ chartData, totalRevenue, averageOrderValue: shipments.length > 0 ? totalRevenue / shipments.length : 0 });
  } catch { res.status(500).json({ error: 'Failed to get revenue analytics' }); }
});

router.get('/analytics/drivers', requireAdmin, (req, res) => {
  try {
    const driverStats = db.getDrivers().map(driver => {
      const shipments = db.getShipmentsByDriver(driver.id);
      const completed = shipments.filter(s => s.status === 'delivered');
      return { ...driver, totalShipments: shipments.length, completedShipments: completed.length, completionRate: shipments.length > 0 ? (completed.length / shipments.length) * 100 : 0, totalEarnings: completed.reduce((sum, s) => sum + s.price.total * 0.85, 0) };
    });
    res.json({ drivers: driverStats.sort((a, b) => b.completedShipments - a.completedShipments) });
  } catch { res.status(500).json({ error: 'Failed to get driver analytics' }); }
});

router.get('/tracking/active', requireAdmin, (req, res) => {
  try {
    const trackingData = db.getActiveShipments().map(shipment => {
      const driver = shipment.driverId ? db.getUser(shipment.driverId) : null;
      const shipper = db.getUser(shipment.shipperId);
      return { shipmentId: shipment.id, status: shipment.status, pickup: shipment.pickup, dropoff: shipment.dropoff, driver: driver ? { id: driver.id, name: driver.name, phone: driver.phone, currentLocation: (driver as any).currentLocation, vehicle: (driver as any).vehicle } : null, shipper: shipper ? { id: shipper.id, name: shipper.name, phone: shipper.phone } : null, lastTracking: shipment.tracking.at(-1) || null };
    });
    res.json({ shipments: trackingData });
  } catch { res.status(500).json({ error: 'Failed to get active tracking data' }); }
});

router.post('/notifications', requireAdmin, (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;
    const notification = { id: `notif_${Date.now()}`, userId, title, message, type, isRead: false, createdAt: new Date().toISOString() };
    db.createNotification(notification as any);
    res.json({ message: 'Notification sent successfully', notification });
  } catch { res.status(500).json({ error: 'Failed to send notification' }); }
});

export default router;
