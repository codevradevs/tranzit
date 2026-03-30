import { useState, useEffect } from 'react';
import { 
  Package, MapPin, Clock, CreditCard, User, LogOut, 
  Plus, Search, Bell, ChevronRight, Phone, 
  Truck, CheckCircle, XCircle, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import type { Shipment, ShipmentStatus } from '../../types';

export function ShipperDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shipments' | 'new' | 'tracking' | 'profile'>('dashboard');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [notifications] = useState(3);
  const [, setIsLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await fetch(`/api/shipments/shipper/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments);
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ShipmentStatus) => {
    const colors: Record<ShipmentStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      searching: 'bg-blue-100 text-blue-800',
      driver_assigned: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-orange-100 text-orange-800',
      in_transit: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: ShipmentStatus) => {
    const labels: Record<ShipmentStatus, string> = {
      pending: 'Pending',
      searching: 'Searching Driver',
      driver_assigned: 'Driver Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-white/70">Ready to ship something today?</p>
        <Button
          onClick={() => setActiveTab('new')}
          className="mt-4 bg-[#FF6B00] hover:bg-[#E55F00] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Shipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Shipments', value: shipments.length, icon: Package, color: 'bg-blue-100 text-blue-600' },
          { label: 'Active', value: shipments.filter(s => ['searching', 'driver_assigned', 'picked_up', 'in_transit'].includes(s.status)).length, icon: Truck, color: 'bg-orange-100 text-orange-600' },
          { label: 'Delivered', value: shipments.filter(s => s.status === 'delivered').length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
          { label: 'Cancelled', value: shipments.filter(s => s.status === 'cancelled').length, icon: XCircle, color: 'bg-red-100 text-red-600' }
        ].map((stat, index) => (
          <div key={index} className="card-tranzit p-4">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-[#0B1F3A]">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Shipments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0B1F3A]">Recent Shipments</h3>
          <button
            onClick={() => setActiveTab('shipments')}
            className="text-[#FF6B00] text-sm font-medium hover:underline flex items-center"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        {shipments.length === 0 ? (
          <div className="card-tranzit p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No shipments yet</p>
            <Button
              onClick={() => setActiveTab('new')}
              className="mt-4 bg-[#FF6B00] hover:bg-[#E55F00] text-white"
            >
              Create Your First Shipment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.slice(0, 3).map((shipment) => (
              <div key={shipment.id} className="card-tranzit p-4 hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => setActiveTab('tracking')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0B1F3A]">{shipment.cargo.type}</p>
                      <p className="text-sm text-gray-500">
                        {shipment.pickup.address.substring(0, 30)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                    <p className="text-sm font-semibold text-[#0B1F3A] mt-1">
                      KES {shipment.price.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderNewShipment = () => (
    <NewShipmentForm 
      onSuccess={() => {
        fetchShipments();
        setActiveTab('shipments');
      }}
      onCancel={() => setActiveTab('dashboard')}
    />
  );

  const renderShipments = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0B1F3A]">My Shipments</h2>
        <Button
          onClick={() => setActiveTab('new')}
          className="bg-[#FF6B00] hover:bg-[#E55F00] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Shipment
        </Button>
      </div>

      {shipments.length === 0 ? (
        <div className="card-tranzit p-8 text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No shipments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment) => (
            <div key={shipment.id} className="card-tranzit p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-[#0B1F3A] text-lg">{shipment.cargo.type}</p>
                  <p className="text-sm text-gray-500">{shipment.cargo.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                  {getStatusLabel(shipment.status)}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="text-sm text-[#0B1F3A]">{shipment.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dropoff</p>
                    <p className="text-sm text-[#0B1F3A]">{shipment.dropoff.address}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    <Package className="w-4 h-4 inline mr-1" />
                    {shipment.cargo.weight} kg
                  </span>
                </div>
                <p className="font-bold text-[#FF6B00]">
                  KES {shipment.price.total.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTracking = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#0B1F3A]">Live Tracking</h2>
      
      {shipments.filter(s => ['searching', 'driver_assigned', 'picked_up', 'in_transit'].includes(s.status)).length === 0 ? (
        <div className="card-tranzit p-8 text-center">
          <Navigation className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No active shipments to track</p>
          <Button
            onClick={() => setActiveTab('new')}
            className="mt-4 bg-[#FF6B00] hover:bg-[#E55F00] text-white"
          >
            Create New Shipment
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments
            .filter(s => ['searching', 'driver_assigned', 'picked_up', 'in_transit'].includes(s.status))
            .map(shipment => (
              <div key={shipment.id} className="card-tranzit p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-[#0B1F3A]">{shipment.cargo.type}</p>
                    <p className="text-sm text-gray-500">ID: {shipment.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                    {getStatusLabel(shipment.status)}
                  </span>
                </div>
                
                {/* Tracking Timeline */}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {shipment.timeline.map((event, index) => (
                      <div key={index} className="flex items-start gap-4 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                          index === shipment.timeline.length - 1 
                            ? 'bg-[#FF6B00] text-white' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0B1F3A]">
                            {getStatusLabel(event.status)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          {event.note && (
                            <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Driver Info */}
                {shipment.driverId && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Driver Information</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0B1F3A]">Driver Assigned</p>
                        <p className="text-xs text-gray-500">ID: {shipment.driverId}</p>
                      </div>
                      <button className="ml-auto w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#0B1F3A]">My Profile</h2>
      
      <div className="card-tranzit p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B00] to-[#ff8533] rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {user?.name?.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#0B1F3A]">{user?.name}</h3>
            <p className="text-gray-500">{user?.phone}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={user?.name} disabled className="input-tranzit bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" value={user?.phone} disabled className="input-tranzit bg-gray-50" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={user?.email || 'Not provided'} 
              disabled 
              className="input-tranzit bg-gray-50" 
            />
          </div>
        </div>
      </div>
      
      <div className="card-tranzit p-6">
        <h3 className="font-semibold text-[#0B1F3A] mb-4">Account Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-[#0B1F3A]">{shipments.length}</p>
            <p className="text-sm text-gray-500">Total Shipments</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-[#0B1F3A]">
              {shipments.filter(s => s.status === 'delivered').length}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-[#0B1F3A]">
              KES {shipments
                .filter(s => s.payment.status === 'completed')
                .reduce((sum, s) => sum + s.price.total, 0)
                .toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Spent</p>
          </div>
        </div>
      </div>
      
      <Button
        onClick={logout}
        variant="outline"
        className="w-full border-red-200 text-red-600 hover:bg-red-50 py-3"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#ff8533] rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#0B1F3A]">Tranzit</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF6B00] text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="w-8 h-8 bg-gradient-to-br from-[#0B1F3A] to-[#1a3a5c] rounded-full flex items-center justify-center"
              >
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0)}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="card-tranzit p-2 space-y-1 sticky top-24">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Package },
                { id: 'new', label: 'New Shipment', icon: Plus },
                { id: 'shipments', label: 'My Shipments', icon: Search },
                { id: 'tracking', label: 'Live Tracking', icon: MapPin },
                { id: 'profile', label: 'Profile', icon: User }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-[#FF6B00] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'new' && renderNewShipment()}
            {activeTab === 'shipments' && renderShipments()}
            {activeTab === 'tracking' && renderTracking()}
            {activeTab === 'profile' && renderProfile()}
          </main>
        </div>
      </div>
    </div>
  );
}

// New Shipment Form Component
interface NewShipmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function NewShipmentForm({ onSuccess, onCancel }: NewShipmentFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [formData, setFormData] = useState({
    pickup: {
      address: '',
      coordinates: { lat: -1.2921, lng: 36.8219 },
      contactName: '',
      contactPhone: '',
      instructions: ''
    },
    dropoff: {
      address: '',
      coordinates: { lat: -1.2841, lng: 36.8265 },
      contactName: '',
      contactPhone: '',
      instructions: ''
    },
    cargo: {
      type: 'general' as const,
      description: '',
      weight: 0,
      isFragile: false
    },
    paymentMethod: 'mpesa',
    isUrgent: false
  });

  const handleGetEstimate = async () => {
    try {
      const response = await fetch('/api/shipments/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          cargo: formData.cargo,
          isUrgent: formData.isUrgent
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setEstimate(data);
        setStep(4);
      }
    } catch (error) {
      console.error('Estimate error:', error);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipperId: user?.id,
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          cargo: formData.cargo,
          paymentMethod: formData.paymentMethod,
          isUrgent: formData.isUrgent
        })
      });
      
      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Create shipment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargoTypes = [
    { id: 'documents', label: 'Documents', icon: Package },
    { id: 'parcel', label: 'Parcel', icon: Package },
    { id: 'food', label: 'Food & Beverages', icon: Package },
    { id: 'electronics', label: 'Electronics', icon: Package },
    { id: 'furniture', label: 'Furniture', icon: Package },
    { id: 'construction', label: 'Construction', icon: Package },
    { id: 'agricultural', label: 'Agricultural', icon: Package },
    { id: 'general', label: 'General Cargo', icon: Package }
  ];

  return (
    <div className="card-tranzit p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0B1F3A]">Create New Shipment</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s ? 'bg-[#FF6B00] text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <h3 className="font-semibold text-[#0B1F3A]">Pickup Location</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.pickup.address}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                pickup: { ...prev.pickup, address: e.target.value }
              }))}
              placeholder="Enter pickup address"
              className="input-tranzit"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
              <input
                type="text"
                value={formData.pickup.contactName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pickup: { ...prev.pickup, contactName: e.target.value }
                }))}
                placeholder="Name"
                className="input-tranzit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                value={formData.pickup.contactPhone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pickup: { ...prev.pickup, contactPhone: e.target.value }
                }))}
                placeholder="Phone number"
                className="input-tranzit"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions (Optional)</label>
            <textarea
              value={formData.pickup.instructions}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                pickup: { ...prev.pickup, instructions: e.target.value }
              }))}
              placeholder="Any special instructions..."
              className="input-tranzit h-20 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              className="bg-[#FF6B00] hover:bg-[#E55F00] text-white"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h3 className="font-semibold text-[#0B1F3A]">Dropoff Location</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.dropoff.address}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dropoff: { ...prev.dropoff, address: e.target.value }
              }))}
              placeholder="Enter dropoff address"
              className="input-tranzit"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
              <input
                type="text"
                value={formData.dropoff.contactName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dropoff: { ...prev.dropoff, contactName: e.target.value }
                }))}
                placeholder="Name"
                className="input-tranzit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                value={formData.dropoff.contactPhone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dropoff: { ...prev.dropoff, contactPhone: e.target.value }
                }))}
                placeholder="Phone number"
                className="input-tranzit"
              />
            </div>
          </div>
          <div className="flex justify-between">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="border-gray-200"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="bg-[#FF6B00] hover:bg-[#E55F00] text-white"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h3 className="font-semibold text-[#0B1F3A]">Cargo Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Type</label>
            <div className="grid grid-cols-2 gap-3">
              {cargoTypes.slice(0, 4).map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    cargo: { ...prev.cargo, type: type.id as any }
                  }))}
                  className={`p-3 border-2 rounded-xl text-left transition-all ${
                    formData.cargo.type === type.id
                      ? 'border-[#FF6B00] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className={`w-5 h-5 mb-2 ${
                    formData.cargo.type === type.id ? 'text-[#FF6B00]' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    formData.cargo.type === type.id ? 'text-[#FF6B00]' : 'text-gray-700'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.cargo.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cargo: { ...prev.cargo, description: e.target.value }
              }))}
              placeholder="Describe your cargo"
              className="input-tranzit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={formData.cargo.weight}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cargo: { ...prev.cargo, weight: parseFloat(e.target.value) || 0 }
              }))}
              placeholder="0"
              className="input-tranzit"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cargo.isFragile}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cargo: { ...prev.cargo, isFragile: e.target.checked }
              }))}
              className="rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]"
            />
            <span className="text-gray-700">Fragile items - handle with care</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isUrgent}
              onChange={(e) => setFormData(prev => ({ ...prev, isUrgent: e.target.checked }))}
              className="rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]"
            />
            <span className="text-gray-700">Urgent delivery (+KES 200)</span>
          </label>
          <div className="flex justify-between">
            <Button
              onClick={() => setStep(2)}
              variant="outline"
              className="border-gray-200"
            >
              Back
            </Button>
            <Button
              onClick={handleGetEstimate}
              className="bg-[#FF6B00] hover:bg-[#E55F00] text-white"
            >
              Get Estimate
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && estimate && (
        <div className="space-y-5">
          <h3 className="font-semibold text-[#0B1F3A]">Price Estimate</h3>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Fare</span>
                <span className="font-medium">KES {estimate.price.baseFare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distance ({estimate.distance.toFixed(1)} km)</span>
                <span className="font-medium">KES {estimate.price.distanceCharge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weight Charge</span>
                <span className="font-medium">KES {estimate.price.weightCharge}</span>
              </div>
              {estimate.price.urgencyCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgency</span>
                  <span className="font-medium">KES {estimate.price.urgencyCharge}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-[#0B1F3A]">Total</span>
                  <span className="font-bold text-[#FF6B00]">KES {estimate.price.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <Clock className="w-4 h-4 inline mr-1" />
              Estimated delivery time: {estimate.estimatedTime} minutes
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border-2 border-[#FF6B00] bg-orange-50 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="mpesa"
                  checked={formData.paymentMethod === 'mpesa'}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="text-[#FF6B00]"
                />
                <CreditCard className="w-5 h-5 text-[#FF6B00]" />
                <span className="font-medium text-gray-700">M-Pesa</span>
              </label>
              <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                />
                <span className="font-medium text-gray-700">Cash on Delivery</span>
              </label>
            </div>
          </div>
          <div className="flex justify-between">
            <Button
              onClick={() => setStep(3)}
              variant="outline"
              className="border-gray-200"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-[#FF6B00] hover:bg-[#E55F00] text-white"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Confirm & Pay'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
