import { Bell, FileText, AlertTriangle, TrendingUp, Newspaper, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const NOTIFICATION_TYPE_CONFIG = {
  budget_received: { icon: FileText, color: "bg-blue-100 text-blue-600" },
  demand_received: { icon: FileText, color: "bg-green-100 text-green-600" },
  year_end_accounts: { icon: FileText, color: "bg-indigo-100 text-indigo-600" },
  section_20: { icon: AlertTriangle, color: "bg-amber-100 text-amber-600" },
  section_20b: { icon: AlertTriangle, color: "bg-orange-100 text-orange-600" },
  industry_update: { icon: TrendingUp, color: "bg-teal-100 text-teal-600" },
  news: { icon: Newspaper, color: "bg-purple-100 text-purple-600" },
  general: { icon: Bell, color: "bg-gray-100 text-gray-600" },
};

const getTypeConfig = (type) =>
  NOTIFICATION_TYPE_CONFIG[type] || NOTIFICATION_TYPE_CONFIG.general;

const RecentUpdatesWidget = ({ notifications = [], maxItems = 5 }) => {
  const navigate = useNavigate();
  const items = notifications.slice(0, maxItems);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sidebar" />
          <h3 className="font-semibold text-gray-900 text-sm">Recent Updates</h3>
        </div>
        <button
          onClick={() => navigate("/notifications")}
          className="text-xs font-medium text-sidebar hover:underline"
        >
          View All
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="divide-y divide-gray-50">
          {items.map((item) => {
            const config = getTypeConfig(item.notification_type || item.type);
            const Icon = config.icon;

            return (
              <li
                key={item.id}
                className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate("/notifications")}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-gray-800 truncate ${!item.is_read ? 'font-semibold' : 'font-normal'}`}>
                    {item.title || item.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.created_at
                      ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                      : ""}
                  </p>
                </div>
                {!item.is_read && (
                  <span className="w-2 h-2 bg-sidebar rounded-full flex-shrink-0 mt-1.5" />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="p-8 text-center">
          <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No recent updates</p>
        </div>
      )}
    </div>
  );
};

export { NOTIFICATION_TYPE_CONFIG, getTypeConfig };
export default RecentUpdatesWidget;
