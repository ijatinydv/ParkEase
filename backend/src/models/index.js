/**
 * Central export file for all Mongoose models
 * 
 * This file provides a single point of import for all database models
 * used in the ParkEase application.
 * 
 * Usage:
 * const { User, ParkingSpot, Booking, Review, Transaction } = require('./models');
 */

const User = require('./User');
const ParkingSpot = require('./ParkingSpot');
const Booking = require('./Booking');
const Review = require('./Review');
const Transaction = require('./Transaction');

module.exports = {
  User,
  ParkingSpot,
  Booking,
  Review,
  Transaction
};
