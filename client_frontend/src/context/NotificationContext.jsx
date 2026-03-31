import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../auth/AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NOTIFICATION_TYPES = {
    BUDGET_RECEIVED: 'budget_received',
    DEMAND_RECEIVED: 'demand_received',
    YEAR_END_ACCOUNTS: 'year_end_accounts',
    SECTION_20: 'section_20',
    SECTION_20B: 'section_20b',
    INDUSTRY_UPDATE: 'industry_update',
    NEWS: 'news',
    GENERAL: 'general',
};

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotifications, setLatestNotifications] = useState([]);
    const [allRecentNotifications, setAllRecentNotifications] = useState([]);
    const { isAuthenticated } = useAuth();

    const fetchUnread = useCallback(async () => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            setLatestNotifications([]);
            setAllRecentNotifications([]);
            return;
        }
        try {
            const [unreadRes, allRes] = await Promise.all([
                api.get('/api/notifications/?is_read=false'),
                api.get('/api/notifications/'),
            ]);
            setUnreadCount(unreadRes.data.length);
            setLatestNotifications(unreadRes.data.slice(0, 5));
            setAllRecentNotifications(allRes.data.slice(0, 10));
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Polling for notifications failed", error);
            }
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchUnread();

        const interval = setInterval(() => {
            fetchUnread();
        }, 30000);

        return () => clearInterval(interval);
    }, [isAuthenticated, fetchUnread]);

    const value = {
        unreadCount,
        latestNotifications,
        allRecentNotifications,
        fetchUnread,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
