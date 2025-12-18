import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef(null);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            setRateLimitInfo(null);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (countdown > 0) {
      return; // Prevent submission during rate limit
    }

    setError('');
    setRateLimitInfo(null);
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      const errorData = err.response?.data;
      
      // Check if it's a rate limit error (429)
      if (err.response?.status === 429 && errorData) {
        setRateLimitInfo({
          message: errorData.message || 'Too many attempts',
          retryAfter: errorData.retryAfter || 0,
          retryAfterMinutes: errorData.retryAfterMinutes || 0,
          limit: errorData.limit,
          current: errorData.current
        });
        setCountdown(errorData.retryAfter || 900); // Default to 15 minutes if not provided
        setError(errorData.message || 'Too many login attempts. Please try again later.');
      } else {
        setError(errorData?.error || errorData?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">CRM</h1>
          <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {rateLimitInfo && countdown > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Too Many Login Attempts</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{rateLimitInfo.message}</p>
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-yellow-900">
                        {formatTime(countdown)}
                      </div>
                      <div className="text-xs text-yellow-600">Time remaining</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-yellow-900">
                        {rateLimitInfo.current}/{rateLimitInfo.limit}
                      </div>
                      <div className="text-xs text-yellow-600">Attempts used</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && !rateLimitInfo && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={countdown > 0}
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={countdown > 0}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={loading || countdown > 0}
          >
            {countdown > 0 
              ? `Locked - Wait ${formatTime(countdown)}` 
              : loading 
                ? 'Signing in...' 
                : 'Sign In'}
          </Button>
        </form>

        {/* <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign up
          </Link>
        </p> */}
      </div>
    </div>
  );
};
