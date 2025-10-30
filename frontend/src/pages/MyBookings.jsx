import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '@services/bookingService';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Spinner from '@components/common/Spinner';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
  LogIn,
  LogOut,
} from 'lucide-react';

/**
 * Status Badge Component
 */
const StatusBadge = ({ status }) => {
  const variants = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
    active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  };

  const variant = variants[status] || variants.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
      {variant.label}
    </span>
  );
};

/**
 * Booking Card Component
 */
const BookingCardItem = ({ booking, onCheckIn, onCheckOut, onCancel, onView }) => {
  const isUpcoming = new Date(booking.startTime) > new Date();
  const isActive = 
    new Date(booking.startTime) <= new Date() && 
    new Date(booking.endTime) >= new Date() &&
    booking.status === 'confirmed';

  return (
    <Card className="hover:shadow-lg transition-all">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Spot Image */}
        <div className="md:w-48 h-48 md:h-auto">
          <img
            src={booking.spot?.images?.[0] || '/placeholder-parking.jpg'}
            alt={booking.spot?.title}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Booking Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{booking.spot?.title}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {booking.spot?.address}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Time and Price Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Check-in</p>
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-4 h-4 text-gray-600" />
                <span>{new Date(booking.startTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <Clock className="w-4 h-4 text-gray-600" />
                <span>
                  {new Date(booking.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Check-out</p>
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-4 h-4 text-gray-600" />
                <span>{new Date(booking.endTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <Clock className="w-4 h-4 text-gray-600" />
                <span>
                  {new Date(booking.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xl font-bold text-gray-900">₹{booking.totalAmount}</span>
              <span className="text-sm text-gray-600">
                ({booking.duration || 'N/A'}h)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" icon={Eye} onClick={() => onView(booking)}>
                View
              </Button>

              {isActive && (
                <Button
                  size="sm"
                  variant="success"
                  icon={LogOut}
                  onClick={() => onCheckOut(booking)}
                >
                  Check-out
                </Button>
              )}

              {isUpcoming && booking.status === 'confirmed' && (
                <>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={LogIn}
                    onClick={() => onCheckIn(booking)}
                  >
                    Check-in
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={XCircle}
                    onClick={() => onCancel(booking)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Empty State Component
 */
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <Card className="p-12 text-center">
    <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    {action}
  </Card>
);

/**
 * Pagination Component
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
  );

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        size="sm"
        variant="outline"
        icon={ChevronLeft}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        ariaLabel="Previous page"
      />

      {visiblePages.map((page, idx) => {
        const prevPage = visiblePages[idx - 1];
        const showEllipsis = prevPage && page - prevPage > 1;

        return (
          <div key={page} className="flex items-center gap-2">
            {showEllipsis && <span className="text-gray-400">...</span>}
            <button
              onClick={() => onPageChange(page)}
              className={`
                w-10 h-10 rounded-lg font-medium transition-colors
                ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }
              `}
            >
              {page}
            </button>
          </div>
        );
      })}

      <Button
        size="sm"
        variant="outline"
        icon={ChevronRight}
        iconPosition="right"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        ariaLabel="Next page"
      />
    </div>
  );
};

/**
 * Main MyBookings Component
 */
const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 5;

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: 0 },
    { id: 'active', label: 'Active', count: 0 },
    { id: 'past', label: 'Past', count: 0 },
    { id: 'cancelled', label: 'Cancelled', count: 0 },
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bookings, searchQuery]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];
    const now = new Date();

    // Filter by tab
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(
          (b) => b.status === 'confirmed' && new Date(b.startTime) > now
        );
        break;
      case 'active':
        filtered = filtered.filter(
          (b) =>
            b.status === 'confirmed' &&
            new Date(b.startTime) <= now &&
            new Date(b.endTime) >= now
        );
        break;
      case 'past':
        filtered = filtered.filter(
          (b) => b.status === 'completed' || new Date(b.endTime) < now
        );
        break;
      case 'cancelled':
        filtered = filtered.filter((b) => b.status === 'cancelled');
        break;
      default:
        break;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.spot?.title?.toLowerCase().includes(query) ||
          b.spot?.address?.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const handleCheckIn = async () => {
    try {
      toast.success('Check-in successful!');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to check-in');
    }
  };

  const handleCheckOut = async (booking) => {
    try {
      await bookingService.completeBooking(booking._id);
      toast.success('Check-out successful!');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to check-out');
    }
  };

  const handleCancel = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingService.cancelBooking(booking._id);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleView = (booking) => {
    window.location.href = `/bookings/${booking._id}`;
  };

  // Update tab counts
  const updatedTabs = tabs.map((tab) => {
    const now = new Date();
    let count = 0;

    switch (tab.id) {
      case 'upcoming':
        count = bookings.filter(
          (b) => b.status === 'confirmed' && new Date(b.startTime) > now
        ).length;
        break;
      case 'active':
        count = bookings.filter(
          (b) =>
            b.status === 'confirmed' &&
            new Date(b.startTime) <= now &&
            new Date(b.endTime) >= now
        ).length;
        break;
      case 'past':
        count = bookings.filter(
          (b) => b.status === 'completed' || new Date(b.endTime) < now
        ).length;
        break;
      case 'cancelled':
        count = bookings.filter((b) => b.status === 'cancelled').length;
        break;
      default:
        break;
    }

    return { ...tab, count };
  });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage all your parking reservations</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-x-auto">
          <div className="flex">
            {updatedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 px-6 py-4 font-medium transition-colors relative
                  ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab.label}
                  <span
                    className={`
                      px-2 py-0.5 rounded-full text-xs font-semibold
                      ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by spot name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>

          {/* Additional Filters (collapsed by default) */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Most Recent</option>
                  <option>Oldest First</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : paginatedBookings.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedBookings.map((booking) => (
                <BookingCardItem
                  key={booking._id}
                  booking={booking}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onCancel={handleCancel}
                  onView={handleView}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={`No ${activeTab} bookings`}
            description={
              searchQuery
                ? 'No bookings match your search criteria'
                : `You don't have any ${activeTab} bookings at the moment`
            }
            action={
              <Link to="/search">
                <Button icon={Search}>Find Parking</Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
};

export default MyBookings;
