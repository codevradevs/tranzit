import { useState, useEffect } from 'react';
import { 
  Truck, MapPin, DollarSign, User, LogOut, Star, Phone, 
  Power, Package, Navigation, Clock, CheckCircle, XCircle,
  Bell, ChevronRight, TrendingUp, Wallet, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import type { Shipment, JobRequest, ShipmentStatus } from '../../types';

export function DriverDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'shipments' | 'earnings' | 'profile'>('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [notifications, setNotifications] = useState(0);
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (user) {
      fetchDriverData();
      const interval = setInterval(fetchDriverData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('job:request', (data: any) => {
        setJobRequests(prev => [...prev, data]);
        setNotifications(prev => prev + 1);
      });

      return () => {
        socket.off('job:request');
      };
    }
  }, [socket, isConnected]);

  const fetchDriverData = async () => {
    try {
      // Fetch job requests
      const jobResponse = await fetch(`/api/drivers/${user?.id}/job-requests`);
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJobRequests(jobData.jobRequests);
      }

      // Fetch shipments
      const shipmentResponse = await fetch(`/api/shipments/driver/${user?.id}`);
      if (shipmentResponse.ok) {
        const shipmentData = await shipmentResponse.json();
        setShipments(shipmentData.shipments);
      }

      // Fetch earnings
      const earningsResponse = await fetch(`/api/drivers/${user?.id}/earnings`);
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setEarnings(earningsData.earnings);
      }
    } catch (error) {
      console.error('Failed to fetch driver data:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const response = await fetch(`/api/drivers/${user?.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !isOnline })
      });

      if (response.ok) {
        setIsOnline(!isOnline);
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const respondToJob = async (requestId: string, accepted: boolean) => {
    try {
      const response = await fetch(`/api/drivers/job-request/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted })
      });

      if (response.ok) {
        setJobRequests(prev => prev.filter(jr => jr.id !== requestId));
        fetchDriverData();
      }
    } catch (error) {
      console.error('Failed to respond to job:', error);
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: ShipmentStatus, note?: string) => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });

      if (response.ok) {
        fetchDriverData();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
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
      searching: 'Searching',
      driver_assigned: 'Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Online Status Toggle */}
      <div className={`rounded-2xl p-6 ${isOnline ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-gray-600 to-gray-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">You are currently</p>
            <h2 className="text-2xl font-bold text-white">{isOnline ? 'ONLINE' : 'OFFLINE'}</h2>
            <p className="text-white/70 text-sm mt-1">
              {isOnline ? 'Receiving job requests' : 'Toggle to start receiving jobs'}
            </p>
          </div>
          <button
            onClick={toggleOnlineStatus}
            className={`w-16 h-9 rounded-full relative transition-colors duration-300 ${
              isOnline ? 'bg-white' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-7 h-7 rounded-full transition-transform duration-300 ${
                isOnline 
                  ? 'translate-x-8 bg-green-500' 
                  : 'translate-x-1 bg-gray-500'
              }`}
            >
              <Power className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: "Today's Earnings", 
            value: `KES ${earnings?.today?.toLocaleString() || 0}`, 
            icon: DollarSign, 
            color: 'bg-green-100 text-green-600' 
          },
          { 
            label: 'Active Jobs', 
            value: shipments.filter(s => ['driver_assigned', 'picked_up', 'in_transit'].includes(s.status)).length, 
            icon: Package, 
            color: 'bg-blue-100 text-blue-600' 
          },
          { 
            label: 'Completed', 
            value: shipments.filter(s => s.status === 'delivered').length, 
            icon: CheckCircle, 
            color: 'bg-purple-100 text-purple-600' 
          },
          { 
            label: 'Rating', 
            value: (user as any)?.rating?.toFixed(1) || '0.0', 
            icon: Star, 
            color: 'bg-yellow-100 text-yellow-600' 
          }
        ].map((stat, index) => (
          <div key={index} className="card-tranzit p-4">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-[#0B1F3A]">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Job Requests */}
      {jobRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#0B1F3A] mb-4">New Job Requests</h3>
          <div className="space-y-3">
            {jobRequests.map((request) => (
              <div key={request.id} className="card-tranzit p-5 border-2 border-[#FF6B00]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-[#0B1F3A]">{request.shipment.cargo.type}</p>
                    <p className="text-sm text-gray-500">{request.shipment.cargo.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-[#FF6B00] text-white rounded-full text-sm font-bold">
                    KES {request.shipment.price.total.toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-600">{request.shipment.pickup.address}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-gray-600">{request.shipment.dropoff.address}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => respondToJob(request.id, false)}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button
                    onClick={() => respondToJob(request.id, true)}
                    className="flex-1 bg-[#FF6B00] hover:bg-[#E55F00] text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Shipments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0B1F3A]">Active Deliveries</h3>
          <button
            onClick={() => setActiveTab('shipments')}
            className="text-[#FF6B00] text-sm font-medium hover:underline flex items-center"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        {shipments.filter(s => ['driver_assigned', 'picked_up', 'in_transit'].includes(s.status)).length === 0 ? (
          <div className="card-tranzit p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active deliveries</p>
            <p className="text-sm text-gray-400 mt-1">Go online to receive job requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments
              .filter(s => ['driver_assigned', 'picked_up', 'in_transit'].includes(s.status))
              .map((shipment) => (
                <div key={shipment.id} className="card-tranzit p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                    <p className="font-bold text-[#FF6B00]">KES {shipment.price.total.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                      <p className="text-sm text-gray-600">{shipment.pickup.address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-gray-600">{shipment.dropoff.address}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    {shipment.status === 'driver_assigned' && (
                      <Button
                        onClick={() => updateShipmentStatus(shipment.id, 'picked_up', 'Arrived at pickup location')}
                        className="flex-1 bg-[#FF6B00] hover:bg-[#E55F00] text-white text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Picked Up
                      </Button>
                    )}
                    {shipment.status === 'picked_up' && (
                      <Button
                        onClick={() => updateShipmentStatus(shipment.id, 'in_transit', 'Started delivery')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Delivery
                      </Button>
                    )}
                    {shipment.status === 'in_transit' && (
                      <Button
                        onClick={() => updateShipmentStatus(shipment.id, 'delivered', 'Delivery completed')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Delivered
                      </Button>
                    )}
                    <button className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#0B1F3A]">Available Jobs</h2>
      
      {!isOnline ? (
        <div className="card-tranzit p-8 text-center">
          <Power className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">You are offline</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Go online to see available jobs</p>
          <Button
            onClick={toggleOnlineStatus}
            className="bg-[#FF6B00] hover:bg-[#E55F00] text-white"
          >
            Go Online
          </Button>
        </div>
      ) : jobRequests.length === 0 ? (
        <div className="card-tranzit p-8 text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No available jobs nearby</p>
          <p className="text-sm text-gray-400 mt-1">Jobs will appear here when available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobRequests.map((request) => (
            <div key={request.id} className="card-tranzit p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-[#0B1F3A]">{request.shipment.cargo.type}</p>
                  <p className="text-sm text-gray-500">{request.shipment.cargo.description}</p>
                </div>
                <span className="px-3 py-1 bg-[#FF6B00] text-white rounded-full text-sm font-bold">
                  KES {request.shipment.price.total.toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="text-sm text-gray-700">{request.shipment.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Dropoff</p>
                    <p className="text-sm text-gray-700">{request.shipment.dropoff.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {request.shipment.cargo.weight} kg
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(request.expiresAt).getTime() - Date.now() > 0 
                    ? Math.floor((new Date(request.expiresAt).getTime() - Date.now()) / 60000) 
                    : 0} min left
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => respondToJob(request.id, false)}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  onClick={() => respondToJob(request.id, true)}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#E55F00] text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderShipments = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#0B1F3A]">My Deliveries</h2>
      
      {shipments.length === 0 ? (
        <div className="card-tranzit p-8 text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No deliveries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment) => (
            <div key={shipment.id} className="card-tranzit p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-[#0B1F3A]">{shipment.cargo.type}</p>
                  <p className="text-sm text-gray-500">{shipment.cargo.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                  {getStatusLabel(shipment.status)}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-600">{shipment.pickup.address}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-gray-600">{shipment.dropoff.address}</p>
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

  const renderEarnings = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#0B1F3A]">My Earnings</h2>
      
      {/* Total Earnings Card */}
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm">Total Earnings</p>
            <h3 className="text-3xl font-bold">KES {earnings?.total?.toLocaleString() || 0}</h3>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
            <Wallet className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm">+12% from last month</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-tranzit p-5">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#0B1F3A]">KES {earnings?.today?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">Today's Earnings</p>
        </div>
        <div className="card-tranzit p-5">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[#0B1F3A]">KES {earnings?.thisWeek?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">This Week</p>
        </div>
        <div className="card-tranzit p-5">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[#0B1F3A]">KES {earnings?.thisMonth?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">This Month</p>
        </div>
        <div className="card-tranzit p-5">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-[#0B1F3A]">KES {earnings?.pending?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="font-semibold text-[#0B1F3A] mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {shipments
            .filter(s => s.status === 'delivered')
            .slice(0, 5)
            .map((shipment) => (
              <div key={shipment.id} className="card-tranzit p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0B1F3A]">{shipment.cargo.type}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-green-600">
                  +KES {Math.round(shipment.price.total * 0.85).toLocaleString()}
                </p>
              </div>
            ))}
        </div>
      </div>
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
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                {(user as any)?.tier} Driver
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {(user as any)?.rating?.toFixed(1) || '0.0'}
              </span>
            </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
            <input 
              type="text" 
              value={(user as any)?.licenseNumber || 'Not provided'} 
              disabled 
              className="input-tranzit bg-gray-50" 
            />
          </div>
        </div>
      </div>
      
      {/* Vehicle Info */}
      <div className="card-tranzit p-6">
        <h3 className="font-semibold text-[#0B1F3A] mb-4">Vehicle Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <input 
              type="text" 
              value={(user as any)?.vehicle?.type || 'Not specified'} 
              disabled 
              className="input-tranzit bg-gray-50" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
            <input 
              type="text" 
              value={(user as any)?.vehicle?.registrationNumber || 'Not provided'} 
              disabled 
              className="input-tranzit bg-gray-50" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make & Model</label>
            <input 
              type="text" 
              value={`${(user as any)?.vehicle?.make || ''} ${(user as any)?.vehicle?.model || ''}`} 
              disabled 
              className="input-tranzit bg-gray-50" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input 
              type="text" 
              value={(user as any)?.vehicle?.year || 'Not provided'} 
              disabled 
              className="input-tranzit bg-gray-50" 
            />
          </div>
        </div>
      </div>
      
      {/* Driver Stats */}
      <div className="card-tranzit p-6">
        <h3 className="font-semibold text-[#0B1F3A] mb-4">Performance Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-[#0B1F3A]">{(user as any)?.totalDeliveries || 0}</p>
            <p className="text-sm text-gray-500">Total Deliveries</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-[#0B1F3A]">{(user as any)?.acceptanceRate || 0}%</p>
            <p className="text-sm text-gray-500">Acceptance Rate</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-[#0B1F3A]">{(user as any)?.rating?.toFixed(1) || '0.0'}</p>
            <p className="text-sm text-gray-500">Rating</p>
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
              <span className="text-xl font-bold text-[#0B1F3A]">Tranzit Driver</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                {(notifications > 0 || jobRequests.length > 0) && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF6B00] text-white text-xs rounded-full flex items-center justify-center">
                    {notifications + jobRequests.length}
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
                { id: 'jobs', label: 'Available Jobs', icon: Truck, badge: jobRequests.length },
                { id: 'shipments', label: 'My Deliveries', icon: CheckCircle },
                { id: 'earnings', label: 'Earnings', icon: DollarSign },
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
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'jobs' && renderJobs()}
            {activeTab === 'shipments' && renderShipments()}
            {activeTab === 'earnings' && renderEarnings()}
            {activeTab === 'profile' && renderProfile()}
          </main>
        </div>
      </div>
    </div>
  );
}
