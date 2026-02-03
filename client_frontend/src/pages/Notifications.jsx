import { useState, useEffect } from "react";
import { Bell, Trash2, Loader } from 'lucide-react';
import api from '../api/api';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from "../context/NotificationContext";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { fetchUnread } = useNotifications(); // Get the function to refresh navbar count

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const response = await api.get('/api/notifications/');
                setNotifications(response.data);
                // Mark all as read when the user visits this page
                await api.post('/api/notifications/mark-all-as-read/');
                fetchUnread(); // Refresh the navbar count to 0
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [fetchUnread]);

    const handleDelete = async (id) => {
        // Optimistically update UI
        const originalNotifications = [...notifications];
        setNotifications(currentNotifications => currentNotifications.filter(n => n.id !== id));
        
        try {
            await api.delete(`/api/notifications/${id}/delete/`);
        } catch (error) {
            console.error("Failed to delete notification", error);
            // Revert if API call fails
            setNotifications(originalNotifications);
            alert("Could not delete notification. Please try again.");
        }
    };

    const handleClearAll = async () => {
        const originalNotifications = [...notifications];
        setNotifications([]);
        try {
            await api.post('/api/notifications/clear-all/');
        } catch (error) {
            console.error("Failed to clear notifications", error);
            setNotifications(originalNotifications);
            alert("Could not clear notifications. Please try again.");
        }
    };

    return (
        <div className="p-6 font-inter bg-white min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Notifications
                </h1>
                {notifications.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="bg-gray-100 rounded-lg shadow-sm max-w-8xl mx-auto">
                {loading ? (
                    <div className="text-center py-20">
                        <Loader className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                        <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {notifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} onDelete={handleDelete} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-20">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800">No new notifications</h3>
                        <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const NotificationItem = ({ notification, onDelete }) => (
    <li className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
        <div className="flex items-center gap-4">
            <div className="bg-sidebar/10 p-2 rounded-full">
                <Bell className="w-5 h-5 text-sidebar" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
            </div>
        </div>
        <button
            onClick={() => onDelete(notification.id)}
            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-100/50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete notification"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    </li>
);

export default Notifications;