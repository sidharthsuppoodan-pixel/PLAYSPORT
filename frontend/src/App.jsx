import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

// Pages
import HomePage from './pages/HomePage';
import TurfListingPage from './pages/TurfListingPage';
import TurfDetailPage from './pages/TurfDetailPage';
import OpenMatchesPage from './pages/OpenMatchesPage';
import TournamentsPage from './pages/TournamentsPage';
import EquipmentPage from './pages/EquipmentPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import PricingPage from './pages/PricingPage';

// Protected Route Guards
const AdminRoute = ({ children, onOpenAuth }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xs">Verifying admin permissions...</div>;
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const OwnerRoute = ({ children, onOpenAuth }) => {
  const { user, isOwner, isAdmin, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xs">Verifying owner permissions...</div>;
  if (!user || (!isOwner && !isAdmin)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppContent() {
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const openAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Hide main navbar on full-screen admin/owner dashboards for clean sidebar view
  const isDashboardRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenAuth={openAuth} />
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage onOpenAuth={openAuth} />} />
          <Route path="/turfs" element={<TurfListingPage onOpenAuth={openAuth} />} />
          <Route path="/turfs/:idOrSlug" element={<TurfDetailPage onOpenAuth={openAuth} />} />
          <Route path="/open-matches" element={<OpenMatchesPage onOpenAuth={openAuth} />} />
          <Route path="/tournaments" element={<TournamentsPage onOpenAuth={openAuth} />} />
          <Route path="/equipment" element={<EquipmentPage onOpenAuth={openAuth} />} />
          <Route path="/pricing" element={<PricingPage onOpenAuth={openAuth} />} />
          <Route path="/my-bookings" element={<MyBookingsPage onOpenAuth={openAuth} />} />

          {/* Super Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute onOpenAuth={openAuth}>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          {/* Turf Owner Dashboard */}
          <Route
            path="/owner/dashboard"
            element={
              <OwnerRoute onOpenAuth={openAuth}>
                <OwnerDashboardPage />
              </OwnerRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isDashboardRoute && <Footer />}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
