import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '@components/common/Modal';
import Button from '@components/common/Button';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import bookingService from '@services/bookingService';
import paymentService from '@services/paymentService';
import toast from 'react-hot-toast';
import { RAZORPAY_KEY_ID } from '@utils/constants';
import { useNavigate } from 'react-router-dom';

/**
 * BookingModal Component
 * Handles booking confirmation and Razorpay payment
 */
const BookingModal = ({ isOpen, onClose, bookingData, spot, user }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  if (!bookingData || !spot) {
    return null;
  }

  const { startTime, endTime, duration, pricing } = bookingData;

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy · h:mm aa');
    } catch {
      return dateString;
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!acceptedTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create booking
      const bookingResponse = await bookingService.createBooking({
        spotId: bookingData.spotId,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        totalAmount: parseFloat(pricing.total),
      });

      const booking = bookingResponse.booking || bookingResponse;

      // Step 2: Create payment order
      const orderResponse = await paymentService.createOrder(booking._id);
      const { order, amount, currency } = orderResponse;

      // Step 3: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Step 4: Configure Razorpay options
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency || 'INR',
        name: 'ParkEase',
        description: `Booking for ${spot.title}`,
        order_id: order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response) => {
          try {
            // Step 5: Verify payment
            const verifyResponse = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            });

            if (verifyResponse.success) {
              toast.success('Booking confirmed successfully!');
              onClose();
              navigate(`/booking-confirmation/${booking._id}`);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      // Step 6: Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Your Booking"
      size="lg"
      closeOnOverlay={!isProcessing}
    >
      <div className="space-y-6">
        {/* Spot info */}
        <div className="flex gap-4 pb-6 border-b border-neutral-200">
          <img
            src={spot.images?.[0] || '/placeholder-spot.jpg'}
            alt={spot.title}
            className="w-24 h-24 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              {spot.title}
            </h3>
            <p className="text-sm text-neutral-600">{spot.address}</p>
          </div>
        </div>

        {/* Booking details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-900">Booking Details</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Check-in</span>
              <span className="font-medium text-neutral-900">
                {formatDateTime(startTime)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Check-out</span>
              <span className="font-medium text-neutral-900">
                {formatDateTime(endTime)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Duration</span>
              <span className="font-medium text-neutral-900">
                {duration?.hours}h {duration?.minutes}m
              </span>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="space-y-3 pt-6 border-t border-neutral-200">
          <h4 className="font-semibold text-neutral-900 mb-4">Price Breakdown</h4>
          
          <div className="flex justify-between text-sm text-neutral-700">
            <span>Parking fee</span>
            <span>₹{pricing.parkingFee}</span>
          </div>
          
          <div className="flex justify-between text-sm text-neutral-700">
            <span>Platform fee (15%)</span>
            <span>₹{pricing.platformFee}</span>
          </div>
          
          <div className="flex justify-between text-lg font-bold text-neutral-900 pt-3 border-t border-neutral-200">
            <span>Total Amount</span>
            <span>₹{pricing.total}</span>
          </div>
        </div>

        {/* Terms and conditions */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-700">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                terms and conditions
              </a>{' '}
              and{' '}
              <a href="/cancellation-policy" className="text-blue-600 hover:underline">
                cancellation policy
              </a>
            </span>
          </label>
        </div>

        {/* Important notes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex gap-3">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p>• Your booking will be confirmed instantly after payment</p>
              <p>• You&apos;ll receive a confirmation email with check-in details</p>
              <p>• Cancellation is free up to 24 hours before check-in</p>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={handlePayment}
            loading={isProcessing}
            disabled={!acceptedTerms || isProcessing}
          >
            Confirm & Pay ₹{pricing.total}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BookingModal;
