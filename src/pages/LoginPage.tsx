import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { user, loginWithEmail, registerWithEmail, loginWithGoogle, sendPasswordReset } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Forgot password countdown state
  const [countdown, setCountdown] = useState<number>(0);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          showToast('Please enter your full name.', 'warning');
          setSubmitting(false);
          return;
        }
        await registerWithEmail(name.trim(), email.trim(), password);
        showToast(`Account created successfully! Welcome, ${name}!`, 'success');
      } else {
        await loginWithEmail(email.trim(), password);
        showToast('Welcome back to Study Book!', 'success');
      }
      navigate('/');
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.message || 'Authentication failed.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      showToast('Signed in successfully with Google!', 'success');
      navigate('/');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(`Google Sign-In failed: ${err.message}`, 'error');
      }
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email address in the email field first.', 'warning');
      return;
    }
    if (countdown > 0) return;

    try {
      await sendPasswordReset(email.trim());
      showToast('Password reset link sent! Check your email inbox.', 'success');
      setCountdown(60);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '30px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '960px',
          gap: '40px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Left Side: Graphic & Greeting */}
        <div className="login-graphic-column" style={{ flex: '1 1 340px', textAlign: 'center' }}>
          <div className="internal-hero" style={{ padding: 0, margin: 0, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
              {isRegister ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-light)', marginBottom: '24px' }}>
              {isRegister
                ? 'Join Study Book to save notes, track progress, and contribute.'
                : 'Sign in to access your saved notes, bookmarks, and tools.'}
            </p>
          </div>
          <img
            src="/assets/login.png.png"
            alt="Study Smarter"
            className="login-page-image"
            style={{ maxWidth: '280px', width: '100%', height: 'auto', margin: '0 auto' }}
          />
        </div>

        {/* Right Side: Form Card */}
        <div style={{ flex: '1 1 360px', maxWidth: '440px', width: '100%' }}>
          <div className="card" style={{ padding: '32px' }}>
            {/* Tabs */}
            <div className="tabs-container" style={{ marginBottom: '24px' }}>
              <button
                className={`tab-btn ${!isRegister ? 'active' : ''}`}
                onClick={() => setIsRegister(false)}
                style={{ flex: 1 }}
              >
                Login
              </button>
              <button
                className={`tab-btn ${isRegister ? 'active' : ''}`}
                onClick={() => setIsRegister(true)}
                style={{ flex: 1 }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={isRegister ? 'Create a strong password' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {!isRegister && (
                <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={countdown > 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--blue-accent)',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                      opacity: countdown > 0 ? 0.6 : 1,
                    }}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Forgot Password?'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                className={`btn ${isRegister ? 'btn-blue' : 'btn-purple'} full-width`}
                disabled={submitting}
                style={{ padding: '14px', fontSize: '1.05rem', borderRadius: '10px' }}
              >
                {submitting
                  ? 'Please wait...'
                  : isRegister
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '20px 0 15px', color: 'var(--text-light)', fontSize: '0.88rem' }}>
              Or continue with
            </div>

            <button
              type="button"
              className="btn btn-outline full-width"
              onClick={handleGoogleLogin}
              style={{ padding: '12px', borderRadius: '10px', gap: '10px', fontWeight: 600 }}
            >
              <i className="fab fa-google" style={{ color: '#DB4437' }}></i> Continue with Google
            </button>

            {isRegister && (
              <p
                style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  color: 'var(--text-light)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                }}
              >
                By registering, you agree to our{' '}
                <Link to="/terms-and-conditions" style={{ color: 'var(--blue-accent)' }}>
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" style={{ color: 'var(--blue-accent)' }}>
                  Privacy Policy
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
