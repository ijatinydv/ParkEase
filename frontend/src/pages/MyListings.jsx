import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import spotService from '@services/spotService';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Spinner from '@components/common/Spinner';
import Modal from '@components/common/Modal';
import toast from 'react-hot-toast';
import {
  PlusCircle,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Star,
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
} from 'lucide-react';

/**
 * Listing Card Component
 */
const ListingCard = ({ spot, onEdit, onDelete, onToggleStatus, onView, viewMode = 'grid' }) => {
  const [isActive, setIsActive] = useState(spot.isActive);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    try {
      setToggling(true);
      await onToggleStatus(spot._id, !isActive);
      setIsActive(!isActive);
      toast.success(`Listing ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-all">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Image */}
          <div className="md:w-48 h-48 md:h-auto">
            <img
              src={spot.images?.[0] || '/placeholder-parking.jpg'}
              alt={spot.title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{spot.title}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {spot.address}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isActive ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="font-semibold text-gray-900">₹{spot.pricePerHour}/hr</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="font-semibold text-gray-900 capitalize">{spot.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Bookings</p>
                <p className="font-semibold text-gray-900">{spot.bookingsCount || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">
                    {spot.rating?.toFixed(1) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <Button size="sm" variant="outline" icon={Eye} onClick={() => onView(spot)}>
                View
              </Button>
              <Button size="sm" variant="outline" icon={Edit} onClick={() => onEdit(spot)}>
                Edit
              </Button>
              <button
                onClick={handleToggle}
                disabled={toggling}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {toggling ? (
                  <Spinner size="sm" />
                ) : isActive ? (
                  <ToggleRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                )}
                {isActive ? 'Active' : 'Inactive'}
              </button>
              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => onDelete(spot)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group hover:shadow-xl transition-all">
      {/* Image */}
      <div className="relative h-48 mb-4">
        <img
          src={spot.images?.[0] || '/placeholder-parking.jpg'}
          alt={spot.title}
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {isActive ? (
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full shadow-md">
              Active
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded-full shadow-md">
              Inactive
            </span>
          )}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg" />
      </div>

      {/* Content */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{spot.title}</h3>
        <p className="text-sm text-gray-600 flex items-center gap-1 mb-3 line-clamp-1">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          {spot.address}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-1">Bookings</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {spot.bookingsCount || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Rating</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              {spot.rating?.toFixed(1) || 'N/A'}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-xl font-bold text-gray-900">₹{spot.pricePerHour}</span>
            <span className="text-sm text-gray-600">/hr</span>
          </div>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
            {spot.type}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" icon={Edit} onClick={() => onEdit(spot)} fullWidth>
              Edit
            </Button>
            <Button size="sm" variant="outline" icon={Eye} onClick={() => onView(spot)} fullWidth>
              View
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`
                flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }
                disabled:opacity-50
              `}
            >
              {toggling ? (
                <Spinner size="sm" />
              ) : isActive ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              {isActive ? 'Active' : 'Inactive'}
            </button>
            <Button
              size="sm"
              variant="danger"
              icon={Trash2}
              onClick={() => onDelete(spot)}
              fullWidth
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Delete Confirmation Modal
 */
const DeleteModal = ({ isOpen, onClose, onConfirm, spotTitle }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Delete Listing">
    <div className="p-6">
      <p className="text-gray-700 mb-6">
        Are you sure you want to delete <strong>{spotTitle}</strong>? This action cannot be
        undone.
      </p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </div>
  </Modal>
);

/**
 * Empty State Component
 */
const EmptyState = () => (
  <Card className="p-12 text-center">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <MapPin className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      Start earning by listing your parking spot. It only takes a few minutes!
    </p>
    <Link to="/my-spots/new">
      <Button icon={PlusCircle} size="lg">
        Add Your First Listing
      </Button>
    </Link>
  </Card>
);

/**
 * Main MyListings Component
 */
const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, spot: null });

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterAndSortListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, searchQuery, sortBy, filterStatus]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await spotService.getMySpots();
      setListings(response.data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortListings = () => {
    let filtered = [...listings];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (spot) =>
          spot.title?.toLowerCase().includes(query) ||
          spot.address?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter((spot) => spot.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((spot) => !spot.isActive);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'price-high':
        filtered.sort((a, b) => b.pricePerHour - a.pricePerHour);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.pricePerHour - b.pricePerHour);
        break;
      case 'bookings':
        filtered.sort((a, b) => (b.bookingsCount || 0) - (a.bookingsCount || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    setFilteredListings(filtered);
  };

  const handleEdit = (spot) => {
    window.location.href = `/my-spots/${spot._id}/edit`;
  };

  const handleView = (spot) => {
    window.location.href = `/spots/${spot._id}`;
  };

  const handleDelete = (spot) => {
    setDeleteModal({ isOpen: true, spot });
  };

  const confirmDelete = async () => {
    try {
      await spotService.deleteSpot(deleteModal.spot._id);
      toast.success('Listing deleted successfully');
      setDeleteModal({ isOpen: false, spot: null });
      fetchListings();
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const handleToggleStatus = async (spotId, newStatus) => {
    await spotService.updateSpot(spotId, { isActive: newStatus });
    fetchListings();
  };

  const stats = {
    total: listings.length,
    active: listings.filter((s) => s.isActive).length,
    inactive: listings.filter((s) => !s.isActive).length,
    totalBookings: listings.reduce((sum, s) => sum + (s.bookingsCount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
              <p className="text-gray-600">Manage your parking spot listings</p>
            </div>
            <Link to="/my-spots/new">
              <Button icon={PlusCircle} size="lg">
                Add New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Listings</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Inactive</p>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Button */}
            <Button
              variant="outline"
              icon={SlidersHorizontal}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="bookings">Most Bookings</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Listings Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : filteredListings.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredListings.map((spot) => (
              <ListingCard
                key={spot._id}
                spot={spot}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onView={handleView}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : searchQuery || filterStatus !== 'all' ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, spot: null })}
        onConfirm={confirmDelete}
        spotTitle={deleteModal.spot?.title}
      />
    </div>
  );
};

export default MyListings;
