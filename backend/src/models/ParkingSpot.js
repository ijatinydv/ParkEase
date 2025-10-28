const mongoose = require('mongoose');

// Embedded location schema
const locationSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[1-9][0-9]{5}$/, 'Please provide a valid 6-digit pincode']
    }
  },
  { _id: false }
);

// Embedded availability schema
const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format']
    }
  },
  { _id: false }
);

const parkingSpotSchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    location: {
      type: locationSchema,
      required: [true, 'Location is required']
    },
    // GeoJSON format for geospatial queries
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    photos: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length > 0 && v.length <= 10;
        },
        message: 'At least 1 and maximum 10 photos are required'
      },
      required: [true, 'At least one photo is required']
    },
    type: {
      type: String,
      enum: {
        values: ['open', 'covered', 'garage', 'street', 'driveway'],
        message: 'Type must be one of: open, covered, garage, street, driveway'
      },
      required: [true, 'Parking type is required']
    },
    amenities: {
      type: [String],
      enum: {
        values: [
          'cctv',
          'security',
          'lighting',
          'ev-charging',
          'covered',
          'washroom',
          'disabled-access',
          '24x7',
          'valet'
        ],
        message: 'Invalid amenity type'
      },
      default: []
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Price per hour is required'],
      min: [0, 'Price per hour cannot be negative'],
      max: [10000, 'Price per hour seems unreasonably high']
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price per day cannot be negative'],
      max: [50000, 'Price per day seems unreasonably high']
    },
    availability: {
      type: [availabilitySchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one availability slot is required'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'pending'],
        message: 'Status must be one of: active, inactive, pending'
      },
      default: 'pending'
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    totalReviews: {
      type: Number,
      min: [0, 'Total reviews cannot be negative'],
      default: 0
    },
    totalBookings: {
      type: Number,
      min: [0, 'Total bookings cannot be negative'],
      default: 0
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [100, 'Capacity cannot exceed 100']
    },
    vehicleTypes: {
      type: [String],
      enum: {
        values: ['car', 'bike', 'bicycle', 'suv', 'truck'],
        message: 'Invalid vehicle type'
      },
      default: ['car', 'bike']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
parkingSpotSchema.index({ hostId: 1, status: 1 });
parkingSpotSchema.index({ 'location.city': 1, status: 1 });
parkingSpotSchema.index({ 'location.pincode': 1 });
parkingSpotSchema.index({ status: 1, rating: -1 });
parkingSpotSchema.index({ pricePerHour: 1 });
parkingSpotSchema.index({ createdAt: -1 });

// Geospatial index for location-based queries
parkingSpotSchema.index({ 'coordinates.coordinates': '2dsphere' });

// Text index for search functionality
parkingSpotSchema.index({ title: 'text', description: 'text', 'location.address': 'text' });

// Virtual for 'id'
parkingSpotSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Virtual to populate host details
parkingSpotSchema.virtual('host', {
  ref: 'User',
  localField: 'hostId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate reviews
parkingSpotSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'spotId'
});

// Pre-save middleware to sync coordinates with location
parkingSpotSchema.pre('save', function (next) {
  if (this.location && this.location.lat && this.location.lng) {
    this.coordinates = {
      type: 'Point',
      coordinates: [this.location.lng, this.location.lat] // GeoJSON uses [lng, lat]
    };
  }
  next();
});

// Method to update rating
parkingSpotSchema.methods.updateRating = async function (newRating) {
  const totalRating = this.rating * this.totalReviews;
  this.totalReviews += 1;
  this.rating = (totalRating + newRating) / this.totalReviews;
  await this.save();
};

// Method to check if spot is available at given time
parkingSpotSchema.methods.isAvailableAt = function (startTime, endTime) {
  const startDate = new Date(startTime);
  const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
  
  const dayAvailability = this.availability.find(slot => slot.day === dayOfWeek);
  
  if (!dayAvailability) {
    return false;
  }
  
  // Additional time slot checking logic can be added here
  return true;
};

// Static method to find nearby parking spots
parkingSpotSchema.statics.findNearby = function (lng, lat, maxDistance = 5000) {
  return this.find({
    'coordinates.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    status: 'active'
  });
};

const ParkingSpot = mongoose.model('ParkingSpot', parkingSpotSchema);

module.exports = ParkingSpot;
