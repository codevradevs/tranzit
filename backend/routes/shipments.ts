import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { Shipment, ShipmentStatus, Price, TimelineEvent } from '../../src/types';

const router = Router();

// Calculate price based on distance, weight, and urgency
function calculatePrice(
  distance: number, 
  weight: number, 
  cargoType: string, 
  vehicleType: string,
  isUrgent: boolean = false
): Price {
  const baseFare = 150; // KES
  const distanceCharge = distance * 50; // KES per km
  const weightCharge = weight * 10; // KES per kg
  const urgencyCharge = isUrgent ? 200 : 0;
  
  const total = baseFare + distanceCharge + weightCharge + urgencyCharge;
  
  return {
    baseFare,
    distanceCharge,
    weightCharge,
    urgencyCharge,
    total: Math.round(total),
    currency: 'KES'
  };
}

// Calculate distance between two points (simplified)
function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get price estimate
router.post('/estimate', (req, res) => {
  try {
    const { pickup, dropoff, cargo, isUrgent } = req.body;
    
    const distance = calculateDistance(
      pickup.coordinates.lat, pickup.coordinates.lng,
      dropoff.coordinates.lat, dropoff.coordinates.lng
    );
    
    const price = calculatePrice(distance, cargo.weight, cargo.type, 'pickup', isUrgent);
    
    res.json({
      distance: Math.round(distance * 10) / 10,
      price,
      estimatedTime: Math.round(distance * 3) // minutes
    });
  } catch (error) {
    console.error('Price estimation error:', error);
    res.status(500).json({ error: 'Failed to calculate estimate' });
  }
});

// Create new shipment — also generates trip OTPs and holds payment in escrow
router.post('/', (req, res) => {
  try {
    const { shipperId, pickup, dropoff, cargo, paymentMethod, isUrgent } = req.body;
    
    const distance = calculateDistance(
      pickup.coordinates.lat, pickup.coordinates.lng,
      dropoff.coordinates.lat, dropoff.coordinates.lng
    );
    
    const price = calculatePrice(distance, cargo.weight, cargo.type, 'pickup', isUrgent);
    
    const shipmentId = `shp_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();
    
    const timeline: TimelineEvent[] = [
      {
        status: 'pending',
        timestamp: now,
        note: 'Shipment created'
      }
    ];
    
    const shipment: Shipment = {
      id: shipmentId,
      shipperId,
      pickup,
      dropoff,
      cargo,
      status: 'pending',
      price,
      timeline,
      tracking: [],
      payment: {
        method: paymentMethod || 'mpesa',
        status: 'pending'
      },
      createdAt: now,
      estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
    };
    
    db.createShipment(shipment);

    // Generate trip OTPs for pickup/dropoff verification
    const tripOtp = db.createTripOtp(shipmentId);

    // Update shipper stats
    const shipper = db.getUser(shipperId);
    if (shipper && shipper.role === 'shipper') {
      db.updateUser(shipperId, {
        totalShipments: (shipper as any).totalShipments + 1
      });
    }
    
    res.status(201).json({
      message: 'Shipment created successfully',
      shipment,
      tripOtp: { pickupOtp: tripOtp.pickupOtp, dropoffOtp: tripOtp.dropoffOtp }
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// Get shipment by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const shipment = db.getShipment(id);
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.json({ shipment });
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ error: 'Failed to get shipment' });
  }
});

// Get shipments for shipper
router.get('/shipper/:shipperId', (req, res) => {
  try {
    const { shipperId } = req.params;
    const shipments = db.getShipmentsByShipper(shipperId);
    res.json({ shipments });
  } catch (error) {
    console.error('Get shipper shipments error:', error);
    res.status(500).json({ error: 'Failed to get shipments' });
  }
});

// Get shipments for driver
router.get('/driver/:driverId', (req, res) => {
  try {
    const { driverId } = req.params;
    const shipments = db.getShipmentsByDriver(driverId);
    res.json({ shipments });
  } catch (error) {
    console.error('Get driver shipments error:', error);
    res.status(500).json({ error: 'Failed to get shipments' });
  }
});

// Update shipment status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, driverId } = req.body;
    
    const shipment = db.getShipment(id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const timelineEvent: TimelineEvent = {
      status: status as ShipmentStatus,
      timestamp: new Date().toISOString(),
      note
    };
    
    const updates: Partial<Shipment> = {
      status: status as ShipmentStatus,
      timeline: [...shipment.timeline, timelineEvent]
    };
    
    if (driverId && status === 'driver_assigned') {
      updates.driverId = driverId;
    }
    
    const updatedShipment = db.updateShipment(id, updates);
    
    res.json({
      message: 'Status updated successfully',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Add tracking update
router.post('/:id/tracking', (req, res) => {
  try {
    const { id } = req.params;
    const { location, status } = req.body;
    
    const shipment = db.getShipment(id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const trackingUpdate = {
      timestamp: new Date().toISOString(),
      location,
      status
    };
    
    const updatedShipment = db.updateShipment(id, {
      tracking: [...shipment.tracking, trackingUpdate]
    });
    
    res.json({
      message: 'Tracking updated',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Tracking update error:', error);
    res.status(500).json({ error: 'Failed to update tracking' });
  }
});

// Verify pickup OTP
router.post('/:id/verify-pickup', (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const verified = db.verifyPickupOtp(id, otp);
    if (!verified) return res.status(400).json({ error: 'Invalid OTP' });
    res.json({ message: 'Pickup verified successfully' });
  } catch (error) {
    console.error('Pickup OTP error:', error);
    res.status(500).json({ error: 'Failed to verify pickup OTP' });
  }
});

// Verify dropoff OTP and release escrow
router.post('/:id/verify-dropoff', (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const verified = db.verifyDropoffOtp(id, otp);
    if (!verified) return res.status(400).json({ error: 'Invalid OTP' });
    // Release escrow payment to driver
    const updatedShipment = db.releaseEscrow(id);
    res.json({ message: 'Delivery confirmed. Payment released to driver.', shipment: updatedShipment });
  } catch (error) {
    console.error('Dropoff OTP error:', error);
    res.status(500).json({ error: 'Failed to verify dropoff OTP' });
  }
});

// Rate shipment
router.post('/:id/rate', (req, res) => {
  try {
    const { id } = req.params;
    const { rating, from } = req.body; // from: 'shipper' | 'driver'
    
    const shipment = db.getShipment(id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const ratingData = {
      ...rating,
      createdAt: new Date().toISOString()
    };
    
    const ratings = shipment.ratings || {};
    if (from === 'shipper') {
      ratings.shipperToDriver = ratingData;
    } else {
      ratings.driverToShipper = ratingData;
    }
    
    const updatedShipment = db.updateShipment(id, { ratings });
    
    res.json({
      message: 'Rating submitted',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Cancel shipment
router.post('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const shipment = db.getShipment(id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    if (['delivered', 'cancelled'].includes(shipment.status)) {
      return res.status(400).json({ error: 'Cannot cancel this shipment' });
    }
    
    const timelineEvent: TimelineEvent = {
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      note: reason || 'Shipment cancelled'
    };
    
    const updatedShipment = db.updateShipment(id, {
      status: 'cancelled',
      timeline: [...shipment.timeline, timelineEvent]
    });
    
    res.json({
      message: 'Shipment cancelled',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Cancel shipment error:', error);
    res.status(500).json({ error: 'Failed to cancel shipment' });
  }
});

export default router;
