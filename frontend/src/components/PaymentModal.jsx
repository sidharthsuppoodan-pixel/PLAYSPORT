import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { paymentsAPI } from '../services/api';
import { loadRazorpayScript, openRazorpayCheckout } from '../services/razorpay';
import { useAuth } from '../context/AuthContext';

const PaymentModal = ({
  isOpen,
  onClose,
  type = 'turf', // 'turf' or 'equipment'
  orderDetails = {},
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState('razorpay'); // 'razorpay', 'upi_qr', 'card', 'cash'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: user?.full_name || '',
    expiry: '',
    cvv: ''
  });
  const [razorpayConfig, setRazorpayConfig] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setLoading(false);
      // Preload Razorpay script
      loadRazorpayScript();
      // Fetch gateway configuration
      paymentsAPI.getConfig()
        .then(res => setRazorpayConfig(res.data))
        .catch(err => console.warn('Could not fetch Razorpay config:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = orderDetails.totalAmount || 0;
  const isMock = razorpayConfig?.is_mock || false;

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    setCardDetails(prev => ({ ...prev, number: val }));
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setCardDetails(prev => ({ ...prev, expiry: val }));
  };

  const executeFulfillment = async ({ orderId, paymentId, signature, paymentMethod }) => {
    setLoading(true);
    setErrorMessage('');
    try {
      let res;
      if (type === 'turf') {
        const payload = {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          payment_method: paymentMethod || 'UPI',
          turf_id: orderDetails.turfId,
          ground_id: orderDetails.groundId,
          booking_date: orderDetails.bookingDate,
          slot_ids: orderDetails.slotIds,
          customer_notes: orderDetails.customerNotes || 'Booked via PLAYSPORT Checkout',
          equipment_rentals: orderDetails.equipmentRentals
        };
        res = await paymentsAPI.verifyTurfBooking(payload);
      } else {
        // Standalone equipment rental
        const payload = {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          payment_method: paymentMethod || 'UPI',
          turf_id: orderDetails.turfId,
          items: orderDetails.items,
          rental_date: orderDetails.rentalDate,
          hours: orderDetails.hours || 1,
          customer_notes: orderDetails.customerNotes || 'Standalone equipment rental reservation'
        };
        res = await paymentsAPI.verifyEquipmentRental(payload);
      }

      setLoading(false);
      onClose();
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }
    } catch (err) {
      console.error('Payment verification failed:', err);
      setErrorMessage(
        err.response?.data?.detail || 'Payment verification failed. Please check your details and try again.'
      );
      setLoading(false);
    }
  };

  const handleProceedPayment = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Create Order on Backend
      let orderRes;
      if (type === 'turf') {
        orderRes = await paymentsAPI.createTurfOrder({
          turf_id: orderDetails.turfId,
          ground_id: orderDetails.groundId,
          booking_date: orderDetails.bookingDate,
          slot_ids: orderDetails.slotIds,
          equipment_rentals: orderDetails.equipmentRentals
        });
      } else {
        orderRes = await paymentsAPI.createEquipmentOrder({
          turf_id: orderDetails.turfId,
          items: orderDetails.items,
          rental_date: orderDetails.rentalDate,
          hours: orderDetails.hours || 1
        });
      }

      const orderData = orderRes.data;

      // 2. Route based on selected method
      if (selectedMethod === 'razorpay') {
        setLoading(false);
        await openRazorpayCheckout({
          orderId: orderData.order_id,
          amountPaise: orderData.amount,
          keyId: orderData.key_id,
          currency: orderData.currency,
          name: 'PLAYSPORT Sports Facility',
          description: orderData.title,
          user: user || {},
          onSuccess: async (rzpResponse) => {
            await executeFulfillment({
              orderId: rzpResponse.razorpay_order_id,
              paymentId: rzpResponse.razorpay_payment_id,
              signature: rzpResponse.razorpay_signature,
              paymentMethod: 'UPI'
            });
          },
          onFailure: (err) => {
            setErrorMessage(err.description || err.message || 'Payment was cancelled or declined.');
            setLoading(false);
          },
          onDismiss: () => {
            setLoading(false);
          }
        });
      } else if (selectedMethod === 'upi_qr') {
        // UPI Direct Verification
        await new Promise(r => setTimeout(r, 1000));
        await executeFulfillment({
          orderId: orderData.order_id,
          paymentId: `pay_upi_${Date.now().toString().slice(-8)}`,
          signature: 'mock_signature_verified',
          paymentMethod: 'UPI'
        });
      } else if (selectedMethod === 'card') {
        // Card validation
        if (cardDetails.number.replace(/\s/g, '').length < 16) {
          setErrorMessage('Please enter a valid 16-digit card number.');
          setLoading(false);
          return;
        }
        if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
          setErrorMessage('Please enter a valid MM/YY expiry date.');
          setLoading(false);
          return;
        }
        if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
          setErrorMessage('Please enter a valid 3-digit CVV.');
          setLoading(false);
          return;
        }
        await new Promise(r => setTimeout(r, 1100));
        await executeFulfillment({
          orderId: orderData.order_id,
          paymentId: `pay_card_${Date.now().toString().slice(-8)}`,
          signature: 'mock_signature_verified',
          paymentMethod: 'CARD'
        });
      } else if (selectedMethod === 'cash') {
        // Pay at Venue
        await new Promise(r => setTimeout(r, 600));
        await executeFulfillment({
          orderId: orderData.order_id,
          paymentId: `pay_cash_${Date.now().toString().slice(-8)}`,
          signature: 'mock_signature_verified',
          paymentMethod: 'CASH'
        });
      }
    } catch (err) {
      console.error('Order creation failed:', err);
      setErrorMessage(
        err.response?.data?.detail || 'Failed to initialize payment order. Slot or equipment may be unavailable.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative fade-in flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Checkout & Payment
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Razorpay Verified
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">256-bit SSL encrypted & authenticated checkout</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Order Summary Card */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                  {type === 'turf' ? '🏟️ Turf Reservation' : '🎽 Sports Gear Rental'}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {orderDetails.turfName || 'PLAYSPORT Sports Arena'}
                </h4>
                {orderDetails.groundName && (
                  <p className="text-[11px] text-slate-500 font-medium">{orderDetails.groundName}</p>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Payable</span>
                <span className="text-lg font-black text-brand-700">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Schedule & Items Details */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 font-medium block">Date</span>
                <span className="font-bold text-slate-800">{orderDetails.bookingDate || orderDetails.rentalDate || 'Today'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Schedule / Duration</span>
                <span className="font-bold text-slate-800">
                  {type === 'turf' 
                    ? `${orderDetails.slotCount || 1} Slot(s)` 
                    : `${orderDetails.hours || 1} Hour(s) Session`}
                </span>
              </div>
            </div>

            {/* Equipment Add-on List if present */}
            {orderDetails.equipmentItems && orderDetails.equipmentItems.length > 0 && (
              <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                <span className="font-semibold text-slate-500">Rented Gear:</span>
                <div className="space-y-0.5 pl-2 text-slate-700">
                  {orderDetails.equipmentItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-bold text-slate-900">₹{item.totalPrice || item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Choose Payment Method
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Option 1: Razorpay Fast Checkout */}
              <button
                type="button"
                onClick={() => setSelectedMethod('razorpay')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  selectedMethod === 'razorpay'
                    ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  rzp
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">Razorpay Online</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-brand-100 text-brand-800">
                      Popular
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">UPI, GPay, PhonePe, Cards, NetBanking</p>
                </div>
              </button>

              {/* Option 2: Direct UPI QR Code */}
              <button
                type="button"
                onClick={() => setSelectedMethod('upi_qr')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  selectedMethod === 'upi_qr'
                    ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">UPI / Scan & Pay</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Instant QR code & UPI ID transfer</p>
                </div>
              </button>

              {/* Option 3: Credit or Debit Card */}
              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  selectedMethod === 'card'
                    ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Credit / Debit Card</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Visa, Mastercard, RuPay cards</p>
                </div>
              </button>

              {/* Option 4: Pay at Turf Reception */}
              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  selectedMethod === 'cash'
                    ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Pay at Turf Venue</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Cash or POS swipe at reception</p>
                </div>
              </button>

            </div>
          </div>

          {/* Dynamic Payment Option Forms */}
          {selectedMethod === 'upi_qr' && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center text-center">
                  <QrCode className="w-20 h-20 text-slate-800" />
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Scan with any UPI App
                  </span>
                  <p className="font-bold text-slate-900 text-xs">
                    UPI ID: <span className="font-mono text-brand-700">playsport.arena@upi</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Supports Google Pay, PhonePe, Paytm, BHIM, Cred, and all Indian banking apps.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={handleCardNumberChange}
                    placeholder="4532 •••• •••• 8892"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-brand-500 pl-9"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardDetails.expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                    placeholder="•••"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'cash' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Building2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Pay on Arrival</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Your reservation reference will be generated immediately. Please pay ₹{totalAmount.toFixed(2)} at the turf desk 15 minutes before your slot begins.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Security Guarantee Notice */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>End-to-end encrypted • Razorpay payment gateway protection</span>
          </div>

        </div>

        {/* Modal Footer / Action Button */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleProceedPayment}
            disabled={loading}
            className="flex-1 py-3 px-5 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-brand-700/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <span>Pay ₹{totalAmount.toFixed(2)} & Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
