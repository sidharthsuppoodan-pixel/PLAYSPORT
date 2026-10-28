export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Razorpay SDK failed to load from CDN. Fallback simulation available.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const openRazorpayCheckout = ({
  orderId,
  amountPaise,
  keyId,
  currency = 'INR',
  name = 'PLAYSPORT Arena',
  description = 'Turf & Sports Equipment Reservation',
  user = {},
  themeColor = '#16a34a',
  onSuccess,
  onFailure,
  onDismiss
}) => {
  if (typeof window === 'undefined' || !window.Razorpay) {
    if (onFailure) {
      onFailure(new Error('Razorpay SDK is not available in browser.'));
    }
    return null;
  }

  const options = {
    key: keyId,
    amount: amountPaise,
    currency: currency,
    name: name,
    description: description,
    order_id: orderId,
    handler: function (response) {
      if (onSuccess) {
        onSuccess({
          razorpay_order_id: response.razorpay_order_id || orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        });
      }
    },
    prefill: {
      name: user.full_name || user.name || 'Sports Player',
      email: user.email || '',
      contact: user.phone || '9876543210'
    },
    notes: {
      source: 'PLAYSPORT Web Portal'
    },
    theme: {
      color: themeColor
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) {
          onDismiss();
        }
      }
    }
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      if (onFailure) {
        onFailure(response.error || new Error('Payment was declined.'));
      }
    });
    rzp.open();
    return rzp;
  } catch (err) {
    console.error('Error opening Razorpay modal:', err);
    if (onFailure) {
      onFailure(err);
    }
    return null;
  }
};
