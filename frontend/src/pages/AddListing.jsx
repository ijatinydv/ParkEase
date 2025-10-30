import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import spotService from '@services/spotService';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import toast from 'react-hot-toast';
import {
  MapPin,
  Upload,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { AMENITIES, VEHICLE_TYPES } from '@utils/constants';

/**
 * Progress Indicator Component
 */
const ProgressIndicator = ({ currentStep, steps }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between relative">
      {/* Progress Line */}
      <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 -z-10">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all
                ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-600'
                }
              `}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
            </div>
            <div className="flex flex-col items-center">
              <span
                className={`text-sm font-medium ${
                  isCurrent ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/**
 * Step 1: Location Component
 */
const LocationStep = ({ formData, onChange, errors }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Details</h2>
      <p className="text-gray-600">Where is your parking spot located?</p>
    </div>

    <div className="space-y-4">
      <Input
        label="Street Address"
        name="address"
        value={formData.address}
        onChange={(e) => onChange('address', e.target.value)}
        error={errors.address}
        placeholder="123 Main Street"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="City"
          name="city"
          value={formData.city}
          onChange={(e) => onChange('city', e.target.value)}
          error={errors.city}
          placeholder="Mumbai"
          required
        />
        <Input
          label="State"
          name="state"
          value={formData.state}
          onChange={(e) => onChange('state', e.target.value)}
          error={errors.state}
          placeholder="Maharashtra"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Pin Code"
          name="pinCode"
          value={formData.pinCode}
          onChange={(e) => onChange('pinCode', e.target.value)}
          error={errors.pinCode}
          placeholder="400001"
          required
        />
        <Input
          label="Landmark (Optional)"
          name="landmark"
          value={formData.landmark}
          onChange={(e) => onChange('landmark', e.target.value)}
          placeholder="Near Central Park"
        />
      </div>

      {/* Map Placeholder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location on Map
        </label>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Google Maps integration coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Click to set location manually</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Latitude"
          name="latitude"
          type="number"
          step="any"
          value={formData.latitude}
          onChange={(e) => onChange('latitude', e.target.value)}
          error={errors.latitude}
          placeholder="19.0760"
        />
        <Input
          label="Longitude"
          name="longitude"
          type="number"
          step="any"
          value={formData.longitude}
          onChange={(e) => onChange('longitude', e.target.value)}
          error={errors.longitude}
          placeholder="72.8777"
        />
      </div>
    </div>
  </div>
);

/**
 * Step 2: Photos Component
 */
const PhotosStep = ({ formData, onChange, errors }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const newPhotos = [...(formData.photos || []), ...imageFiles].slice(0, 8);
    onChange('photos', newPhotos);
  };

  const removePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    onChange('photos', newPhotos);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Photos</h2>
        <p className="text-gray-600">Add up to 8 photos of your parking spot</p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="photo-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-1">
            Drop your photos here, or click to browse
          </p>
          <p className="text-sm text-gray-600">
            PNG, JPG, WEBP up to 5MB each (max 8 photos)
          </p>
        </label>
      </div>

      {errors.photos && <p className="text-red-600 text-sm">{errors.photos}</p>}

      {/* Photo Preview Grid */}
      {formData.photos && formData.photos.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Uploaded Photos ({formData.photos.length}/8)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Step 3: Details Component
 */
const DetailsStep = ({ formData, onChange, errors }) => {
  const toggleAmenity = (amenity) => {
    const currentAmenities = formData.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    onChange('amenities', newAmenities);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Spot Details</h2>
        <p className="text-gray-600">Tell us about your parking spot</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Listing Title"
          name="title"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          error={errors.title}
          placeholder="Covered Parking near Metro Station"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={4}
            placeholder="Describe your parking spot, access instructions, nearby landmarks..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={(e) => onChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select vehicle type</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Amenities
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AMENITIES.map((amenity) => (
              <button
                key={amenity.value}
                type="button"
                onClick={() => toggleAmenity(amenity.value)}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${
                    formData.amenities?.includes(amenity.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{amenity.icon}</span>
                  <span className="text-sm font-medium">{amenity.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Total Spots"
            name="totalSpots"
            type="number"
            min="1"
            value={formData.totalSpots}
            onChange={(e) => onChange('totalSpots', e.target.value)}
            error={errors.totalSpots}
            placeholder="1"
            required
          />
          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-8">
              <input
                type="checkbox"
                checked={formData.isInstantBooking || false}
                onChange={(e) => onChange('isInstantBooking', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable instant booking
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Step 4: Pricing Component
 */
const PricingStep = ({ formData, onChange, errors }) => {
  const calculateEstimates = () => {
    const hourly = parseFloat(formData.pricePerHour) || 0;
    return {
      daily: (hourly * 24 * 0.9).toFixed(0),
      weekly: (hourly * 24 * 7 * 0.85).toFixed(0),
      monthly: (hourly * 24 * 30 * 0.75).toFixed(0),
    };
  };

  const estimates = calculateEstimates();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing</h2>
        <p className="text-gray-600">Set your pricing details</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Price Per Hour (₹)"
          name="pricePerHour"
          type="number"
          min="0"
          step="10"
          value={formData.pricePerHour}
          onChange={(e) => onChange('pricePerHour', e.target.value)}
          error={errors.pricePerHour}
          placeholder="50"
          required
        />

        {formData.pricePerHour && (
          <Card className="bg-blue-50 border-blue-200 p-4">
            <p className="text-sm font-medium text-blue-900 mb-3">
              Estimated Earnings (with discounts):
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-blue-700 mb-1">Daily</p>
                <p className="text-lg font-bold text-blue-900">₹{estimates.daily}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700 mb-1">Weekly</p>
                <p className="text-lg font-bold text-blue-900">₹{estimates.weekly}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700 mb-1">Monthly</p>
                <p className="text-lg font-bold text-blue-900">₹{estimates.monthly}</p>
              </div>
            </div>
          </Card>
        )}

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enableDynamicPricing || false}
              onChange={(e) => onChange('enableDynamicPricing', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable dynamic pricing (adjust based on demand)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

/**
 * Step 5: Availability Component
 */
const AvailabilityStep = ({ formData, onChange, errors }) => {
  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  const toggleDay = (day) => {
    const currentDays = formData.availableDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    onChange('availableDays', newDays);
  };

  const selectAllDays = () => {
    onChange('availableDays', daysOfWeek.map((d) => d.value));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Availability</h2>
        <p className="text-gray-600">When is your parking spot available?</p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Available Days
            </label>
            <Button size="sm" variant="outline" onClick={selectAllDays}>
              Select All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`
                  p-3 rounded-lg border-2 text-center font-medium transition-all
                  ${
                    formData.availableDays?.includes(day.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {day.label}
              </button>
            ))}
          </div>
          {errors.availableDays && (
            <p className="text-red-600 text-sm mt-1">{errors.availableDays}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime || '00:00'}
              onChange={(e) => onChange('startTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime || '23:59'}
              onChange={(e) => onChange('endTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is24x7 || false}
              onChange={(e) => onChange('is24x7', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Available 24x7
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

/**
 * Step 6: Preview Component
 */
const PreviewStep = ({ formData }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
      <p className="text-gray-600">Please review your listing before submitting</p>
    </div>

    <Card className="p-6 space-y-6">
      {/* Photos Preview */}
      {formData.photos && formData.photos.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Photos</h3>
          <div className="grid grid-cols-4 gap-2">
            {formData.photos.map((photo, index) => (
              <img
                key={index}
                src={URL.createObjectURL(photo)}
                alt={`Preview ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-600">Title</dt>
            <dd className="font-medium text-gray-900">{formData.title}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Vehicle Type</dt>
            <dd className="font-medium text-gray-900 capitalize">{formData.type}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Price per Hour</dt>
            <dd className="font-medium text-gray-900">₹{formData.pricePerHour}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Total Spots</dt>
            <dd className="font-medium text-gray-900">{formData.totalSpots}</dd>
          </div>
        </dl>
      </div>

      {/* Location */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
        <p className="text-gray-700">
          {formData.address}, {formData.city}, {formData.state} - {formData.pinCode}
        </p>
      </div>

      {/* Amenities */}
      {formData.amenities && formData.amenities.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {formData.amenities.map((amenity) => {
              const amenityData = AMENITIES.find((a) => a.value === amenity);
              return (
                <span
                  key={amenity}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {amenityData?.icon} {amenityData?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
        <p className="text-gray-700">
          {formData.is24x7
            ? '24x7 Available'
            : `${formData.startTime || '00:00'} - ${formData.endTime || '23:59'}`}
        </p>
        {formData.availableDays && formData.availableDays.length > 0 && (
          <p className="text-gray-700 mt-1">
            Days: {formData.availableDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
          </p>
        )}
      </div>
    </Card>
  </div>
);

/**
 * Main AddListing Component
 */
const AddListing = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    pinCode: '',
    landmark: '',
    latitude: '',
    longitude: '',
    photos: [],
    title: '',
    description: '',
    type: '',
    amenities: [],
    totalSpots: '1',
    isInstantBooking: false,
    pricePerHour: '',
    enableDynamicPricing: false,
    availableDays: [],
    startTime: '00:00',
    endTime: '23:59',
    is24x7: false,
  });
  const [errors, setErrors] = useState({});
  const [isDraft, setIsDraft] = useState(false);

  const steps = [
    { id: 1, label: 'Location', icon: MapPin, component: LocationStep },
    { id: 2, label: 'Photos', icon: Upload, component: PhotosStep },
    { id: 3, label: 'Details', icon: FileText, component: DetailsStep },
    { id: 4, label: 'Pricing', icon: DollarSign, component: PricingStep },
    { id: 5, label: 'Availability', icon: Calendar, component: AvailabilityStep },
    { id: 6, label: 'Preview', icon: Eye, component: PreviewStep },
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.pinCode) newErrors.pinCode = 'Pin code is required';
        break;
      case 2:
        if (!formData.photos || formData.photos.length === 0) {
          newErrors.photos = 'At least one photo is required';
        }
        break;
      case 3:
        if (!formData.title) newErrors.title = 'Title is required';
        if (!formData.type) newErrors.type = 'Vehicle type is required';
        if (!formData.description) newErrors.description = 'Description is required';
        break;
      case 4:
        if (!formData.pricePerHour) newErrors.pricePerHour = 'Price is required';
        break;
      case 5:
        if (!formData.availableDays || formData.availableDays.length === 0) {
          newErrors.availableDays = 'Select at least one day';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (saveAsDraft = false) => {
    try {
      setLoading(true);
      setIsDraft(saveAsDraft);

      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (key === 'photos') {
          formData.photos.forEach((photo) => {
            submitData.append('images', photo);
          });
        } else if (key === 'amenities' || key === 'availableDays') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      if (saveAsDraft) {
        submitData.append('isDraft', 'true');
      }

      await spotService.createSpot(submitData);
      toast.success(saveAsDraft ? 'Saved as draft!' : 'Listing created successfully!');
      navigate('/my-spots');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Listing</h1>
          <p className="text-gray-600">List your parking spot in a few simple steps</p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} steps={steps} />

        {/* Form Card */}
        <Card className="p-6 md:p-8">
          <CurrentStepComponent
            formData={formData}
            onChange={handleChange}
            errors={errors}
          />
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                icon={ChevronLeft}
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === steps.length && (
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                loading={loading && isDraft}
                disabled={loading}
              >
                Save as Draft
              </Button>
            )}

            {currentStep < steps.length ? (
              <Button
                icon={ChevronRight}
                iconPosition="right"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                icon={Check}
                onClick={() => handleSubmit(false)}
                loading={loading && !isDraft}
                disabled={loading}
              >
                Submit Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddListing;
