import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ViewerPage } from './pages/ViewerPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { AccountPage } from './pages/AccountPage';
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsConditionsPage } from './pages/TermsConditionsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Helper component to preserve query strings on legacy redirect
const RedirectWithQuery: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Main App Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="calculator" element={<CalculatorPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms-and-conditions" element={<TermsConditionsPage />} />

                {/* PDF Viewer routes */}
                <Route path="notes/:slug" element={<ViewerPage />} />
                <Route path="viewer" element={<ViewerPage />} />

                {/* Legacy URL Compatibility Redirects */}
                <Route path="index.html" element={<RedirectWithQuery to="/" />} />
                <Route path="search.html" element={<RedirectWithQuery to="/search" />} />
                <Route path="viewer.html" element={<RedirectWithQuery to="/viewer" />} />
                <Route path="calculator.html" element={<RedirectWithQuery to="/calculator" />} />
                <Route path="account.html" element={<RedirectWithQuery to="/account" />} />
                <Route path="login.html" element={<RedirectWithQuery to="/login" />} />
                <Route path="about.html" element={<RedirectWithQuery to="/about" />} />
                <Route path="contact.html" element={<RedirectWithQuery to="/contact" />} />
                <Route path="privacy_policy.html" element={<RedirectWithQuery to="/privacy-policy" />} />
                <Route path="terms_conditions.html" element={<RedirectWithQuery to="/terms-and-conditions" />} />

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
