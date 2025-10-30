import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ShareIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/solid';
import { QRCodeSVG } from 'qrcode.react';
import bookingService from '@services/bookingService';
import Button from '@components/common/Button';
import Card from '@components/common/Card';
import Spinner from '@components/common/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/**
 * BookingConfirmation Page
 * Displays booking confirmation details with QR code
 */
const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      setIsLoading(true);
      try {
        const response = await bookingService.getBookingById(bookingId);
        setBooking(response.booking || response);
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking details');
        navigate('/my-bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, navigate]);

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy · h:mm aa');
    } catch {
      return dateString;
    }
  };

  const handleShare = async () => {
    const text = `I just booked a parking spot on ParkEase! Booking ID: ${booking.bookingId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ParkEase Booking',
          text: text,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(text);
        }
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Booking details copied to clipboard!');
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `parkease-booking-${booking.bookingId}.png`;
      link.href = url;
      link.click();
      toast.success('QR code downloaded!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Booking Not Found
        </h2>
        <Button onClick={() => navigate('/my-bookings')}>
          View My Bookings
        </Button>
      </div>
    );
  }

  const { spot, startTime, endTime, totalAmount, bookingId: displayBookingId, status } = booking;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Booking Confirmed!
          </h1>
          
          <p className="text-lg text-neutral-600">
            Your parking spot has been reserved successfully
          </p>
        </motion.div>

        {/* Main booking card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            {/* Booking ID */}
            <div className="mb-6 pb-6 border-b border-neutral-200">
              <p className="text-sm text-neutral-600 mb-1">Booking ID</p>
              <p className="text-2xl font-bold text-neutral-900">
                {displayBookingId || bookingId}
              </p>
            </div>

            {/* Spot details */}
            <div className="mb-6 pb-6 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Parking Spot Details
              </h2>
              
              <div className="flex gap-4">
                {spot?.images?.[0] && (
                  <img
                    src={spot.images[0]}
                    alt={spot.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
                
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    {spot?.title || 'Parking Spot'}
                  </h3>
                  
                  <div className="flex items-start gap-2 text-neutral-600">
                    <MapPinIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{spot?.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking details */}
            <div className="mb-6 pb-6 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Booking Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Check-in</p>
                    <p className="font-medium text-neutral-900">
                      {formatDateTime(startTime)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Check-out</p>
                    <p className="font-medium text-neutral-900">
                      {formatDateTime(endTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment details */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Payment Summary
              </h2>
              
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="text-neutral-700">Total Amount Paid</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{totalAmount?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>Payment successful · {status === 'confirmed' ? 'Confirmed' : 'Pending confirmation'}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* QR Code section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                Check-in QR Code
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                Show this QR code at the parking location for check-in
              </p>
              
              <div className="inline-block p-6 bg-white rounded-lg border-2 border-neutral-200">
                <QRCodeSVG
                  id="qr-code"
                  value={JSON.stringify({
                    bookingId: displayBookingId || bookingId,
                    spotId: spot?._id,
                    startTime,
                    endTime,
                  })}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              
              <div className="mt-6">
                <Button
                  variant="outline"
                  icon={ArrowDownTrayIcon}
                  onClick={downloadQRCode}
                >
                  Download QR Code
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Important information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• A confirmation email has been sent to your registered email</li>
              <li>• Please arrive within 15 minutes of your check-in time</li>
              <li>• Keep your QR code ready for contactless check-in</li>
              <li>• Free cancellation available up to 24 hours before check-in</li>
              <li>• Contact the host if you need any assistance</li>
            </ul>
          </Card>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Link to="/my-bookings" className="block">
            <Button fullWidth variant="outline">
              View All Bookings
            </Button>
          </Link>
          
          <Button
            fullWidth
            variant="outline"
            icon={ShareIcon}
            onClick={handleShare}
          >
            Share Booking
          </Button>
          
          <Link to="/search" className="block">
            <Button fullWidth>
              Book Another Spot
            </Button>
          </Link>
        </motion.div>

        {/* Helpdesk notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-neutral-600">
            Need help?{' '}
            <a href="/support" className="text-blue-600 hover:underline font-medium">
              Contact Support
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
