import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { Shipment, ShipmentStatus, Price, TimelineEvent } from '../types.js';

const router = Router();

function calculatePrice(distance: number, weight: number, isUrgent = false): Price {
  const baseFare = 150;
  const distanceCharge = Math.round(distance * 50);
  const weightCharge = Math.round(weight * 10);
  const urgencyCharge = isUrgent ? 200 : 0;
  return { baseFare, distanceCharge, weightCharge, urgencyCharge, total: baseFare + distanceCharge + weightCharge + urgencyCharge, currency: 'KES' };
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.post('/estimate', (req, res) => {
  try {
    const { pickup, dropoff, cargo, isUrgent } = req.body;
    const distance = calcDistance(pickup.coordinates.lat, pickup.coordinates.lng, dropoff.coordinates.lat, dropoff.coordinates.lng);
    const price = calculatePrice(distance, cargo.weight, isUrgent);
    res.json({ distance: Math.round(distance * 10) / 10, price, estimatedTime: Math.round(distance * 3) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate estimate' });
  }
});

router.post('/', (req, res) => {
  try {
    const { shipperId, pickup, dropoff, cargo, paymentMethod, isUrgent } = req.body;
    const distance = calcDistance(pickup.coordinates.lat, pickup.coordinates.lng, dropoff.coordinates.lat, dropoff.coordinates.lng);
    const price = calculatePrice(distance, cargo.weight, isUrgent);
    const shipmentId = `shp_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();
    const shipment: Shipment = {
      id: shipmentId, shipperId, pickup, dropoff, cargo, status: 'pending', price,
      timeline: [{ status: 'pending', timestamp: now, note: 'Shipment created' }],
      tracking: [], payment: { method: paymentMethod || 'mpesa', status: 'pending' },
      createdAt: now, estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    };
    db.createShipment(shipment);
    const tripOtp = db.createTripOtp(shipmentId);
    const shipper = db.getUser(shipperId);
    if (shipper?.role === 'shipper') db.updateUser(shipperId, { totalShipments: (shipper as any).totalShipments + 1 });
    res.status(201).json({ message: 'Shipment created successfully', shipment, tripOtp: { pickupOtp: tripOtp.pickupOtp, dropoffOtp: tripOtp.dropoffOtp } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

router.get('/shipper/:shipperId', (req, res) => {
  try {
    res.json({ shipments: db.getShipmentsByShipper(req.params.shipperId) });
  } catch { res.status(500).json({ error: 'Failed to get shipments' }); }
});

router.get('/driver/:driverId', (req, res) => {
  try {
    res.json({ shipments: db.getShipmentsByDriver(req.params.driverId) });
  } catch { res.status(500).json({ error: 'Failed to get shipments' }); }
});

router.get('/:id', (req, res) => {
  try {
    const shipment = db.getShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ shipment });
  } catch { res.status(500).json({ error: 'Failed to get shipment' }); }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status, note, driverId } = req.body;
    const shipment = db.getShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    const updates: Partial<Shipment> = {
      status: status as ShipmentStatus,
      timeline: [...shipment.timeline, { status: status as ShipmentStatus, timestamp: new Date().toISOString(), note } as TimelineEvent]
    };
    if (driverId && status === 'driver_assigned') updates.driverId = driverId;
    res.json({ message: 'Status updated', shipment: db.updateShipment(req.params.id, updates) });
  } catch { res.status(500).json({ error: 'Failed to update status' }); }
});

router.post('/:id/tracking', (req, res) => {
  try {
    const shipment = db.getShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    const updated = db.updateShipment(req.params.id, { tracking: [...shipment.tracking, { timestamp: new Date().toISOString(), ...req.body }] });
    res.json({ message: 'Tracking updated', shipment: updated });
  } catch { res.status(500).json({ error: 'Failed to update tracking' }); }
});

router.post('/:id/verify-pickup', (req, res) => {
  try {
    if (!db.verifyPickupOtp(req.params.id, req.body.otp)) return res.status(400).json({ error: 'Invalid OTP' });
    res.json({ message: 'Pickup verified successfully' });
  } catch { res.status(500).json({ error: 'Failed to verify OTP' }); }
});

router.post('/:id/verify-dropoff', (req, res) => {
  try {
    if (!db.verifyDropoffOtp(req.params.id, req.body.otp)) return res.status(400).json({ error: 'Invalid OTP' });
    res.json({ message: 'Delivery confirmed. Payment released to driver.', shipment: db.releaseEscrow(req.params.id) });
  } catch { res.status(500).json({ error: 'Failed to verify OTP' }); }
});

router.post('/:id/rate', (req, res) => {
  try {
    const shipment = db.getShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    const { rating, from } = req.body;
    const ratings = shipment.ratings || {};
    if (from === 'shipper') ratings.shipperToDriver = { ...rating, createdAt: new Date().toISOString() };
    else ratings.driverToShipper = { ...rating, createdAt: new Date().toISOString() };
    res.json({ message: 'Rating submitted', shipment: db.updateShipment(req.params.id, { ratings }) });
  } catch { res.status(500).json({ error: 'Failed to submit rating' }); }
});

router.post('/:id/cancel', (req, res) => {
  try {
    const shipment = db.getShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    if (['delivered', 'cancelled'].includes(shipment.status)) return res.status(400).json({ error: 'Cannot cancel this shipment' });
    const updated = db.updateShipment(req.params.id, {
      status: 'cancelled',
      timeline: [...shipment.timeline, { status: 'cancelled', timestamp: new Date().toISOString(), note: req.body.reason || 'Shipment cancelled' }]
    });
    res.json({ message: 'Shipment cancelled', shipment: updated });
  } catch { res.status(500).json({ error: 'Failed to cancel shipment' }); }
});

export default router;
