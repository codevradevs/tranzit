import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tranzit_dev_secret_key_change_in_production';

router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, role, businessName, businessType, vehicle } = req.body;
    if (db.getUserByPhone(phone)) return res.status(400).json({ error: 'User with this phone number already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `${role}_${uuidv4().split('-')[0]}`;
    const base = { id: userId, name, phone, email, role, createdAt: new Date().toISOString(), isVerified: false };

    let newUser: any;
    if (role === 'shipper') {
      newUser = { ...base, businessName: businessName || name, businessType: businessType || 'Individual', rating: 0, totalShipments: 0 };
    } else if (role === 'driver') {
      newUser = { ...base, vehicle: vehicle || { id: `veh_${uuidv4().split('-')[0]}`, type: 'pickup', make: '', model: '', year: new Date().getFullYear(), registrationNumber: '', capacity: { weight: 0, volume: 0 }, photos: [] }, licenseNumber: '', isOnline: false, rating: 0, totalDeliveries: 0, earnings: 0, acceptanceRate: 100, tier: 'bronze' };
    } else {
      newUser = base;
    }

    newUser.password = hashedPassword;
    db.createUser(newUser);

    const token = jwt.sign({ userId: newUser.id, role: newUser.role, phone: newUser.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'User registered successfully', user: newUser, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = db.getUserByPhone(phone);
    if (!user) return res.status(401).json({ error: 'Invalid phone number or password' });

    const storedPassword = (user as any).password;
    if (!storedPassword || !(await bcrypt.compare(password, storedPassword))) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUser(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUser(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.put('/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const updatedUser = db.updateUser(decoded.userId, req.body);
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ user: updatedUser });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/demo-login', (req, res) => {
  try {
    const { role } = req.body;
    const idMap: Record<string, string> = { shipper: 'shipper_1', driver: 'driver_1', admin: 'admin_1' };
    const user = db.getUser(idMap[role]);
    if (!user) return res.status(404).json({ error: 'Demo user not found' });
    const token = jwt.sign({ userId: user.id, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Demo login successful', user, token });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

export default router;
