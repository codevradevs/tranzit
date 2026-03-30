import { User, Shipper, Driver, Shipment, JobRequest, Notification, DashboardStats, TripOTP } from '../types.js';

class Database {
  private users: Map<string, User> = new Map();
  private shippers: Map<string, Shipper> = new Map();
  private drivers: Map<string, Driver> = new Map();
  private shipments: Map<string, Shipment> = new Map();
  private jobRequests: Map<string, JobRequest> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private tripOtps: Map<string, TripOTP> = new Map();

  constructor() { this.seedData(); }

  createUser(user: User): User {
    this.users.set(user.id, user);
    if (user.role === 'shipper') this.shippers.set(user.id, user as Shipper);
    else if (user.role === 'driver') this.drivers.set(user.id, user as Driver);
    return user;
  }
  getUser(id: string): User | undefined { return this.users.get(id); }
  getUserByPhone(phone: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.phone === phone);
  }
  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    if (updated.role === 'driver') this.drivers.set(id, updated as Driver);
    return updated;
  }
  getAllUsers(): User[] { return Array.from(this.users.values()); }

  getDrivers(): Driver[] { return Array.from(this.drivers.values()); }
  getOnlineDrivers(): Driver[] { return Array.from(this.drivers.values()).filter(d => d.isOnline); }
  getNearbyDrivers(location: { lat: number; lng: number }, radius = 10): Driver[] {
    return this.getOnlineDrivers().filter(driver => {
      if (!driver.currentLocation) return false;
      return this.calcDistance(location.lat, location.lng, driver.currentLocation.lat, driver.currentLocation.lng) <= radius;
    });
  }
  updateDriverLocation(driverId: string, location: { lat: number; lng: number; address: string }): void {
    const driver = this.drivers.get(driverId);
    if (driver) { driver.currentLocation = location; this.drivers.set(driverId, driver); }
  }
  updateDriverStatus(driverId: string, isOnline: boolean): void {
    const driver = this.drivers.get(driverId);
    if (driver) { driver.isOnline = isOnline; this.drivers.set(driverId, driver); }
  }

  createShipment(shipment: Shipment): Shipment { this.shipments.set(shipment.id, shipment); return shipment; }
  getShipment(id: string): Shipment | undefined { return this.shipments.get(id); }
  getAllShipments(): Shipment[] { return Array.from(this.shipments.values()); }
  getShipmentsByShipper(shipperId: string): Shipment[] {
    return Array.from(this.shipments.values()).filter(s => s.shipperId === shipperId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getShipmentsByDriver(driverId: string): Shipment[] {
    return Array.from(this.shipments.values()).filter(s => s.driverId === driverId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  updateShipment(id: string, updates: Partial<Shipment>): Shipment | undefined {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;
    const updated = { ...shipment, ...updates };
    this.shipments.set(id, updated);
    return updated;
  }
  getActiveShipments(): Shipment[] {
    return Array.from(this.shipments.values())
      .filter(s => ['searching', 'driver_assigned', 'picked_up', 'in_transit'].includes(s.status));
  }

  createJobRequest(request: JobRequest): JobRequest { this.jobRequests.set(request.id, request); return request; }
  getJobRequest(id: string): JobRequest | undefined { return this.jobRequests.get(id); }
  updateJobRequest(id: string, updates: Partial<JobRequest>): JobRequest | undefined {
    const request = this.jobRequests.get(id);
    if (!request) return undefined;
    const updated = { ...request, ...updates };
    this.jobRequests.set(id, updated);
    return updated;
  }
  getPendingJobRequestsForDriver(driverId: string): JobRequest[] {
    return Array.from(this.jobRequests.values())
      .filter(jr => jr.driverId === driverId && jr.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createTripOtp(shipmentId: string): TripOTP {
    const otp: TripOTP = {
      shipmentId,
      pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      dropoffOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      pickupVerified: false, dropoffVerified: false,
      createdAt: new Date().toISOString()
    };
    this.tripOtps.set(shipmentId, otp);
    return otp;
  }
  verifyPickupOtp(shipmentId: string, otp: string): boolean {
    const tripOtp = this.tripOtps.get(shipmentId);
    if (!tripOtp || tripOtp.pickupOtp !== otp) return false;
    tripOtp.pickupVerified = true;
    return true;
  }
  verifyDropoffOtp(shipmentId: string, otp: string): boolean {
    const tripOtp = this.tripOtps.get(shipmentId);
    if (!tripOtp || tripOtp.dropoffOtp !== otp) return false;
    tripOtp.dropoffVerified = true;
    return true;
  }
  releaseEscrow(shipmentId: string): Shipment | undefined {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) return undefined;
    const updated = { ...shipment, payment: { ...shipment.payment, status: 'completed' as const, releasedAt: new Date().toISOString(), escrowHeld: false } };
    this.shipments.set(shipmentId, updated);
    return updated;
  }
  applyDriverCancellationPenalty(driverId: string): void {
    const driver = this.drivers.get(driverId);
    if (!driver) return;
    const newRate = Math.max(0, driver.acceptanceRate - 5);
    const updated = { ...driver, acceptanceRate: newRate, tier: newRate < 70 ? 'bronze' : newRate < 80 && driver.tier === 'gold' ? 'silver' : driver.tier } as Driver;
    this.drivers.set(driverId, updated);
    this.users.set(driverId, updated);
  }

  createNotification(notification: Notification): Notification { this.notifications.set(notification.id, notification); return notification; }
  getNotificationsForUser(userId: string): Notification[] {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getDashboardStats(): DashboardStats {
    const all = Array.from(this.shipments.values());
    return {
      totalShipments: all.length,
      activeShipments: all.filter(s => ['searching', 'driver_assigned', 'picked_up', 'in_transit'].includes(s.status)).length,
      completedShipments: all.filter(s => s.status === 'delivered').length,
      totalRevenue: all.filter(s => s.payment.status === 'completed').reduce((sum, s) => sum + s.price.total, 0),
      activeDrivers: this.getOnlineDrivers().length,
      pendingDeliveries: all.filter(s => s.status === 'pending').length
    };
  }

  private calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private seedData(): void {
    const drivers: Driver[] = [
      { id: 'driver_1', name: 'John Kamau', phone: '+254712345678', role: 'driver', avatar: '/images/driver1.jpg', createdAt: new Date().toISOString(), isVerified: true, vehicle: { id: 'veh_1', type: 'pickup', make: 'Toyota', model: 'Hilux', year: 2020, registrationNumber: 'KCA 123A', capacity: { weight: 1000, volume: 5 }, photos: [] }, licenseNumber: 'DL123456', isOnline: true, currentLocation: { lat: -1.2921, lng: 36.8219, address: 'Nairobi CBD' }, rating: 4.8, totalDeliveries: 156, earnings: 450000, acceptanceRate: 92, tier: 'gold' },
      { id: 'driver_2', name: 'Mary Ochieng', phone: '+254723456789', role: 'driver', avatar: '/images/driver2.jpg', createdAt: new Date().toISOString(), isVerified: true, vehicle: { id: 'veh_2', type: 'van', make: 'Nissan', model: 'NV350', year: 2021, registrationNumber: 'KCB 456B', capacity: { weight: 1500, volume: 8 }, photos: [] }, licenseNumber: 'DL789012', isOnline: true, currentLocation: { lat: -1.2841, lng: 36.8265, address: 'Westlands, Nairobi' }, rating: 4.9, totalDeliveries: 203, earnings: 620000, acceptanceRate: 95, tier: 'platinum' },
      { id: 'driver_3', name: 'Peter Mwangi', phone: '+254734567890', role: 'driver', avatar: '/images/driver3.jpg', createdAt: new Date().toISOString(), isVerified: true, vehicle: { id: 'veh_3', type: 'motorcycle', make: 'Boxer', model: 'BM150', year: 2022, registrationNumber: 'KMC 789C', capacity: { weight: 50, volume: 0.1 }, photos: [] }, licenseNumber: 'DL345678', isOnline: false, rating: 4.6, totalDeliveries: 89, earnings: 180000, acceptanceRate: 88, tier: 'silver' },
      { id: 'driver_4', name: 'Grace Wanjiku', phone: '+254745678901', role: 'driver', avatar: '/images/driver4.jpg', createdAt: new Date().toISOString(), isVerified: true, vehicle: { id: 'veh_4', type: 'truck', make: 'Isuzu', model: 'FVR', year: 2019, registrationNumber: 'KDA 012D', capacity: { weight: 8000, volume: 25 }, photos: [] }, licenseNumber: 'DL901234', isOnline: true, currentLocation: { lat: -1.3000, lng: 36.8000, address: 'Industrial Area, Nairobi' }, rating: 4.7, totalDeliveries: 312, earnings: 1200000, acceptanceRate: 90, tier: 'gold' }
    ];
    drivers.forEach(d => { this.users.set(d.id, d); this.drivers.set(d.id, d); });

    const shippers: Shipper[] = [
      { id: 'shipper_1', name: 'ABC Hardware Ltd', phone: '+254756789012', email: 'orders@abchardware.co.ke', role: 'shipper', avatar: '/images/business1.jpg', createdAt: new Date().toISOString(), isVerified: true, businessName: 'ABC Hardware Ltd', businessType: 'Construction Supplies', rating: 4.9, totalShipments: 45 },
      { id: 'shipper_2', name: 'Fresh Foods Kenya', phone: '+254767890123', email: 'logistics@freshfoods.co.ke', role: 'shipper', avatar: '/images/business2.jpg', createdAt: new Date().toISOString(), isVerified: true, businessName: 'Fresh Foods Kenya', businessType: 'Food Distribution', rating: 4.7, totalShipments: 128 }
    ];
    shippers.forEach(s => { this.users.set(s.id, s); this.shippers.set(s.id, s); });

    const admin: any = { id: 'admin_1', name: 'System Admin', phone: '+254700000000', role: 'admin', createdAt: new Date().toISOString(), isVerified: true, password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' };
    this.users.set('admin_1', admin);
  }
}

export const db = new Database();
