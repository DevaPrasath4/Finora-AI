import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesGrid from './components/FeaturesGrid';
import RoleShowcase from './components/RoleShowcase';
import AiDemoSimulator from './components/AiDemoSimulator';
import RoiCalculator from './components/RoiCalculator';
import PricingSection from './components/PricingSection';
import TestimonialsSection from './components/TestimonialsSection';
import Footer from './components/Footer';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import BusinessOwnerDashboard from './pages/BusinessOwnerDashboard';
import UploadInvoiceFullPage from './pages/UploadInvoiceFullPage';
import CreateInvoiceFullPage from './pages/CreateInvoiceFullPage';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginRole, setLoginRole] = useState(null);
  const [ownerId, setOwnerId] = useState('');
  const [ownerPass, setOwnerPass] = useState('');
  const [dashboardCompanyName, setDashboardCompanyName] = useState('Metro Superstore Ltd');
  const [dashboardOwnerName, setDashboardOwnerName] = useState('Business Owner');

  const handleOpenSignup = () => {
    navigate('/signup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLogin = (role = null, generatedId = '', generatedPass = '', compName = '', userEmail = '') => {
    setLoginRole(role);
    setOwnerId(generatedId);
    setOwnerPass(generatedPass);
    if (compName) setDashboardCompanyName(compName);
    if (userEmail) setDashboardOwnerName(userEmail);
    navigate('/login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDashboard = (role = 'owner', compName = '', userEmail = '') => {
    if (compName) setDashboardCompanyName(compName);
    if (userEmail) setDashboardOwnerName(userEmail);
    navigate('/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Routes>
      {/* ── 1. LANDING PAGE ROUTE (/) ───────────────────────────── */}
      <Route
        path="/"
        element={
          <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#FFFFFF', overflowX: 'hidden' }}>
            <Navbar
              onOpenModal={(type) => {
                if (type === 'login') handleOpenLogin();
                else if (type === 'dashboard') handleOpenDashboard();
                else handleOpenSignup();
              }}
            />
            <main>
              <HeroSection
                onOpenModal={(type) => {
                  if (type === 'login') handleOpenLogin();
                  else if (type === 'dashboard') handleOpenDashboard();
                  else handleOpenSignup();
                }}
              />
              <FeaturesGrid />
              <RoleShowcase
                onOpenModal={() => handleOpenLogin()}
              />
              <AiDemoSimulator />
              <RoiCalculator />
              <PricingSection
                onOpenModal={(type) => {
                  if (type === 'login') handleOpenLogin();
                  else if (type === 'dashboard') handleOpenDashboard();
                  else handleOpenSignup();
                }}
              />
              <Footer
                onOpenModal={(type) => {
                  if (type === 'login') handleOpenLogin();
                  else if (type === 'dashboard') handleOpenDashboard();
                  else handleOpenSignup();
                }}
              />
            </main>
          </div>
        }
      />

      {/* ── 2. LOGIN PAGE ROUTE (/login) ────────────────────────── */}
      <Route
        path="/login"
        element={
          <LoginPage
            onBack={handleBackToLanding}
            initialRole={loginRole}
            initialOwnerId={ownerId}
            initialOwnerPass={ownerPass}
            onNavigateToDashboard={handleOpenDashboard}
          />
        }
      />

      {/* ── 3. SIGNUP PAGE ROUTE (/signup) ──────────────────────── */}
      <Route
        path="/signup"
        element={
          <SignupPage
            onBack={handleBackToLanding}
            onNavigateToLogin={(role, genId, genPass, compName, userEmail) => handleOpenLogin(role, genId, genPass, compName, userEmail)}
          />
        }
      />

      {/* ── 4. OWNER DASHBOARD ROUTE (/dashboard) ───────────────── */}
      <Route
        path="/dashboard"
        element={
          <BusinessOwnerDashboard
            companyName={dashboardCompanyName}
            ownerName={dashboardOwnerName}
            onLogout={handleBackToLanding}
            onOpenUploadPage={() => navigate('/upload-invoice')}
            onOpenBillingPage={() => navigate('/create-invoice')}
          />
        }
      />

      {/* ── 5. DASHBOARD MODULE PARAM ROUTE (/dashboard/:moduleId) ── */}
      <Route
        path="/dashboard/:moduleId"
        element={
          <BusinessOwnerDashboard
            companyName={dashboardCompanyName}
            ownerName={dashboardOwnerName}
            onLogout={handleBackToLanding}
            onOpenUploadPage={() => navigate('/upload-invoice')}
            onOpenBillingPage={() => navigate('/create-invoice')}
          />
        }
      />

      {/* ── 6. UPLOAD INVOICE FULL PAGE (/upload-invoice) ───────── */}
      <Route
        path="/upload-invoice"
        element={
          <UploadInvoiceFullPage
            onBack={handleBackToDashboard}
            onInvoiceSaved={handleBackToDashboard}
          />
        }
      />

      {/* ── 7. CREATE CUSTOMER BILL FULL PAGE (/create-invoice) ──── */}
      <Route
        path="/create-invoice"
        element={
          <CreateInvoiceFullPage
            onBack={handleBackToDashboard}
            onInvoiceCreated={handleBackToDashboard}
          />
        }
      />

      {/* Fallback redirect to / */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
