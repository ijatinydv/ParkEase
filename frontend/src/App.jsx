import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@context/AuthContext';

// Page imports
import Dashboard from '@pages/Dashboard';
import MyBookings from '@pages/MyBookings';
import MyListings from '@pages/MyListings';
import AddListing from '@pages/AddListing';
import Login from '@pages/Login';
import Register from '@pages/Register';
import Search from '@pages/Search';
import SpotDetails from '@pages/SpotDetails';
import BookingConfirmation from '@pages/BookingConfirmation';

/**
 * Protected Route Component
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * Public Route Component (redirect if authenticated)
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

/**
 * App Routes Component
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<Search />} />
      <Route path="/spots/:id" element={<SpotDetails />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute>
            <BookingDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking-confirmation/:bookingId"
        element={
          <ProtectedRoute>
            <BookingConfirmation />
          </ProtectedRoute>
        }
      />

      {/* Provider Routes */}
      <Route
        path="/my-spots"
        element={
          <ProtectedRoute>
            <MyListings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-spots/new"
        element={
          <ProtectedRoute>
            <AddListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-spots/:id/edit"
        element={
          <ProtectedRoute>
            <EditSpotPage />
          </ProtectedRoute>
        }
      />

      {/* Payment Routes */}
      <Route
        path="/payment/:bookingId"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/success"
        element={
          <ProtectedRoute>
            <PaymentSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/failed"
        element={
          <ProtectedRoute>
            <PaymentFailedPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

/**
 * Placeholder Pages (to be implemented)
 */
const HomePage = () => (
  <div className="p-8 text-center">
    <h1 className="text-4xl font-bold text-primary-600 mb-4">Welcome to ParkEase</h1>
    <p className="text-neutral-600">Your P2P Parking Marketplace</p>
  </div>
);

const AboutPage = () => <div className="p-8">About Page</div>;
const ContactPage = () => <div className="p-8">Contact Page</div>;
const ForgotPasswordPage = () => <div className="p-8">Forgot Password Page</div>;
const ResetPasswordPage = () => <div className="p-8">Reset Password Page</div>;
const ProfilePage = () => <div className="p-8">Profile Page</div>;
const BookingDetailsPage = () => <div className="p-8">Booking Details Page</div>;
const EditSpotPage = () => <div className="p-8">Edit Spot Page</div>;
const PaymentPage = () => <div className="p-8">Payment Page</div>;
const PaymentSuccessPage = () => <div className="p-8">Payment Success Page</div>;
const PaymentFailedPage = () => <div className="p-8">Payment Failed Page</div>;
const NotFoundPage = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-danger-600">404 - Page Not Found</h1>
  </div>
);

/**
 * Main App Component
 */
function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <AppRoutes />
      </div>
    </AuthProvider>
  );
}

export default App;
