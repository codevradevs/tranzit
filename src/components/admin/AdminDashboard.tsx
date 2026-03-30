import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Truck, Package, DollarSign, 
  LogOut, MapPin, Bell, Search, Filter,
  TrendingUp, TrendingDown, Activity,
  CheckCircle, Clock, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'shipments' | 'tracking' | 'analytics'>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUsers(data.recentUsers);
        setShipments(data.recentShipments);
      }

      // Fetch revenue analytics
      const revenueResponse = await fetch('/api/admin/analytics/revenue?period=day');
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setRevenueData(revenueData.chartData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
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
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0B1F3A]">Dashboard Overview</h2>
          <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { 
            label: 'Total Shipments', 
            value: stats?.totalShipments || 0, 
            icon: Package, 
            color: 'bg-blue-100 text-blue-600',
            trend: '+12%'
          },
          { 
            label: 'Active', 
            value: stats?.activeShipments || 0, 
            icon: Activity, 
            color: 'bg-orange-100 text-orange-600',
            trend: '+5%'
          },
          { 
            label: 'Completed', 
            value: stats?.completedShipments || 0, 
            icon: CheckCircle, 
            color: 'bg-green-100 text-green-600',
            trend: '+18%'
          },
          { 
            label: 'Revenue', 
            value: `KES ${(stats?.totalRevenue || 0).toLocaleString()}`, 
            icon: DollarSign, 
            color: 'bg-purple-100 text-purple-600',
            trend: '+24%'
          },
          { 
            label: 'Active Drivers', 
            value: stats?.activeDrivers || 0, 
            icon: Truck, 
            color: 'bg-cyan-100 text-cyan-600',
            trend: '+8%'
          },
          { 
            label: 'Pending', 
            value: stats?.pendingDeliveries || 0, 
            icon: Clock, 
            color: 'bg-yellow-100 text-yellow-600',
            trend: '-3%'
          }
        ].map((stat, index) => (
          <div key={index} className="card-tranzit p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-xl font-bold text-[#0B1F3A]">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card-tranzit p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#0B1F3A]">Revenue Overview</h3>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#FF6B00" 
                  strokeWidth={2}
                  dot={{ fill: '#FF6B00', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shipment Status Distribution */}
        <div className="card-tranzit p-6">
          <h3 className="font-semibold text-[#0B1F3A] mb-6">Shipment Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Delivered', value: stats?.completedShipments || 0, color: '#22c55e' },
                    { name: 'In Transit', value: stats?.activeShipments || 0, color: '#f97316' },
                    { name: 'Pending', value: stats?.pendingDeliveries || 0, color: '#eab308' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Delivered', value: stats?.completedShipments || 0, color: '#22c55e' },
                    { name: 'In Transit', value: stats?.activeShipments || 0, color: '#f97316' },
                    { name: 'Pending', value: stats?.pendingDeliveries || 0, color: '#eab308' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {[
              { label: 'Delivered', color: '#22c55e', value: stats?.completedShipments || 0 },
              { label: 'In Transit', color: '#f97316', value: stats?.activeShipments || 0 },
              { label: 'Pending', color: '#eab308', value: stats?.pendingDeliveries || 0 }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.label} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Shipments */}
        <div className="card-tranzit p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#0B1F3A]">Recent Shipments</h3>
            <button 
              onClick={() => setActiveTab('shipments')}
              className="text-[#FF6B00] text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {shipments.slice(0, 5).map((shipment: any) => (
              <div key={shipment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0B1F3A] text-sm">{shipment.cargo.type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                    {getStatusLabel(shipment.status)}
                  </span>
                  <p className="text-sm font-semibold text-[#0B1F3A] mt-1">
                    KES {shipment.price.total.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card-tranzit p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#0B1F3A]">Recent Users</h3>
            <button 
              onClick={() => setActiveTab('users')}
              className="text-[#FF6B00] text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0B1F3A] to-[#1a3a5c] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[#0B1F3A] text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0B1F3A]">User Management</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="card-tranzit overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0B1F3A] to-[#1a3a5c] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#0B1F3A]">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    user.role === 'driver' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'shipper' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderShipments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0B1F3A]">All Shipments</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shipments..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
          <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#FF6B00]">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {shipments.map((shipment: any) => (
          <div key={shipment.id} className="card-tranzit p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-[#0B1F3A]">{shipment.cargo.type}</p>
                  <p className="text-sm text-gray-500">ID: {shipment.id}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                {getStatusLabel(shipment.status)}
              </span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Pickup</p>
                  <p className="text-sm text-[#0B1F3A]">{shipment.pickup.address}</p>
                  <p className="text-xs text-gray-500">{shipment.pickup.contactPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Dropoff</p>
                  <p className="text-sm text-[#0B1F3A]">{shipment.dropoff.address}</p>
                  <p className="text-xs text-gray-500">{shipment.dropoff.contactPhone}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {new Date(shipment.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm text-gray-500">
                  <Package className="w-4 h-4 inline mr-1" />
                  {shipment.cargo.weight} kg
                </span>
                {shipment.driverId && (
                  <span className="text-sm text-gray-500">
                    <Truck className="w-4 h-4 inline mr-1" />
                    Driver: {shipment.driverId}
                  </span>
                )}
              </div>
              <p className="font-bold text-[#FF6B00]">
                KES {shipment.price.total.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTracking = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#0B1F3A]">Live Tracking</h2>
      
      <div className="card-tranzit p-6">
        <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Map view would be displayed here</p>
            <p className="text-sm text-gray-400 mt-1">Integrate Google Maps for real-time tracking</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {shipments
          .filter((s: any) => ['searching', 'driver_assigned', 'picked_up', 'in_transit'].includes(s.status))
          .map((shipment: any) => (
            <div key={shipment.id} className="card-tranzit p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#0B1F3A]">{shipment.id}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                  {getStatusLabel(shipment.status)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <MapPin className="w-4 h-4 inline mr-1 text-green-600" />
                  {shipment.pickup.address.substring(0, 30)}...
                </p>
                <p className="text-gray-600">
                  <MapPin className="w-4 h-4 inline mr-1 text-red-600" />
                  {shipment.dropoff.address.substring(0, 30)}...
                </p>
              </div>
              {shipment.driverId && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">{shipment.driverId}</span>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#0B1F3A]">Analytics & Reports</h2>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-tranzit p-6">
          <h3 className="font-semibold text-[#0B1F3A] mb-6">Daily Revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="amount" fill="#FF6B00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-tranzit p-6">
          <h3 className="font-semibold text-[#0B1F3A] mb-6">Key Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'Average Delivery Time', value: '45 min', trend: '-5%', positive: true },
              { label: 'Driver Acceptance Rate', value: '92%', trend: '+3%', positive: true },
              { label: 'Customer Satisfaction', value: '4.8/5', trend: '+0.2', positive: true },
              { label: 'Cancellation Rate', value: '3%', trend: '-1%', positive: true }
            ].map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <p className="text-xl font-bold text-[#0B1F3A]">{metric.value}</p>
                </div>
                <div className={`flex items-center gap-1 ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">{metric.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
              <span className="text-xl font-bold text-[#0B1F3A]">Tranzit Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF6B00] text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0B1F3A] to-[#1a3a5c] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{user?.name?.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
              </div>
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
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'shipments', label: 'Shipments', icon: Package },
                { id: 'tracking', label: 'Live Tracking', icon: MapPin },
                { id: 'analytics', label: 'Analytics', icon: Activity }
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
              <div className="border-t border-gray-200 my-2" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'shipments' && renderShipments()}
                {activeTab === 'tracking' && renderTracking()}
                {activeTab === 'analytics' && renderAnalytics()}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
