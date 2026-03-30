import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../models/database';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'tranzit_dev_secret_key_change_in_production';

const requireAdmin = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get dashboard stats
router.get('/dashboard', requireAdmin, (req, res) => {
  try {
    const stats = db.getDashboardStats();
    const allShipments = db.getAllShipments()
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    const onlineDrivers = db.getOnlineDrivers();
    const recentUsers = db.getAllUsers()
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    res.json({ stats, recentShipments: allShipments, onlineDrivers, recentUsers });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get all users
router.get('/users', requireAdmin, (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    let users = db.getAllUsers() as any[];
    if (role) users = users.filter((u: any) => u.role === role);
    const total = users.length;
    const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
    const paginatedUsers = users.slice(startIndex, startIndex + parseInt(limit as string));
    res.json({
      users: paginatedUsers,
      pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/users/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const user = db.getUser(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const shipments = user.role === 'shipper'
      ? db.getShipmentsByShipper(id)
      : user.role === 'driver'
        ? db.getShipmentsByDriver(id)
        : [];
    res.json({ user, shipments });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Verify user
router.post('/users/:id/verify', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    const user = db.getUser(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.updateUser(id, { isVerified: verified });
    res.json({ message: `User ${verified ? 'verified' : 'unverified'} successfully` });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// Get all shipments
router.get('/shipments', requireAdmin, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let shipments = db.getAllShipments() as any[];
    shipments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (status) shipments = shipments.filter((s: any) => s.status === status);
    const total = shipments.length;
    const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
    const paginatedShipments = shipments.slice(startIndex, startIndex + parseInt(limit as string));
    res.json({
      shipments: paginatedShipments,
      pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) }
    });
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Failed to get shipments' });
  }
});

// Revenue analytics
router.get('/analytics/revenue', requireAdmin, (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const shipments = db.getAllShipments().filter((s: any) => s.payment.status === 'completed');
    const revenueByPeriod: Record<string, number> = {};
    shipments.forEach((s: any) => {
      const date = new Date(s.createdAt);
      let key: string;
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      revenueByPeriod[key] = (revenueByPeriod[key] || 0) + s.price.total;
    });
    const chartData = Object.entries(revenueByPeriod)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const totalRevenue = shipments.reduce((sum: number, s: any) => sum + s.price.total, 0);
    res.json({ chartData, totalRevenue, averageOrderValue: shipments.length > 0 ? totalRevenue / shipments.length : 0 });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
});

// Driver performance analytics
router.get('/analytics/drivers', requireAdmin, (req, res) => {
  try {
    const drivers = db.getDrivers();
    const driverStats = drivers.map(driver => {
      const shipments = db.getShipmentsByDriver(driver.id);
      const completed = shipments.filter(s => s.status === 'delivered');
      return {
        ...driver,
        totalShipments: shipments.length,
        completedShipments: completed.length,
        completionRate: shipments.length > 0 ? (completed.length / shipments.length) * 100 : 0,
        totalEarnings: completed.reduce((sum, s) => sum + s.price.total * 0.85, 0)
      };
    });
    res.json({ drivers: driverStats.sort((a, b) => b.completedShipments - a.completedShipments) });
  } catch (error) {
    console.error('Driver analytics error:', error);
    res.status(500).json({ error: 'Failed to get driver analytics' });
  }
});

// Active shipments for live tracking
router.get('/tracking/active', requireAdmin, (req, res) => {
  try {
    const activeShipments = db.getActiveShipments();
    const trackingData = activeShipments.map(shipment => {
      const driver = shipment.driverId ? db.getUser(shipment.driverId) : null;
      const shipper = db.getUser(shipment.shipperId);
      return {
        shipmentId: shipment.id,
        status: shipment.status,
        pickup: shipment.pickup,
        dropoff: shipment.dropoff,
        driver: driver ? { id: driver.id, name: driver.name, phone: driver.phone, currentLocation: (driver as any).currentLocation, vehicle: (driver as any).vehicle } : null,
        shipper: shipper ? { id: shipper.id, name: shipper.name, phone: shipper.phone } : null,
        lastTracking: shipment.tracking[shipment.tracking.length - 1] || null
      };
    });
    res.json({ shipments: trackingData });
  } catch (error) {
    console.error('Active tracking error:', error);
    res.status(500).json({ error: 'Failed to get active tracking data' });
  }
});

// Send notification to user
router.post('/notifications', requireAdmin, (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;
    const notification = {
      id: `notif_${Date.now()}`,
      userId, title, message, type,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    db.createNotification(notification);
    res.json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
