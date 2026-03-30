import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tranzit_dev_secret_key_change_in_production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, role, businessName, businessType, vehicle } = req.body;

    // Check if user exists
    const existingUser = db.getUserByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user based on role
    const userId = `${role}_${uuidv4().split('-')[0]}`;
    const baseUser = {
      id: userId,
      name,
      phone,
      email,
      role,
      createdAt: new Date().toISOString(),
      isVerified: false
    };

    let newUser;
    if (role === 'shipper') {
      newUser = {
        ...baseUser,
        businessName: businessName || name,
        businessType: businessType || 'Individual',
        rating: 0,
        totalShipments: 0
      };
    } else if (role === 'driver') {
      newUser = {
        ...baseUser,
        vehicle: vehicle || {
          id: `veh_${uuidv4().split('-')[0]}`,
          type: 'pickup',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          registrationNumber: '',
          capacity: { weight: 0, volume: 0 },
          photos: []
        },
        licenseNumber: '',
        isOnline: false,
        rating: 0,
        totalDeliveries: 0,
        earnings: 0,
        acceptanceRate: 100,
        tier: 'bronze'
      };
    } else {
      newUser = baseUser;
    }

    // Store hashed password on user object
    (newUser as any).password = hashedPassword;
    db.createUser(newUser);

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, phone: newUser.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = db.getUserByPhone(phone);
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const storedPassword = (user as any).password;
    if (!storedPassword) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }
    const isValidPassword = await bcrypt.compare(password, storedPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUser(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update profile
router.put('/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const updates = req.body;

    const updatedUser = db.updateUser(decoded.userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Demo login (for quick testing)
router.post('/demo-login', (req, res) => {
  try {
    const { role } = req.body;
    
    let user;
    if (role === 'shipper') {
      user = db.getUser('shipper_1');
    } else if (role === 'driver') {
      user = db.getUser('driver_1');
    } else if (role === 'admin') {
      user = db.getUser('admin_1');
    }

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Demo login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

export default router;
