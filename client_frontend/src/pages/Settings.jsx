import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";

const Settings = () => {
    const { user } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [adminStatus, setAdminStatus] = useState({ connected: false, loading: true });
    const navigate = useNavigate();
    
    const ADMIN_EMAILS = ['accounts@servicechargeuk.com', 'scuk027@gmail.com'];
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        try {
            const response = await api.get('/api/sheets/oauth/admin/status/');
            setAdminStatus({ connected: response.data.connected, loading: false });
        } catch (error) {
            console.error("Failed to check admin status", error);
            setAdminStatus({ connected: false, loading: false });
        }
    };

    const handleAdminConnect = async () => {
        try {
            const response = await api.get('/api/sheets/oauth/admin/initiate/');
            window.location.href = response.data.auth_url;
        } catch (error) {
            console.error("Failed to initiate admin oauth", error);
            alert("Failed to initiate connection");
        }
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark', !isDarkMode);
    };

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
    };

    return (
        <div className="p-6 font-inter bg-white min-h-screen">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
            <div className="bg-gray-100 rounded-lg shadow-sm max-w-8xl mx-auto p-6">
                <SettingsRow title="Account" description="Manage your profile, password, and user settings.">
                    <ActionButton onClick={() => navigate('/my-account')}>
                        Manage Account
                    </ActionButton>
                </SettingsRow>

                <SettingsRow title="Admin Connection" description="Manage Admin Google Sheet connection.">
                    <div className="flex items-center gap-4">
                        <span className={`text-sm font-medium ${adminStatus.connected ? 'text-green-600' : 'text-gray-500'}`}>
                            {adminStatus.connected ? 'Connected' : 'Not Connected'}
                        </span>
                        {isAdmin && (
                            <ActionButton onClick={handleAdminConnect}>
                                {adminStatus.connected ? 'Reconnect' : 'Connect'}
                            </ActionButton>
                        )}
                    </div>
                </SettingsRow>

                <SettingsRow title="Dark Mode" description="Toggle between light and dark themes for the interface.">
                    <ToggleButton isEnabled={isDarkMode} onToggle={toggleDarkMode} />
                </SettingsRow>

                <SettingsRow title="Email Notifications" description="Receive updates and alerts via email.">
                    <ToggleButton isEnabled={notificationsEnabled} onToggle={toggleNotifications} />
                </SettingsRow>

                <SettingsRow title="Language" description="Choose your preferred language for the application.">
                    <div className="relative">
                        <select className="appearance-none bg-gray-200 border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-sidebar">
                            <option>English (UK)</option>
                            <option>English (US)</option>
                            <option>Español</option>
                            <option>Français</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </SettingsRow>
            </div>
        </div>
    );
};

/* --- Sub-components for cleaner structure --- */

const SettingsRow = ({ title, description, children }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
        <div className="mb-2 sm:mb-0">
            <h2 className="text-md font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex-shrink-0">
            {children}
        </div>
    </div>
);

const ActionButton = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 rounded-md font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
    >
        {children}
    </button>
);

const ToggleButton = ({ isEnabled, onToggle }) => (
    <button
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sidebar ${isEnabled ? 'bg-sidebar' : 'bg-gray-300'
            }`}
    >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

export default Settings;