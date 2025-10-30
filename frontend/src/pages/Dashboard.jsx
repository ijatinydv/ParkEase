import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import bookingService from '@services/bookingService';
import spotService from '@services/spotService';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Spinner from '@components/common/Spinner';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  MapPin,
  DollarSign,
  TrendingUp,
  Clock,
  Heart,
  PlusCircle,
  Search,
  History,
  Eye,
  CheckCircle,
  BarChart3,
  ListIcon,
  Menu,
  X,
} from 'lucide-react';

/**
 * Stat Card Component
 */
const StatCard = ({ icon: Icon, title, value, change, color = 'blue', loading = false }) => (
  <Card className="p-6">
    {loading ? (
      <div className="flex items-center justify-center h-24">
        <Spinner size="sm" />
      </div>
    ) : (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          {change && (
            <span
              className={`text-sm font-medium ${
                change > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change > 0 ? '+' : ''}
              {change}%
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </>
    )}
  </Card>
);

/**
 * Quick Action Card Component
 */
const QuickActionCard = ({ icon: Icon, title, description, onClick, color = 'blue' }) => (
  <Card
    hover
    onClick={onClick}
    className="p-6 cursor-pointer transition-all hover:border-blue-500"
  >
    <div className={`p-3 rounded-lg bg-${color}-100 w-fit mb-4`}>
      <Icon className={`w-6 h-6 text-${color}-600`} />
    </div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </Card>
);

/**
 * Booking Card Component
 */
const BookingCard = ({ booking, onViewDetails }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <img
          src={booking.spot?.images?.[0] || '/placeholder-parking.jpg'}
          alt={booking.spot?.title}
          className="w-24 h-24 rounded-lg object-cover"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{booking.spot?.title}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {booking.spot?.address}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              {new Date(booking.startTime).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              ₹{booking.totalAmount}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => onViewDetails(booking)}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

/**
 * Saved Spot Card Component
 */
const SavedSpotCard = ({ spot, onRemove }) => (
  <Card className="p-4 hover:shadow-md transition-shadow">
    <div className="relative">
      <img
        src={spot.images?.[0] || '/placeholder-parking.jpg'}
        alt={spot.title}
        className="w-full h-48 rounded-lg object-cover mb-3"
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove(spot.id);
        }}
        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50"
      >
        <Heart className="w-5 h-5 text-red-500 fill-current" />
      </button>
    </div>
    <h3 className="font-semibold text-gray-900 mb-1">{spot.title}</h3>
    <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
      <MapPin className="w-4 h-4" />
      {spot.address}
    </p>
    <div className="flex items-center justify-between">
      <span className="text-lg font-bold text-blue-600">₹{spot.pricePerHour}/hr</span>
      <Link to={`/spots/${spot.id}`}>
        <Button size="sm" variant="primary">
          Book Now
        </Button>
      </Link>
    </div>
  </Card>
);

/**
 * Sidebar Component
 */
const Sidebar = ({ activeTab, onTabChange, isMobileOpen, onClose, userRole }) => {
  const seekerItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'bookings', label: 'My Bookings', icon: CalendarDays },
    { id: 'saved', label: 'Saved Spots', icon: Heart },
  ];

  const hostItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'listings', label: 'My Listings', icon: ListIcon },
    { id: 'requests', label: 'Booking Requests', icon: CalendarDays },
  ];

  const items = userRole === 'host' || userRole === 'both' ? hostItems : seekerItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 z-50
          w-64 transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <button onClick={onClose} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onClose();
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

/**
 * Seeker Dashboard View
 */
const SeekerDashboard = ({ bookings, savedSpots, loading }) => {
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.startTime) > new Date()
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.endTime) < new Date())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={CalendarDays}
          title="Upcoming Bookings"
          value={upcomingBookings.length}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          title="Past Bookings"
          value={pastBookings.length}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={Heart}
          title="Saved Spots"
          value={savedSpots.length}
          color="red"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/search">
            <QuickActionCard
              icon={Search}
              title="Search Parking"
              description="Find parking spots near you"
              color="blue"
            />
          </Link>
          <Link to="/bookings">
            <QuickActionCard
              icon={History}
              title="View History"
              description="Check your booking history"
              color="purple"
            />
          </Link>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
          <Link to="/bookings">
            <Button size="sm" variant="ghost">
              View All
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onViewDetails={(b) => (window.location.href = `/bookings/${b._id}`)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming bookings</h3>
            <p className="text-gray-600 mb-4">Start searching for parking spots</p>
            <Link to="/search">
              <Button>Search Parking</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Saved Spots */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Saved Spots</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : savedSpots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSpots.slice(0, 3).map((spot) => (
              <SavedSpotCard
                key={spot._id}
                spot={spot}
                onRemove={() => toast.success('Removed from saved')}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved spots</h3>
            <p className="text-gray-600">Save your favorite parking spots for quick access</p>
          </Card>
        )}
      </div>
    </div>
  );
};

/**
 * Host Dashboard View
 */
const HostDashboard = ({ listings, bookings, loading }) => {
  const totalEarnings = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const activeListings = listings.filter((l) => l.isActive);
  const pendingRequests = bookings.filter((b) => b.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          title="Total Earnings"
          value={`₹${totalEarnings.toLocaleString()}`}
          change={12}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={ListIcon}
          title="Active Listings"
          value={activeListings.length}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={CalendarDays}
          title="Booking Requests"
          value={pendingRequests.length}
          color="yellow"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          title="This Month"
          value={`₹${Math.floor(totalEarnings * 0.3).toLocaleString()}`}
          change={8}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/my-spots/new">
            <QuickActionCard
              icon={PlusCircle}
              title="Add New Listing"
              description="List a new parking spot"
              color="blue"
            />
          </Link>
          <Link to="/earnings">
            <QuickActionCard
              icon={Eye}
              title="View Earnings"
              description="Check your earnings details"
              color="green"
            />
          </Link>
        </div>
      </div>

      {/* Earnings Chart Placeholder */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings Overview</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Chart coming soon</p>
          </div>
        </div>
      </Card>

      {/* Booking Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Booking Requests</h2>
          <Link to="/my-spots">
            <Button size="sm" variant="ghost">
              View All
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.slice(0, 3).map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onViewDetails={(b) => (window.location.href = `/bookings/${b._id}`)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
            <p className="text-gray-600">You&apos;re all caught up!</p>
          </Card>
        )}
      </div>
    </div>
  );
};

/**
 * Main Dashboard Component
 */
const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [savedSpots, setSavedSpots] = useState([]);

  const userRole = user?.role || 'seeker';
  const isHost = userRole === 'host' || userRole === 'both';

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsData, listingsData] = await Promise.all([
        bookingService.getMyBookings(),
        isHost ? spotService.getMySpots() : Promise.resolve({ data: [] }),
      ]);

      setBookings(bookingsData.data || []);
      setListings(listingsData.data || []);
      setSavedSpots([]); // TODO: Implement saved spots API
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Dashboard</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isMobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600">
                {isHost
                  ? "Here's what's happening with your listings"
                  : 'Manage your parking bookings'}
              </p>
            </div>

            {/* Dashboard Content */}
            {isHost ? (
              <HostDashboard bookings={bookings} listings={listings} loading={loading} />
            ) : (
              <SeekerDashboard
                bookings={bookings}
                savedSpots={savedSpots}
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-4 gap-1 p-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center py-2 px-1 rounded-lg ${
              activeTab === 'overview' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <BarChart3 className="w-6 h-6 mb-1" />
            <span className="text-xs">Overview</span>
          </button>
          <button
            onClick={() => (window.location.href = '/bookings')}
            className="flex flex-col items-center py-2 px-1 rounded-lg text-gray-600"
          >
            <CalendarDays className="w-6 h-6 mb-1" />
            <span className="text-xs">Bookings</span>
          </button>
          {isHost && (
            <button
              onClick={() => (window.location.href = '/my-spots')}
              className="flex flex-col items-center py-2 px-1 rounded-lg text-gray-600"
            >
              <ListIcon className="w-6 h-6 mb-1" />
              <span className="text-xs">Listings</span>
            </button>
          )}
          <button
            onClick={() => (window.location.href = '/profile')}
            className="flex flex-col items-center py-2 px-1 rounded-lg text-gray-600"
          >
            <Eye className="w-6 h-6 mb-1" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
