import { useState, useEffect, useCallback } from "react";
import { Bell, Trash2, Loader } from 'lucide-react';
import api from '../api/api';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from "../context/NotificationContext";
import { getTypeConfig } from "../components/RecentUpdatesWidget";

const FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "budget_received", label: "Budget" },
    { value: "demand_received", label: "Demand" },
    { value: "year_end_accounts", label: "Year End" },
    { value: "section_20", label: "Section 20" },
    { value: "section_20b", label: "Section 20b" },
    { value: "industry_update", label: "Industry" },
    { value: "news", label: "News" },
];

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const { fetchUnread } = useNotifications();

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const response = await api.get('/api/notifications/');
                setNotifications(response.data);
                await api.post('/api/notifications/mark-all-as-read/');
                fetchUnread();
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Failed to fetch notifications", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [fetchUnread]);

    const handleDelete = useCallback(async (id) => {
        const originalNotifications = [...notifications];
        setNotifications(currentNotifications => currentNotifications.filter(n => n.id !== id));
        
        try {
            await api.delete(`/api/notifications/${id}/delete/`);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Failed to delete notification", error);
            }
            setNotifications(originalNotifications);
            alert("Could not delete notification. Please try again.");
        }
    }, [notifications]);

    const handleClearAll = useCallback(async () => {
        const originalNotifications = [...notifications];
        setNotifications([]);
        try {
            await api.post('/api/notifications/clear-all/');
            fetchUnread();
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Failed to clear notifications", error);
            }
            setNotifications(originalNotifications);
            alert("Could not clear notifications. Please try again.");
        }
    }, [notifications, fetchUnread]);

    const filteredNotifications = notifications.filter((n) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "unread") return !n.is_read;
        return (n.notification_type || n.type || "general") === activeFilter;
    });

    return (
        <div className="p-6 font-inter bg-white min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Stay up to date with budgets, demands, section notices, and industry news.
                    </p>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
                {FILTER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setActiveFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            activeFilter === opt.value
                                ? "bg-sidebar text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="bg-gray-100 rounded-lg shadow-sm max-w-8xl mx-auto">
                {loading ? (
                    <div className="text-center py-20">
                        <Loader className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                        <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {filteredNotifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} onDelete={handleDelete} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-20">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800">
                            {activeFilter === "all" ? "No notifications" : "No matching notifications"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {activeFilter === "all" ? "You're all caught up!" : "Try a different filter."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const NotificationItem = ({ notification, onDelete }) => {
    const config = getTypeConfig(notification.notification_type || notification.type);
    const Icon = config.icon;

    return (
        <li className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${config.color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    {notification.title && (
                        <p className="text-xs font-semibold text-sidebar uppercase tracking-wide mb-0.5">
                            {notification.title}
                        </p>
                    )}
                    <p className={`text-sm text-gray-900 ${!notification.is_read ? 'font-semibold' : 'font-normal'}`}>
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {!notification.is_read && (
                    <span className="w-2.5 h-2.5 bg-sidebar rounded-full" />
                )}
                <button
                    onClick={() => onDelete(notification.id)}
                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-100/50 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete notification"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </li>
    );
};

export default Notifications;