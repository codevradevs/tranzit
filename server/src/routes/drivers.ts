import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { JobRequest } from '../types.js';

const router = Router();

router.get('/', (req, res) => {
  try { res.json({ drivers: db.getDrivers() }); }
  catch { res.status(500).json({ error: 'Failed to get drivers' }); }
});

router.get('/online', (req, res) => {
  try { res.json({ drivers: db.getOnlineDrivers() }); }
  catch { res.status(500).json({ error: 'Failed to get online drivers' }); }
});

router.get('/nearby', (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Latitude and longitude required' });
    res.json({ drivers: db.getNearbyDrivers({ lat: parseFloat(lat as string), lng: parseFloat(lng as string) }, radius ? parseFloat(radius as string) : 10) });
  } catch { res.status(500).json({ error: 'Failed to get nearby drivers' }); }
});

router.post('/job-request/:requestId/respond', (req, res) => {
  try {
    const jobRequest = db.getJobRequest(req.params.requestId);
    if (!jobRequest) return res.status(404).json({ error: 'Job request not found' });
    if (jobRequest.status !== 'pending') return res.status(400).json({ error: 'Job request already processed' });
    const { accepted } = req.body;
    db.updateJobRequest(req.params.requestId, { status: accepted ? 'accepted' : 'rejected' });
    if (accepted) {
      db.updateShipment(jobRequest.shipment.id, {
        driverId: jobRequest.driverId, status: 'driver_assigned',
        timeline: [...jobRequest.shipment.timeline, { status: 'driver_assigned', timestamp: new Date().toISOString(), note: `Driver assigned: ${jobRequest.driverId}` }]
      });
    } else {
      db.applyDriverCancellationPenalty(jobRequest.driverId);
    }
    res.json({ message: accepted ? 'Job accepted' : 'Job rejected', accepted });
  } catch { res.status(500).json({ error: 'Failed to respond to job request' }); }
});

router.get('/:id', (req, res) => {
  try {
    const driver = db.getUser(req.params.id);
    if (!driver || driver.role !== 'driver') return res.status(404).json({ error: 'Driver not found' });
    res.json({ driver });
  } catch { res.status(500).json({ error: 'Failed to get driver' }); }
});

router.post('/:id/location', (req, res) => {
  try {
    const driver = db.getUser(req.params.id);
    if (!driver || driver.role !== 'driver') return res.status(404).json({ error: 'Driver not found' });
    const { lat, lng, address } = req.body;
    db.updateDriverLocation(req.params.id, { lat, lng, address });
    res.json({ message: 'Location updated', location: { lat, lng, address } });
  } catch { res.status(500).json({ error: 'Failed to update location' }); }
});

router.post('/:id/status', (req, res) => {
  try {
    const driver = db.getUser(req.params.id);
    if (!driver || driver.role !== 'driver') return res.status(404).json({ error: 'Driver not found' });
    db.updateDriverStatus(req.params.id, req.body.isOnline);
    res.json({ message: `Driver is now ${req.body.isOnline ? 'online' : 'offline'}`, isOnline: req.body.isOnline });
  } catch { res.status(500).json({ error: 'Failed to update status' }); }
});

router.get('/:id/earnings', (req, res) => {
  try {
    const driver = db.getUser(req.params.id);
    if (!driver || driver.role !== 'driver') return res.status(404).json({ error: 'Driver not found' });
    const shipments = db.getShipmentsByDriver(req.params.id);
    const completed = shipments.filter(s => s.status === 'delivered');
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const monthAgo = new Date(Date.now() - 30 * 86400000);
    const earn = (arr: typeof completed) => Math.round(arr.reduce((s, x) => s + x.price.total * 0.85, 0));
    res.json({
      earnings: {
        today: earn(completed.filter(s => new Date(s.createdAt).toDateString() === today)),
        thisWeek: earn(completed.filter(s => new Date(s.createdAt) >= weekAgo)),
        thisMonth: earn(completed.filter(s => new Date(s.createdAt) >= monthAgo)),
        total: earn(completed),
        pending: earn(shipments.filter(s => s.status === 'in_transit'))
      },
      completedDeliveries: completed.length
    });
  } catch { res.status(500).json({ error: 'Failed to get earnings' }); }
});

router.post('/:id/job-request', (req, res) => {
  try {
    const driver = db.getUser(req.params.id);
    if (!driver || driver.role !== 'driver') return res.status(404).json({ error: 'Driver not found' });
    const shipment = db.getShipment(req.body.shipmentId);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    const now = new Date();
    const jobRequest: JobRequest = {
      id: `jr_${uuidv4().split('-')[0]}`, shipment, driverId: req.params.id,
      status: 'pending', createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 2 * 60 * 1000).toISOString()
    };
    db.createJobRequest(jobRequest);
    res.json({ message: 'Job request sent', jobRequest });
  } catch { res.status(500).json({ error: 'Failed to send job request' }); }
});

router.get('/:id/job-requests', (req, res) => {
  try {
    res.json({ jobRequests: db.getPendingJobRequestsForDriver(req.params.id) });
  } catch { res.status(500).json({ error: 'Failed to get job requests' }); }
});

export default router;
