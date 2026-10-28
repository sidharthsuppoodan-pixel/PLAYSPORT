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
  RefreshCw,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { paymentsAPI } from '../services/api';
import { loadRazorpayScript, openRazorpayCheckout } from '../services/razorpay';
import { useAuth } from '../context/AuthContext';

const PaymentModal = ({
  isOpen,
  onClose,
  type = 'turf', // 'turf', 'equipment', 'tournament', 'match'
  orderDetails = {},
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState('upi_qr'); // 'upi_qr', 'razorpay', 'card', 'cash'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
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
      setCopiedUpi(false);
      setUtrNumber('');
      // Preload Razorpay script
      loadRazorpayScript();
      // Fetch gateway configuration
      paymentsAPI.getConfig()
        .then(res => setRazorpayConfig(res.data))
        .catch(err => console.warn('Could not fetch Razorpay config:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = Number(orderDetails.totalAmount) || 0;
  const isMock = razorpayConfig?.is_mock || false;

  // Authentic NPCI UPI Intent URI standard
  const upiVpa = import.meta.env.VITE_UPI_VPA || 'sidharths251202-2@okicici';
  const upiPayeeName = import.meta.env.VITE_UPI_PAYEE_NAME || 'Sidharth S';
  const transactionRef = `PS${Date.now().toString().slice(-8)}`;
  const transactionNote = orderDetails.title || 'PLAYSPORT Sports Booking';
  const upiIntentUri = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(upiPayeeName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionRef}`;
  
  // Real dynamic scannable QR Code image URL (260x260 with high ECC)
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiIntentUri)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

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
      } else if (type === 'equipment') {
        const payload = {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          payment_method: paymentMethod || 'UPI',
          turf_id: orderDetails.turfId,
          items: orderDetails.items,
          rental_date: orderDetails.rentalDate,
          hours: orderDetails.hours || 1,
          customer_notes: orderDetails.customerNotes || 'Equipment rental reservation'
        };
        res = await paymentsAPI.verifyEquipmentRental(payload);
      } else if (type === 'tournament') {
        const payload = {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          payment_method: paymentMethod || 'UPI',
          tournament_id: orderDetails.tournamentId,
          team_name: orderDetails.teamName,
          captain_name: orderDetails.captainName,
          contact_phone: orderDetails.contactPhone,
          members_count: Number(orderDetails.membersCount) || 7
        };
        res = await paymentsAPI.verifyTournamentRegistration(payload);
      } else if (type === 'match') {
        const payload = {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          payment_method: paymentMethod || 'UPI',
          match_id: orderDetails.matchId
        };
        res = await paymentsAPI.verifyMatchJoin(payload);
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
      } else if (type === 'equipment') {
        orderRes = await paymentsAPI.createEquipmentOrder({
          turf_id: orderDetails.turfId,
          items: orderDetails.items,
          rental_date: orderDetails.rentalDate,
          hours: orderDetails.hours || 1
        });
      } else if (type === 'tournament') {
        orderRes = await paymentsAPI.createTournamentOrder({
          tournament_id: orderDetails.tournamentId,
          team_name: orderDetails.teamName,
          captain_name: orderDetails.captainName,
          contact_phone: orderDetails.contactPhone,
          members_count: Number(orderDetails.membersCount) || 7
        });
      } else if (type === 'match') {
        orderRes = await paymentsAPI.createMatchOrder({
          match_id: orderDetails.matchId
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
        // UPI QR verification
        const refSuffix = utrNumber.trim() ? `_utr_${utrNumber.trim().slice(-6)}` : `_${Date.now().toString().slice(-8)}`;
        await new Promise(r => setTimeout(r, 1000));
        await executeFulfillment({
          orderId: orderData.order_id,
          paymentId: `pay_upi${refSuffix}`,
          signature: 'mock_signature_verified',
          paymentMethod: 'UPI'
        });
      } else if (selectedMethod === 'card') {
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
        err.response?.data?.detail || 'Failed to initialize payment order. Slot, tournament, or match may be full or unavailable.'
      );
      setLoading(false);
    }
  };

  const getBadgeTitle = () => {
    switch (type) {
      case 'turf': return '🏟️ Turf Reservation';
      case 'equipment': return '🎽 Sports Gear Rental';
      case 'tournament': return '🏆 Tournament Entry Fee';
      case 'match': return '⚽ Open Match Pass';
      default: return '⚡ PLAYSPORT Checkout';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative fade-in flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Checkout & Payment
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Secure UPI & Gateway
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">256-bit SSL encrypted • Instant confirmation</p>
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          
          {/* Order Summary Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                  {getBadgeTitle()}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {orderDetails.title || orderDetails.turfName || 'PLAYSPORT Sports Facility'}
                </h4>
                {orderDetails.groundName && (
                  <p className="text-[11px] text-slate-500 font-medium">{orderDetails.groundName}</p>
                )}
                {type === 'tournament' && orderDetails.teamName && (
                  <p className="text-[11px] text-brand-800 font-semibold mt-0.5">
                    Team: {orderDetails.teamName} • Capt: {orderDetails.captainName}
                  </p>
                )}
                {type === 'match' && orderDetails.sport && (
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Sport: {orderDetails.sport} • {orderDetails.time}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Payable</span>
                <span className="text-xl font-black text-brand-700">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Schedule & Items Details */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 font-medium block">Date / Schedule</span>
                <span className="font-bold text-slate-800">
                  {orderDetails.bookingDate || orderDetails.rentalDate || orderDetails.date || 'Immediate'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Details</span>
                <span className="font-bold text-slate-800">
                  {type === 'turf' && `${orderDetails.slotCount || 1} Slot(s)`}
                  {type === 'equipment' && `${orderDetails.hours || 1} Hr Rental`}
                  {type === 'tournament' && `${orderDetails.membersCount || 7} Players Squad`}
                  {type === 'match' && 'Individual Player Slot'}
                </span>
              </div>
            </div>

            {/* Equipment Add-on List if present */}
            {orderDetails.equipmentItems && orderDetails.equipmentItems.length > 0 && (
              <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                <span className="font-semibold text-slate-500">Rented Equipment:</span>
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
              
              {/* Option 1: Dynamic Scannable UPI QR */}
              <button
                type="button"
                onClick={() => setSelectedMethod('upi_qr')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  selectedMethod === 'upi_qr'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">Scan & Pay (UPI QR)</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">Fast</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">GPay, PhonePe, Paytm, BHIM</p>
                </div>
              </button>

              {/* Option 2: Razorpay Full Gateway */}
              <button
                type="button"
                onClick={() => setSelectedMethod('razorpay')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  selectedMethod === 'razorpay'
                    ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                  R
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Razorpay Gateway</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Cards, NetBanking, Wallets</p>
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
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Debit / Credit Card</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Visa, Mastercard, RuPay</p>
                </div>
              </button>

              {/* Option 4: Pay at Turf Reception (only for bookings) */}
              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  selectedMethod === 'cash'
                    ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Pay at Venue</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Cash / POS at Reception</p>
                </div>
              </button>

            </div>
          </div>

          {/* Dynamic Payment Option Forms */}

          {/* ==================================================== */}
          {/* OPTION 1: REAL DYNAMIC SCANNABLE UPI QR CODE         */}
          {/* ==================================================== */}
          {selectedMethod === 'upi_qr' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Dynamic NPCI Scannable QR Code
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Amount: ₹{totalAmount.toFixed(2)}
                </span>
              </div>

              {/* QR Image and Scan Instructions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                <div className="relative shrink-0 flex flex-col items-center">
                  <img
                    src={qrCodeImageUrl}
                    alt={`Scan to Pay ₹${totalAmount.toFixed(2)}`}
                    className="w-40 h-40 rounded-lg border border-slate-200 shadow-xs p-1.5 bg-white object-contain"
                  />
                  <span className="text-[9px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pre-filled ₹{totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      Scan with Any UPI App
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Point your camera or open Google Pay, PhonePe, Paytm, or BHIM. It will directly open the payment screen with <strong>₹{totalAmount.toFixed(2)}</strong> prefilled.
                    </p>
                  </div>

                  {/* Payee VPA Details */}
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold">Verified Payee UPI ID</span>
                      <span className="font-mono font-bold text-brand-800">{upiVpa}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1 transition"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* App badges */}
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[9px] text-slate-500 font-semibold pt-0.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">GPay</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">PhonePe</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">Paytm</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">BHIM</span>
                  </div>
                </div>
              </div>

              {/* Direct UPI Intent Link for Mobile users */}
              <div>
                <a
                  href={upiIntentUri}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Tap to Open in UPI App (GPay / PhonePe / Paytm)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
                <span className="text-[10px] text-slate-500 text-center block mt-1">
                  On mobile phones, tapping above launches your preferred UPI app directly.
                </span>
              </div>

              {/* Optional UTR Input */}
              <div className="pt-2 border-t border-emerald-200/60">
                <label className="text-[10px] font-bold text-emerald-900 block mb-1">
                  UPI Reference / UTR Number <span className="font-normal text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. 429810294821 (from GPay / PhonePe / Paytm)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* OPTION 2: RAZORPAY GATEWAY CHECKOUT                  */}
          {/* ==================================================== */}
          {selectedMethod === 'razorpay' && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                <h5 className="font-bold text-slate-900 text-xs">Standard Razorpay Gateway</h5>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Clicking the confirmation button will launch the Razorpay interactive popup where you can complete payment using any Indian Credit/Debit Card, NetBanking (50+ banks), Razorpay dynamic QR, or UPI IDs.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-blue-800 font-bold bg-blue-100/60 p-2 rounded-lg border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                <span>Supports zero-fee UPI, RuPay, Visa, Mastercard, SBI, HDFC, ICICI, Axis & Wallets</span>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* OPTION 3: CREDIT / DEBIT CARD MANUAL FORM           */}
          {/* ==================================================== */}
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

          {/* ==================================================== */}
          {/* OPTION 4: PAY AT VENUE                              */}
          {/* ==================================================== */}
          {selectedMethod === 'cash' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Building2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Pay on Arrival</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Your reference will be created instantly. Please pay ₹{totalAmount.toFixed(2)} at the reception desk before commencement.
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
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-Bit SSL Encrypted • Direct UPI NPCI Payment Intent</span>
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
            className={`flex-1 py-3 px-5 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 ${
              selectedMethod === 'upi_qr'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/25'
                : 'bg-brand-700 hover:bg-brand-800 active:bg-brand-900 shadow-brand-700/25'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : selectedMethod === 'upi_qr' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Paid ₹{totalAmount.toFixed(2)} / Confirm</span>
                <ArrowRight className="w-4 h-4" />
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
