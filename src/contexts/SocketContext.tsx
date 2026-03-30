import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (userId: string, role: string) => void;
  updateLocation: (shipmentId: string, location: any) => void;
  updateShipmentStatus: (shipmentId: string, status: string, note?: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // In dev Vite runs on 5173, backend on 3001 — connect directly to backend
    const socketUrl = import.meta.env.DEV ? 'http://localhost:3005' : window.location.origin;
    const newSocket = io(socketUrl, { transports: ['websocket', 'polling'] });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user) {
        newSocket.emit('join', { userId: user.id, role: user.role });
      }
    });

    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('connect_error', () => setIsConnected(false));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Re-join room when user changes
  useEffect(() => {
    if (socket && isConnected && user) {
      socket.emit('join', { userId: user.id, role: user.role });
    }
  }, [user, isConnected, socket]);

  const joinRoom = (userId: string, role: string) => {
    socket?.emit('join', { userId, role });
  };

  const updateLocation = (shipmentId: string, location: any) => {
    if (socket && user) {
      socket.emit('location:update', { shipmentId, location, driverId: user.id });
    }
  };

  const updateShipmentStatus = (shipmentId: string, status: string, note?: string) => {
    socket?.emit('shipment:status', { shipmentId, status, note });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRoom, updateLocation, updateShipmentStatus }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
