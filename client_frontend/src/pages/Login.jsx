import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import api from "../api/api";
import logoImage from "../logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    postcode: "",
    agreeToTerms: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Helper function to generate username from email (same logic as signup)
  const generateUsernameFromEmail = (email) => {
    if (!email) return "";
    // Use email prefix (before @) as username, sanitize it
    const emailPrefix = email.split("@")[0].toLowerCase();
    // Remove any invalid characters, keep only alphanumeric, _, @, +, ., -
    return emailPrefix.replace(/[^a-z0-9_@.+-]/g, '_').substring(0, 150);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (isSignup && !formData.name) {
      alert("Please fill in all required fields");
      return;
    }

    if (!formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }

    if (!formData.agreeToTerms) {
      alert("Please agree to the Terms & Privacy");
      return;
    }

    try {
      if (isSignup) {
        // Generate username from email (same logic as login)
        const username = generateUsernameFromEmail(formData.email);

        // Signup flow
        await api.post("/api/accounts/signup/", {
          username: username,
          email: formData.email,
          password: formData.password,
          postcode: formData.postcode,
        });

        // After successful signup, automatically log in using email
        const loginResponse = await api.post("/api/accounts/login/", {
          email: formData.email,  // Use email for login (backend supports both)
          password: formData.password,
        });

        const { access, refresh } = loginResponse.data;

        const userData = {
          name: formData.name || formData.email.split("@")[0],
          email: formData.email,
        };

        login(userData, access);
        localStorage.setItem("refresh_token", refresh);
        navigate("/dashboard", { replace: true });
      } else {
        // Login flow - use email directly (backend supports both email and username)
        const response = await api.post("/api/accounts/login/", {
          email: formData.email,  // Send email directly instead of username
          password: formData.password,
        });

        const { access, refresh } = response.data;

        const userData = {
          name: formData.name || formData.email.split("@")[0],
          email: formData.email,
        };

        login(userData, access);
        localStorage.setItem("refresh_token", refresh);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Authentication error:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
      }

      // Better error message handling
      let errorMessage = "Authentication failed. Please try again.";

      // Check for connection errors first
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED' || 
          error.message?.includes('Network Error') || error.message?.includes('Connection refused') ||
          error.message?.includes('Failed to fetch')) {
        // Get the actual API base URL being used
        const apiUrl = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
        if (apiUrl.includes('127.0.0.1') || apiUrl.includes('localhost')) {
          errorMessage = "Configuration Error: Frontend is trying to connect to localhost. Please set REACT_APP_API_BASE_URL environment variable in Vercel to your Railway backend URL (e.g., https://backend-production-5fef.up.railway.app)";
        } else {
          errorMessage = `Cannot connect to server at ${apiUrl}. Please check if the backend is running or try again later.`;
        }
      } else if (error.response?.data) {
        const errorData = error.response.data;

        // Handle validation errors (usually objects with field names as keys)
        if (typeof errorData === 'object' && !errorData.detail && !errorData.message && !errorData.error) {
          const errorFields = Object.keys(errorData);
          const errorMessages = errorFields.map(field => {
            const fieldErrors = Array.isArray(errorData[field])
              ? errorData[field].join(', ')
              : errorData[field];
            return `${field}: ${fieldErrors}`;
          });
          errorMessage = errorMessages.join('\n');
        } else {
          // Check for specific error messages 
          errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-inter">
      {/* Left Section - Teal Background */}
      <div className="lg:w-[40%] bg-sidebar lg:rounded-r-3xl flex flex-col justify-between p-8 lg:p-12 text-white">
        <div>
          {/* Logo */}
          <div className="mb-8 lg:mb-16 flex justify-end ">
            <img
              src={logoImage}
              alt="Service Charge UK"
              className="h-22 lg:h-40 w-auto object-contain"
              style={{ display: 'block' }}
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        <div className="hidden lg:block">
          <h1 className="text-5xl font-bold mb-4">Maximize Your Savings.</h1>
          <p className="text-xl font-normal">
            For a brighter, more transparent tomorrow.
          </p>
        </div>
      </div>

      {/* Right Section - White Background with Form */}
      <div className="flex-1 lg:w-[60%] flex items-center justify-center p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Get Started.
            </h2>
            <p className="text-base text-gray-600">
              {isSignup ? "Create an account to continue." : "Log in to continue."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field - Only shown in signup mode */}
            {isSignup && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 border border-sidebar rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar focus:border-transparent text-sm"
                />
              </div>
            )}
            {/* Postcode Field - Add this */}
            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                Postcode <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                placeholder="Enter your postcode (e.g., SW18 1UZ)"
                className="w-full px-4 py-3 border border-sidebar rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar focus:border-transparent text-sm"
              />
            </div>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email..."
                className="w-full px-4 py-3 border border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar focus:border-transparent text-sm"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password..."
                  className="w-full px-4 py-3 border border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar focus:border-transparent text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms & Privacy Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-sidebar text-sidebar"
              />
              <label
                htmlFor="agreeToTerms"
                className="text-sm text-gray-700 cursor-pointer"
              >
                I agree to the Terms & Privacy
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-sidebar text-white py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors text-sm"
            >
              {isSignup ? "Sign Up" : "Log In"}
            </button>

            {/* Toggle between Login and Signup */}
            <div className="text-center text-sm text-gray-600">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignup(false)}
                    className="text-blue-600 hover:text-blue-700 bg-transparent border-none p-0 cursor-pointer"
                  >
                    Log In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignup(true)}
                    className="text-blue-600 hover:text-blue-700 bg-transparent border-none p-0 cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="w-full px-4 py-3 border border-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                {/* Social icon placeholder */}
              </button>
              <button
                type="button"
                className="w-full px-4 py-3 border border-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                {/* Social icon placeholder */}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

