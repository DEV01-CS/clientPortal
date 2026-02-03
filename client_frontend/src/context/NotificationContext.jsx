import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../auth/AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotifications, setLatestNotifications] = useState([]);
    const { isAuthenticated } = useAuth();

    const fetchUnread = useCallback(async () => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            setLatestNotifications([]);
            return;
        };
        try {
            // Fetch only unread notifications
            const response = await api.get('/api/notifications/?is_read=false');
            setUnreadCount(response.data.length);
            setLatestNotifications(response.data.slice(0, 5)); // Get latest 5 for a dropdown
        } catch (error) {
            // Fail silently on poll error
            console.error("Polling for notifications failed", error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Fetch immediately when auth status changes
        fetchUnread();

        // Set up polling
        const interval = setInterval(() => {
            fetchUnread();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [isAuthenticated, fetchUnread]);

    const value = {
        unreadCount,
        latestNotifications,
        fetchUnread // Expose to allow manual refresh from other components
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
