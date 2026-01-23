import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { SidebarProvider, useSidebar } from "./components/SidebarContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import PrivateRoute from "./routes/PrivateRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyTrends from "./pages/MyTrends";
import MarketComparison from "./pages/MarketComparison";
import MarketInfluences from "./pages/MarketInfluences";
import MyLease from "./pages/MyLease";
import MyExpert from "./pages/MyExpert";
import MyAccount from "./pages/MyAccount";
import MyDocuments from "./pages/MyDocuments";
import TestConnection from "./pages/TestConnection";
// import Notifications from "./pages/Notifications";
// import Settings from "./pages/Settings";

const AppLayout = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        } ml-0`}
      >
        <Navbar />
        <main className="flex-1 p-4 lg:p-6 bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-trends" element={<MyTrends />} />
            <Route path="/market-comparison" element={<MarketComparison />} />
            <Route path="/market-influences" element={<MarketInfluences />} />
            <Route path="/my-lease" element={<MyLease />} />
            <Route path="/my-expert" element={<MyExpert />} />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/my-documents" element={<MyDocuments />} />
            <Route path="/test-connection" element={<TestConnection />} />
            {/* <Route path="/notifications" element={<Notifications />} /> */}
            {/* <Route path="/settings" element={<Settings />} /> */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
