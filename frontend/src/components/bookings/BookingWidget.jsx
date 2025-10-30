import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from '@components/common/Button';
import Spinner from '@components/common/Spinner';
import bookingService from '@services/bookingService';
import toast from 'react-hot-toast';
import { differenceInMinutes, addHours } from 'date-fns';

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee

/**
 * BookingWidget Component
 * Handles date/time selection and price calculation
 */
const BookingWidget = ({ spot, onBookNow }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [duration, setDuration] = useState(null);
  const [pricing, setPricing] = useState(null);

  const { pricePerHour = 0 } = spot || {};

  // Calculate duration and pricing when dates change
  useEffect(() => {
    const calculateDurationAndPricing = () => {
      const totalMinutes = differenceInMinutes(endDate, startDate);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setDuration({
        hours,
        minutes,
        totalHours: totalMinutes / 60,
      });

      // Calculate pricing
      const parkingFee = (totalMinutes / 60) * pricePerHour;
      const platformFee = parkingFee * PLATFORM_FEE_PERCENTAGE;
      const total = parkingFee + platformFee;

      setPricing({
        parkingFee: parkingFee.toFixed(2),
        platformFee: platformFee.toFixed(2),
        total: total.toFixed(2),
      });
    };

    if (startDate && endDate && endDate > startDate) {
      calculateDurationAndPricing();
    } else {
      setDuration(null);
      setPricing(null);
    }
  }, [startDate, endDate, pricePerHour]);

  // Check availability when dates are selected
  useEffect(() => {
    const checkAvailability = async () => {
      if (!spot?._id || !startDate || !endDate) return;

      setIsCheckingAvailability(true);
      try {
        const response = await bookingService.checkAvailability(
          spot._id,
          startDate.toISOString(),
          endDate.toISOString()
        );
        setIsAvailable(response.available);
        
        if (!response.available) {
          toast.error('This spot is not available for the selected time');
        }
      } catch (error) {
        console.error('Availability check error:', error);
        toast.error('Failed to check availability');
        setIsAvailable(false);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    if (startDate && endDate && endDate > startDate) {
      checkAvailability();
    } else {
      setIsAvailable(null);
    }
  }, [startDate, endDate, spot?._id]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
    // Auto-set end date to 2 hours later if not set
    if (!endDate && date) {
      setEndDate(addHours(date, 2));
    } else if (endDate && date && endDate <= date) {
      setEndDate(addHours(date, 2));
    }
  };

  const handleEndDateChange = (date) => {
    if (startDate && date && date > startDate) {
      setEndDate(date);
    } else {
      toast.error('End time must be after start time');
    }
  };

  const handleReserve = () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end date/time');
      return;
    }

    if (endDate <= startDate) {
      toast.error('End time must be after start time');
      return;
    }

    if (isAvailable === false) {
      toast.error('This spot is not available for the selected time');
      return;
    }

    if (isCheckingAvailability) {
      toast.error('Please wait while we check availability');
      return;
    }

    onBookNow({
      spotId: spot._id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration,
      pricing,
    });
  };

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90); // 90 days ahead

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6 sticky top-24"
    >
      {/* Price header */}
      <div className="mb-6 pb-6 border-b border-neutral-200">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-neutral-900">
            ₹{pricePerHour}
          </span>
          <span className="text-neutral-600">/hour</span>
        </div>
      </div>

      {/* Date/Time Pickers */}
      <div className="space-y-4 mb-6">
        {/* Start Date/Time */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            Check-in
          </label>
          <DatePicker
            selected={startDate}
            onChange={handleStartDateChange}
            showTimeSelect
            timeIntervals={30}
            dateFormat="MMM d, yyyy h:mm aa"
            minDate={minDate}
            maxDate={maxDate}
            placeholderText="Select start date & time"
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* End Date/Time */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            <ClockIcon className="w-4 h-4 inline mr-1" />
            Check-out
          </label>
          <DatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            showTimeSelect
            timeIntervals={30}
            dateFormat="MMM d, yyyy h:mm aa"
            minDate={startDate || minDate}
            maxDate={maxDate}
            placeholderText="Select end date & time"
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Availability status */}
      {isCheckingAvailability && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 mb-4 bg-blue-50 rounded-lg">
          <Spinner size="sm" />
          <span className="text-sm text-blue-900">Checking availability...</span>
        </div>
      )}

      {isAvailable === true && duration && (
        <div className="py-3 px-4 mb-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-900 font-medium">
            ✓ Available for {duration.hours}h {duration.minutes}m
          </p>
        </div>
      )}

      {isAvailable === false && (
        <div className="py-3 px-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-900 font-medium">
            ✗ Not available for selected time
          </p>
        </div>
      )}

      {/* Price breakdown */}
      {pricing && duration && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 mb-6 pb-6 border-b border-neutral-200"
        >
          <div className="flex justify-between text-neutral-700">
            <span>
              ₹{pricePerHour} × {duration.totalHours.toFixed(1)} hours
            </span>
            <span>₹{pricing.parkingFee}</span>
          </div>
          <div className="flex justify-between text-neutral-700">
            <span>Platform fee (15%)</span>
            <span>₹{pricing.platformFee}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-neutral-900 pt-3 border-t border-neutral-200">
            <span>Total</span>
            <span>₹{pricing.total}</span>
          </div>
        </motion.div>
      )}

      {/* Reserve button */}
      <Button
        fullWidth
        size="lg"
        onClick={handleReserve}
        disabled={!startDate || !endDate || isAvailable === false || isCheckingAvailability}
        loading={isCheckingAvailability}
      >
        {isAvailable === false ? 'Not Available' : 'Reserve Now'}
      </Button>

      {/* Notice */}
      <p className="text-xs text-neutral-600 text-center mt-4">
        You won&apos;t be charged yet
      </p>
    </motion.div>
  );
};

export default BookingWidget;
