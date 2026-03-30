import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';

const router = Router();

// M-Pesa STK Push simulation
router.post('/mpesa/stk-push', async (req, res) => {
  try {
    const { phoneNumber, amount, shipmentId, accountReference } = req.body;
    
    // Validate phone number
    if (!phoneNumber || !phoneNumber.match(/^254[0-9]{9}$/)) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Use format: 2547XXXXXXXX' 
      });
    }
    
    // Simulate STK push delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const transactionId = `MPESA${Date.now()}`;
    const checkoutRequestId = `ws_${uuidv4()}`;
    
    // Update shipment payment status
    const shipment = db.getShipment(shipmentId);
    if (shipment) {
      db.updateShipment(shipmentId, {
        payment: {
          ...shipment.payment,
          status: 'processing',
          transactionId
        }
      });
    }
    
    res.json({
      success: true,
      message: 'STK push sent successfully',
      checkoutRequestId,
      transactionId,
      responseCode: '0',
      responseDescription: 'Success. Request accepted for processing',
      customerMessage: 'Enter your M-Pesa PIN to complete the payment'
    });
  } catch (error) {
    console.error('M-Pesa STK push error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Check payment status
router.get('/mpesa/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    
    // Simulate status check delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate successful payment (80% success rate)
    const isSuccess = Math.random() > 0.2;
    
    if (isSuccess) {
      res.json({
        success: true,
        resultCode: '0',
        resultDesc: 'The service request is processed successfully.',
        amount: 1000,
        mpesaReceiptNumber: `SHP${Date.now()}`,
        transactionDate: new Date().toISOString(),
        phoneNumber: '254712345678'
      });
    } else {
      res.json({
        success: false,
        resultCode: '1',
        resultDesc: 'Transaction cancelled by user'
      });
    }
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Confirm payment (callback simulation)
router.post('/mpesa/confirm', (req, res) => {
  try {
    const { shipmentId, transactionId, mpesaReceiptNumber } = req.body;
    
    const shipment = db.getShipment(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    db.updateShipment(shipmentId, {
      payment: {
        ...shipment.payment,
        status: 'escrowed',
        transactionId: mpesaReceiptNumber || transactionId,
        paidAt: new Date().toISOString(),
        escrowHeld: true
      },
      status: 'searching',
      timeline: [
        ...shipment.timeline,
        { status: 'searching', timestamp: new Date().toISOString(), note: 'Payment held in escrow. Searching for driver.' }
      ]
    });

    res.json({
      success: true,
      message: 'Payment held in escrow. Will be released to driver upon delivery confirmation.'
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Process refund
router.post('/refund', (req, res) => {
  try {
    const { shipmentId, reason } = req.body;
    
    const shipment = db.getShipment(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    if (shipment.payment.status !== 'completed') {
      return res.status(400).json({ error: 'No payment to refund' });
    }
    
    const refundId = `RFD${Date.now()}`;
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundId,
      amount: shipment.price.total,
      reason
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get payment methods
router.get('/methods', (req, res) => {
  res.json({
    methods: [
      {
        id: 'mpesa',
        name: 'M-Pesa',
        description: 'Pay via M-Pesa STK Push',
        icon: '/icons/mpesa.svg',
        isAvailable: true
      },
      {
        id: 'cash',
        name: 'Cash on Delivery',
        description: 'Pay driver upon delivery',
        icon: '/icons/cash.svg',
        isAvailable: true
      },
      {
        id: 'wallet',
        name: 'Tranzit Wallet',
        description: 'Pay from your Tranzit wallet',
        icon: '/icons/wallet.svg',
        isAvailable: false
      }
    ]
  });
});

export default router;
