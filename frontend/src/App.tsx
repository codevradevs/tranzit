import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { LoginPage } from './components/common/LoginPage';
import { RegisterPage } from './components/common/RegisterPage';
import { ShipperDashboard } from './components/shipper/ShipperDashboard';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LandingPage } from './components/common/LandingPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');

  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, user]);

  const handleNavigate = (view: 'landing' | 'login' | 'register') => {
    setCurrentView(view);
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1F3A] to-[#1a3a5c]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FF6B00] animate-spin mx-auto mb-4" />
          <p className="text-white/80 text-sm">Loading Tranzit...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated
  if (isAuthenticated && user) {
    return (
      <SocketProvider>
        {user.role === 'shipper' && <ShipperDashboard />}
        {user.role === 'driver' && <DriverDashboard />}
        {user.role === 'admin' && <AdminDashboard />}
      </SocketProvider>
    );
  }

  // Show auth screens
  switch (currentView) {
    case 'login':
      return <LoginPage onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
    case 'register':
      return <RegisterPage onNavigate={handleNavigate} onRegisterSuccess={handleLoginSuccess} />;
    case 'landing':
    default:
      return <LandingPage onNavigate={handleNavigate} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
