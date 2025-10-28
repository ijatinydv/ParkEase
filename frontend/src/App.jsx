import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import Context Providers
import { AuthProvider } from './context/AuthContext';

// Import Pages (will be created later)
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// ... other imports

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50">
        {/* Toast Notifications */}
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

        {/* Routes */}
        <Routes>
          {/* Home Route */}
          <Route path="/" element={<div className="p-8 text-center">
            <h1 className="text-4xl font-bold text-primary-600 mb-4">Welcome to ParkEase</h1>
            <p className="text-neutral-600">Your P2P Parking Marketplace</p>
            <p className="text-sm text-neutral-500 mt-4">Setup complete! Start building your components.</p>
          </div>} />

          {/* Auth Routes */}
          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/register" element={<Register />} /> */}

          {/* Other Routes will be added here */}
          
          {/* 404 Route */}
          <Route path="*" element={<div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-danger-600">404 - Page Not Found</h1>
          </div>} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
