import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';

const router = Router();

router.post('/mpesa/stk-push', async (req, res) => {
  try {
    const { phoneNumber, shipmentId } = req.body;
    if (!phoneNumber?.match(/^254[0-9]{9}$/)) return res.status(400).json({ error: 'Invalid phone number. Use format: 2547XXXXXXXX' });
    await new Promise(r => setTimeout(r, 1500));
    const transactionId = `MPESA${Date.now()}`;
    const shipment = db.getShipment(shipmentId);
    if (shipment) db.updateShipment(shipmentId, { payment: { ...shipment.payment, status: 'processing', transactionId } });
    res.json({ success: true, message: 'STK push sent successfully', checkoutRequestId: `ws_${uuidv4()}`, transactionId, responseCode: '0', customerMessage: 'Enter your M-Pesa PIN to complete the payment' });
  } catch { res.status(500).json({ error: 'Failed to initiate payment' }); }
});

router.get('/mpesa/status/:checkoutRequestId', async (req, res) => {
  try {
    await new Promise(r => setTimeout(r, 1000));
    if (Math.random() > 0.2) {
      res.json({ success: true, resultCode: '0', resultDesc: 'The service request is processed successfully.', mpesaReceiptNumber: `SHP${Date.now()}` });
    } else {
      res.json({ success: false, resultCode: '1', resultDesc: 'Transaction cancelled by user' });
    }
  } catch { res.status(500).json({ error: 'Failed to check payment status' }); }
});

router.post('/mpesa/confirm', (req, res) => {
  try {
    const { shipmentId, transactionId, mpesaReceiptNumber } = req.body;
    const shipment = db.getShipment(shipmentId);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    db.updateShipment(shipmentId, {
      payment: { ...shipment.payment, status: 'escrowed', transactionId: mpesaReceiptNumber || transactionId, paidAt: new Date().toISOString(), escrowHeld: true },
      status: 'searching',
      timeline: [...shipment.timeline, { status: 'searching', timestamp: new Date().toISOString(), note: 'Payment held in escrow. Searching for driver.' }]
    });
    res.json({ success: true, message: 'Payment held in escrow. Will be released to driver upon delivery confirmation.' });
  } catch { res.status(500).json({ error: 'Failed to confirm payment' }); }
});

router.post('/refund', (req, res) => {
  try {
    const shipment = db.getShipment(req.body.shipmentId);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    if (shipment.payment.status !== 'completed') return res.status(400).json({ error: 'No payment to refund' });
    res.json({ success: true, message: 'Refund processed successfully', refundId: `RFD${Date.now()}`, amount: shipment.price.total });
  } catch { res.status(500).json({ error: 'Failed to process refund' }); }
});

router.get('/methods', (_req, res) => {
  res.json({ methods: [
    { id: 'mpesa', name: 'M-Pesa', description: 'Pay via M-Pesa STK Push', isAvailable: true },
    { id: 'cash', name: 'Cash on Delivery', description: 'Pay driver upon delivery', isAvailable: true },
    { id: 'wallet', name: 'Tranzit Wallet', description: 'Pay from your Tranzit wallet', isAvailable: false }
  ]});
});

export default router;
