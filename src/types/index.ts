// Tranzit - Type Definitions

export type UserRole = 'shipper' | 'driver' | 'admin';

export type VehicleType = 'motorcycle' | 'tuk-tuk' | 'pickup' | 'van' | 'truck' | 'lorry';

export type ShipmentStatus = 
  | 'pending' 
  | 'searching' 
  | 'driver_assigned' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

export type CargoType = 
  | 'documents' 
  | 'parcel' 
  | 'food' 
  | 'electronics' 
  | 'furniture' 
  | 'construction' 
  | 'agricultural' 
  | 'general';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isVerified: boolean;
}

export interface Shipper extends User {
  role: 'shipper';
  businessName?: string;
  businessType?: string;
  rating: number;
  totalShipments: number;
}

export interface Driver extends User {
  role: 'driver';
  vehicle: Vehicle;
  licenseNumber: string;
  isOnline: boolean;
  currentLocation?: GeoLocation;
  rating: number;
  totalDeliveries: number;
  earnings: number;
  acceptanceRate: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  capacity: {
    weight: number; // kg
    volume: number; // cubic meters
  };
  photos: string[];
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Shipment {
  id: string;
  shipperId: string;
  driverId?: string;
  pickup: Location;
  dropoff: Location;
  cargo: Cargo;
  status: ShipmentStatus;
  price: Price;
  timeline: TimelineEvent[];
  tracking: TrackingUpdate[];
  payment: Payment;
  ratings?: {
    shipperToDriver?: Rating;
    driverToShipper?: Rating;
  };
  createdAt: string;
  estimatedDelivery: string;
}

export interface Location {
  address: string;
  coordinates: GeoLocation;
  contactName: string;
  contactPhone: string;
  instructions?: string;
}

export interface Cargo {
  type: CargoType;
  description: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isFragile: boolean;
  photos?: string[];
}

export interface Price {
  baseFare: number;
  distanceCharge: number;
  weightCharge: number;
  urgencyCharge: number;
  total: number;
  currency: string;
}

export interface TimelineEvent {
  status: ShipmentStatus;
  timestamp: string;
  note?: string;
}

export interface TrackingUpdate {
  timestamp: string;
  location: GeoLocation;
  status: string;
}

export interface Payment {
  method: 'mpesa' | 'cash' | 'wallet';
  status: 'pending' | 'processing' | 'escrowed' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: string;
  releasedAt?: string;
  escrowHeld?: boolean;
}

export interface Rating {
  score: number;
  comment?: string;
  createdAt: string;
}

export interface JobRequest {
  id: string;
  shipment: Shipment;
  driverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface TripOTP {
  shipmentId: string;
  pickupOtp: string;
  dropoffOtp: string;
  pickupVerified: boolean;
  dropoffVerified: boolean;
  createdAt: string;
}

export interface Earnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  pending: number;
}

export interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  completedShipments: number;
  totalRevenue: number;
  activeDrivers: number;
  pendingDeliveries: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}
