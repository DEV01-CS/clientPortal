import { useState } from "react";
import {
  Home,
  TrendingUp,
  ClipboardList,
  Coins,
  Users,
  Megaphone,
  User,
  Folder,
  Bell,
  Settings,
  LogOut,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useSidebar } from "./SidebarContext";
import logoImage from "../logo.png";

const menuTop = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },
  { label: "My Trends", icon: TrendingUp, path: "/my-trends" },
  { label: "Market Comparison", icon: ClipboardList, path: "/market-comparison" },
  { label: "Market Influences", icon: Coins, path: "/market-influences" },
  { label: "My Lease", icon: Users, path: "/my-lease" },
  { label: "My Expert", icon: Megaphone, path: "/my-expert" },
];

const menuBottom = [
  { label: "My Account", icon: User, path: "/my-account" },
  { label: "My Documents", icon: Folder, path: "/my-documents" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const menuFooter = [
  { label: "Log Out", icon: LogOut },
  { label: "Help", icon: HelpCircle },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false); // Close mobile menu after navigation
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar text-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`h-screen bg-sidebar text-white flex-col font-inter fixed left-0 top-0 z-40 transition-all duration-300 ${
          isCollapsed ? "w-20 px-2" : "w-64 px-4"
        } py-6 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:flex`}
      >
      {/* Logo and Collapse Button */}
      <div className="flex items-center justify-between mb-8 px-2">
        {!isCollapsed && (
          <div className="flex items-center">
            <img
              src={logoImage}
              alt="Service Charge UK"
              className="h-23 w-auto object-contain"
              style={{ display: 'inline-block' }}
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <img
              src={logoImage}
              alt="Service Charge UK"
              className="h-10 w-auto object-contain"
              style={{ display: 'inline-block' }}
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1">
        {menuTop.map((item, index) => (
          <MenuItem
            key={index}
            {...item}
            isCollapsed={isCollapsed}
            isActive={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
          />
        ))}

        <div className="my-4 border-t border-white/30" />

        {menuBottom.map((item, index) => (
          <MenuItem
            key={index}
            {...item}
            isCollapsed={isCollapsed}
            isActive={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
          />
        ))}

        <div className="my-4 border-t border-white/30" />

        {menuFooter.map((item, index) => (
          <MenuItem
            key={index}
            {...item}
            onClick={item.label === "Log Out" ? handleLogout : undefined}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>
    </aside>
    </>
  );
};

const MenuItem = ({ label, icon: Icon, isActive, onClick, isCollapsed }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg cursor-pointer
      text-sm font-medium transition-all group relative
      ${
        isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3"
      }
      ${
        isActive
          ? "bg-white text-sidebar"
          : "hover:bg-white/20 text-white"
      }`}
    title={isCollapsed ? label : ""}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
    {isCollapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </div>
);

export default Sidebar;
