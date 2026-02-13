import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { checkAdminOAuthStatus, initiateAdminGoogleOAuth } from '../services/googleOAuthService';
import { CheckCircle, Edit2, Save, X, Settings } from 'lucide-react';
import api from '../api/api';

// Admin email - only these user can see admin connection UI
const ADMIN_EMAILS = ['accounts@servicechargeuk.com', 'scuk027@gmail.com'];

const MyAccount = () => {
    const { user: authUser, isAuthenticated } = useAuth();
    // const [oauthStatus, setOauthStatus] = useState({ is_connected: false, is_expired: false });
    const [adminOAuthStatus, setAdminOAuthStatus] = useState({ connected: false, is_expired: false });
    // const [isConnecting, setIsConnecting] = useState(false);
    const [isConnectingAdmin, setIsConnectingAdmin] = useState(false);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        postcode: '',
        address: '',
        tax_id: '',
    });

    const isAdmin = (authUser?.email && ADMIN_EMAILS.includes(authUser.email)) || (profileData?.email && ADMIN_EMAILS.includes(profileData.email));

    const checkAdminOAuthStatusHandler = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            
            // Only check if user is admin
            if (!isAdmin) {
                return;
            }
            
            const status = await checkAdminOAuthStatus();
            setAdminOAuthStatus(status);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error checking admin OAuth status:', error);
            }
        }
    }, [isAdmin]);

    const fetchProfileData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/accounts/profile/');
            const data = response.data;
            setProfileData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || authUser?.email || '',
                phone: data.phone || '',
                country: data.country || '',
                city: data.city || '',
                postcode: data.postcode || '',
                address: data.address || '',
                tax_id: data.tax_id || '',
            });
            
            // Check admin OAuth status after profile is loaded (if user is admin)
            if ((authUser?.email && ADMIN_EMAILS.includes(authUser.email)) || (data.email && ADMIN_EMAILS.includes(data.email))) {
                checkAdminOAuthStatusHandler();
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error fetching profile:', error);
            }
            // If profile doesn't exist, use auth user data
            setProfileData({
                first_name: '',
                last_name: '',
                email: authUser?.email || '',
                phone: '',
                country: '',
                city: '',
                postcode: '',
                address: '',
                tax_id: '',
            });
            
            // Check admin OAuth status if user is admin (even if profile fetch failed)
            if (authUser?.email && ADMIN_EMAILS.includes(authUser.email)) {
                checkAdminOAuthStatusHandler();
            }
        } finally {
            setIsLoading(false);
        }
    }, [authUser?.email, checkAdminOAuthStatusHandler]);

    // Fetch profile data on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchProfileData();
            // checkOAuthStatus();
        }
        
        // Check for OAuth callback messages in URL
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const error = urlParams.get('error');
        const adminSuccess = urlParams.get('admin_connected');
        const adminError = urlParams.get('admin_error');
        
        // Handle admin OAuth callback
        if (adminSuccess === 'true') {
            setMessage('Admin Google account connected successfully!');
            setTimeout(() => setMessage(''), 5000);
            setTimeout(() => {
                checkAdminOAuthStatusHandler();
            }, 1000);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (adminError) {
            setMessage(`Admin OAuth Error: ${adminError}`);
            setTimeout(() => setMessage(''), 5000);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Handle user OAuth callback
        
        // Debug logging (only in development)
        if ((success || error) && process.env.NODE_ENV === 'development') {
            console.log('OAuth callback detected:', { success, error, fullURL: window.location.href });
        }
        
        if (success === 'connected') {
            
        } else if (error) {
            let errorMessage = `Error: ${error}`;
            // Make error messages more user-friendly
            if (error === 'session_expired') {
                errorMessage = 'Session expired. Please try connecting again.';
            } else if (error === 'invalid_state') {
                errorMessage = 'Security verification failed. Please try connecting again.';
            } else if (error === 'no_code') {
                errorMessage = 'Authorization code not received. Please try again.';
            } else if (error === 'user_not_found') {
                errorMessage = 'User account not found. Please log in again.';
            }
            setMessage(errorMessage);
            setTimeout(() => setMessage(''), 5000);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [isAuthenticated, fetchProfileData, checkAdminOAuthStatusHandler]);

    
    const handleConnectAdminGoogle = async () => {
        try {
            setIsConnectingAdmin(true);
            
            const token = localStorage.getItem("token");
            if (!token) {
                setMessage('Please login first before connecting admin Google account.');
                setIsConnectingAdmin(false);
                return;
            }
            
            const response = await initiateAdminGoogleOAuth();
            
            if (response && response.auth_url) {
                window.location.href = response.auth_url;
            } else {
                throw new Error('No authorization URL received');
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error initiating admin OAuth:', error);
            }
            
            let errorMessage = 'Failed to initiate admin Google connection. Please try again.';
            
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = 'Authentication required. Please login again.';
                } else if (error.response.status === 500) {
                    errorMessage = error.response.data?.error || 'Server error. Please check OAuth configuration.';
                } else {
                    errorMessage = error.response.data?.error || error.response.data?.detail || errorMessage;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setMessage(errorMessage);
            setIsConnectingAdmin(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const response = await api.put('/api/accounts/profile/', profileData);
            
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 5000);
            setIsEditing(false);
            
            // Update profile data with response
            if (response.data?.data) {
                setProfileData(prev => ({
                    ...prev,
                    ...response.data.data
                }));
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error saving profile:', error);
            }
            let errorMessage = 'Failed to save profile. Please try again.';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    const errorFields = Object.keys(errorData);
                    if (errorFields.length > 0) {
                        errorMessage = errorFields.map(field => {
                            const fieldErrors = Array.isArray(errorData[field])
                                ? errorData[field].join(', ')
                                : errorData[field];
                            return `${field}: ${fieldErrors}`;
                        }).join('\n');
                    }
                } else {
                    errorMessage = errorData.error || errorData.detail || errorMessage;
                }
            }
            
            setMessage(`Error: ${errorMessage}`);
            setTimeout(() => setMessage(''), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reload profile data to discard changes
        fetchProfileData();
        setIsEditing(false);
    };

    // Extract user information with fallbacks
    const getUserInitials = () => {
        const firstName = profileData.first_name || '';
        const lastName = profileData.last_name || '';
        if (firstName && lastName) {
            return (firstName[0] + lastName[0]).toUpperCase();
        } else if (firstName) {
            return firstName[0].toUpperCase();
        } else if (profileData.email) {
            return profileData.email[0].toUpperCase();
        }
        return 'U';
    };

    const getDisplayName = () => {
        if (profileData.first_name || profileData.last_name) {
            return `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
        }
        return profileData.email?.split('@')[0] || '—';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading profile...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-start gap-4 mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Account</h1>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sidebar text-white rounded-lg hover:bg-sidebar/90 transition-colors text-sm font-medium"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Message Display */}
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${
                    message.includes('Error') || message.includes('Failed')
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                    {message}
                </div>
            )}
            
            {/* Admin Google Connection Card - Only visible to admin email */}
            {isAdmin && (
                <div className="bg-blue-50 rounded-lg p-2 mb-2 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Settings className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Admin Google Account</h3>
                                <p className="text-sm text-gray-600">
                                    {adminOAuthStatus.connected 
                                        ? 'Admin Google account is connected. All document uploads will go to admin\'s Drive.' 
                                        : 'Connect admin\'s Google account (one-time setup) to enable document uploads for all users.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {adminOAuthStatus.connected ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium mr-2">Connected</span>
                                    <button
                                        onClick={handleConnectAdminGoogle}
                                        disabled={isConnectingAdmin}
                                        className="px-3 py-1 bg-white border border-blue-200 text-blue-600 rounded hover:bg-blue-50 transition-colors text-xs font-medium"
                                    >
                                        {isConnectingAdmin ? '...' : 'Reconnect'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectAdminGoogle}
                                    disabled={isConnectingAdmin}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    {isConnectingAdmin ? 'Connecting...' : 'Connect Admin Google'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Card */}
            <div className="bg-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-1">
                        <ul className="space-y-3 text-sm">
                            <li>
                                <span className="inline-block px-3 py-1 rounded-lg bg-white border border-gray-300 text-sidebar font-medium">
                                    Profile
                                </span>
                            </li>
                            {[
                                "Security",
                                "Notifications",
                                "Billing",
                                "Data Export",
                                "Preferences",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="text-gray-700 cursor-pointer hover:text-gray-900"
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button className="mt-8 text-sm text-red-500 hover:underline">
                            Delete Account
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px bg-gray-400" />

                    {/* Right Content */}
                    <div className="lg:col-span-2">
                        {/* Header with Save/Cancel buttons when editing */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">My Profile</h2>
                            {isEditing && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-sidebar text-white rounded-lg hover:bg-sidebar/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-20 h-20 rounded-full bg-sidebar flex items-center justify-center text-white text-2xl font-semibold">
                                {getUserInitials()}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{getDisplayName()}</p>
                                <p className="text-sm text-gray-600 mt-2">
                                    {profileData.address || profileData.city || profileData.country || '—'}
                                </p>
                            </div>
                        </div>

                        <hr className="border-gray-400 mb-6" />

                        {/* Personal Information */}
                        <section className="mb-6">
                            <h3 className="font-semibold mb-4">Personal Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <InfoField 
                                    label="First Name" 
                                    name="first_name"
                                    value={profileData.first_name} 
                                    onChange={handleInputChange}
                                    isEditing={isEditing}
                                />
                                <InfoField 
                                    label="Last Name" 
                                    name="last_name"
                                    value={profileData.last_name} 
                                    onChange={handleInputChange}
                                    isEditing={isEditing}
                                />
                                <InfoField 
                                    label="Email Address" 
                                    name="email"
                                    value={profileData.email} 
                                    onChange={handleInputChange}
                                    isEditing={false}
                                    readOnly={true}
                                />
                                <InfoField 
                                    label="Phone" 
                                    name="phone"
                                    value={profileData.phone} 
                                    onChange={handleInputChange}
                                    isEditing={isEditing}
                                />
                            </div>
                        </section>

                        <hr className="border-gray-400 mb-6" />

                        {/* Address */}
                        <section>
                            <h3 className="font-semibold mb-4">Address</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <InfoField 
                                    label="Country" 
                                    name="country"
                                    value={profileData.country} 
                                    onChange={handleInputChange}
                                    isEditing={isEditing}
                                />
                                <InfoField 
                                    label="City" 
                                    name="city"
                                    value={profileData.city} 
                                    onChange={handleInputChange}
                                    isEditing={isEditing}
                                />
                                <InfoField 
                                    label="Postal Code" 
                                    name="postcode"
                                    value={profileData.postcode} 
                                    onChange={handleInputChange}
                                    isEditing={isEditing}
                                />
                                <InfoField 
                                    label="Tax ID" 
                                    name="tax_id"
                                    value={profileData.tax_id} 
                                    onChange={handleInputChange}
                                    isEditing={isEditing}
                                    muted
                                />
                            </div>
                            
                            {/* Address field - full width */}
                            <div className="mt-6">
                                <InfoField 
                                    label="Address" 
                                    name="address"
                                    value={profileData.address} 
                                    onChange={handleInputChange}
                                    isEditing={isEditing}
                                    isTextarea
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------- Info Field Component ---------- */

const InfoField = ({ label, name, value, onChange, isEditing, readOnly = false, muted = false, isTextarea = false }) => {
    if (isEditing && !readOnly) {
        if (isTextarea) {
            return (
                <div>
                    <label htmlFor={name} className="block text-xs text-gray-600 mb-1">{label}</label>
                    <textarea
                        id={name}
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar focus:border-transparent text-sm bg-white"
                        placeholder={`Enter ${label.toLowerCase()}`}
                    />
                </div>
            );
        }
        return (
            <div>
                <label htmlFor={name} className="block text-xs text-gray-600 mb-1">{label}</label>
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar focus:border-transparent text-sm bg-white"
                    placeholder={`Enter ${label.toLowerCase()}`}
                />
            </div>
        );
    }
    
    return (
        <div>
            <p className="text-xs text-gray-600 mb-1">{label}</p>
            <p
                className={`font-medium ${muted ? "bg-white px-2 py-1 inline-block rounded" : ""}`}
            >
                {value || '—'}
            </p>
        </div>
    );
};

export default MyAccount;
