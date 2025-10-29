import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@context/AuthContext';

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
      <Route path="/search" element={<SearchPage />} />
      <Route path="/spots/:id" element={<SpotDetailsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
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
            <DashboardPage />
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
            <BookingsPage />
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

      {/* Provider Routes */}
      <Route
        path="/my-spots"
        element={
          <ProtectedRoute>
            <MySpotsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-spots/new"
        element={
          <ProtectedRoute>
            <CreateSpotPage />
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

const SearchPage = () => <div className="p-8">Search Page</div>;
const SpotDetailsPage = () => <div className="p-8">Spot Details Page</div>;
const AboutPage = () => <div className="p-8">About Page</div>;
const ContactPage = () => <div className="p-8">Contact Page</div>;
const LoginPage = () => <div className="p-8">Login Page</div>;
const RegisterPage = () => <div className="p-8">Register Page</div>;
const ForgotPasswordPage = () => <div className="p-8">Forgot Password Page</div>;
const ResetPasswordPage = () => <div className="p-8">Reset Password Page</div>;
const DashboardPage = () => <div className="p-8">Dashboard Page</div>;
const ProfilePage = () => <div className="p-8">Profile Page</div>;
const BookingsPage = () => <div className="p-8">Bookings Page</div>;
const BookingDetailsPage = () => <div className="p-8">Booking Details Page</div>;
const MySpotsPage = () => <div className="p-8">My Spots Page</div>;
const CreateSpotPage = () => <div className="p-8">Create Spot Page</div>;
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
