import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { JobRequest } from '../../src/types';

const router = Router();

// Get all drivers
router.get('/', (req, res) => {
  try {
    const drivers = db.getDrivers();
    res.json({ drivers });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to get drivers' });
  }
});

// Get online drivers — must be before /:id
router.get('/online', (req, res) => {
  try {
    const drivers = db.getOnlineDrivers();
    res.json({ drivers });
  } catch (error) {
    console.error('Get online drivers error:', error);
    res.status(500).json({ error: 'Failed to get online drivers' });
  }
});

// Get nearby drivers — must be before /:id
router.get('/nearby', (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    const drivers = db.getNearbyDrivers(
      { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
      radius ? parseFloat(radius as string) : 10
    );
    res.json({ drivers });
  } catch (error) {
    console.error('Get nearby drivers error:', error);
    res.status(500).json({ error: 'Failed to get nearby drivers' });
  }
});

// Respond to job request — must be before /:id to avoid conflict
router.post('/job-request/:requestId/respond', (req, res) => {
  try {
    const { requestId } = req.params;
    const { accepted } = req.body;

    const jobRequest = db.getJobRequest(requestId);
    if (!jobRequest) {
      return res.status(404).json({ error: 'Job request not found' });
    }

    if (jobRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Job request already processed' });
    }

    db.updateJobRequest(requestId, {
      status: accepted ? 'accepted' : 'rejected'
    });

    if (accepted) {
      db.updateShipment(jobRequest.shipment.id, {
        driverId: jobRequest.driverId,
        status: 'driver_assigned',
        timeline: [
          ...jobRequest.shipment.timeline,
          {
            status: 'driver_assigned',
            timestamp: new Date().toISOString(),
            note: `Driver assigned: ${jobRequest.driverId}`
          }
        ]
      });
    } else {
      db.applyDriverCancellationPenalty(jobRequest.driverId);
    }

    res.json({ message: accepted ? 'Job accepted' : 'Job rejected', accepted });
  } catch (error) {
    console.error('Job response error:', error);
    res.status(500).json({ error: 'Failed to respond to job request' });
  }
});

// Get driver by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const driver = db.getUser(id);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ driver });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ error: 'Failed to get driver' });
  }
});

// Update driver location
router.post('/:id/location', (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, address } = req.body;
    const driver = db.getUser(id);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }
    db.updateDriverLocation(id, { lat, lng, address });
    res.json({ message: 'Location updated', location: { lat, lng, address } });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Update driver online/offline status
router.post('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline } = req.body;
    const driver = db.getUser(id);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }
    db.updateDriverStatus(id, isOnline);
    res.json({ message: `Driver is now ${isOnline ? 'online' : 'offline'}`, isOnline });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get driver earnings
router.get('/:id/earnings', (req, res) => {
  try {
    const { id } = req.params;
    const driver = db.getUser(id);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const shipments = db.getShipmentsByDriver(id);
    const completedShipments = shipments.filter(s => s.status === 'delivered');

    const today = new Date().toDateString();
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const todayEarnings = completedShipments
      .filter(s => new Date(s.createdAt).toDateString() === today)
      .reduce((sum, s) => sum + s.price.total * 0.85, 0);

    const weekEarnings = completedShipments
      .filter(s => new Date(s.createdAt) >= thisWeek)
      .reduce((sum, s) => sum + s.price.total * 0.85, 0);

    const monthEarnings = completedShipments
      .filter(s => new Date(s.createdAt) >= thisMonth)
      .reduce((sum, s) => sum + s.price.total * 0.85, 0);

    const totalEarnings = completedShipments
      .reduce((sum, s) => sum + s.price.total * 0.85, 0);

    const pendingEarnings = shipments
      .filter(s => s.status === 'in_transit')
      .reduce((sum, s) => sum + s.price.total * 0.85, 0);

    res.json({
      earnings: {
        today: Math.round(todayEarnings),
        thisWeek: Math.round(weekEarnings),
        thisMonth: Math.round(monthEarnings),
        total: Math.round(totalEarnings),
        pending: Math.round(pendingEarnings)
      },
      completedDeliveries: completedShipments.length
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to get earnings' });
  }
});

// Send job request to driver
router.post('/:id/job-request', (req, res) => {
  try {
    const { id } = req.params;
    const { shipmentId } = req.body;

    const driver = db.getUser(id);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const shipment = db.getShipment(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const jobRequestId = `jr_${uuidv4().split('-')[0]}`;
    const now = new Date();

    const jobRequest: JobRequest = {
      id: jobRequestId,
      shipment,
      driverId: id,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 2 * 60 * 1000).toISOString()
    };

    db.createJobRequest(jobRequest);
    res.json({ message: 'Job request sent', jobRequest });
  } catch (error) {
    console.error('Job request error:', error);
    res.status(500).json({ error: 'Failed to send job request' });
  }
});

// Get pending job requests for driver
router.get('/:id/job-requests', (req, res) => {
  try {
    const { id } = req.params;
    const jobRequests = db.getPendingJobRequestsForDriver(id);
    res.json({ jobRequests });
  } catch (error) {
    console.error('Get job requests error:', error);
    res.status(500).json({ error: 'Failed to get job requests' });
  }
});

export default router;
