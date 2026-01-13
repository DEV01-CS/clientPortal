import {
  Ruler,
  MapPin,
  Building2,
  Code,
  Paperclip,
  Send,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { sendChatbotMessage } from "../services/chatbotService";
import { fetchDashboardData } from "../services/dashboardService";
import LocationMap from "../components/LocationMap";

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.name || "Lucy";
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm here to help you with questions about your service charge, property, lease, and related client services. How can I assist you today?",
      incoming: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  // Dashboard data from Google Sheets
  const [dashboardData, setDashboardData] = useState({
    propertySize: "710 Sq2",
    bedrooms: "2 Bedroom",
    location: "SW18 1UZ",
    locationDesc: "Wandsworth",
    city: "Wandsworth",
    state: "",
    serviceCharge: "£2,551 / Year",
    serviceAmenities: "Concierge",
    locationMap: null, // Lat/Long coordinates from Column P
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch dashboard data from Google Sheets
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoadingData(true);
        const response = await fetchDashboardData();
        
        if (response.data) {
          const data = response.data;
          
          // Map Google Sheets columns to dashboard fields
          // Handle different possible column name variations
          const propertySize = data.property_size || data['Property Size'] || data.propertySize || "710 Sq2";
          const bedrooms = data.bedrooms || data.Bedrooms || "2";
          const location = data.postcode || data.postal_code || data['Postal Code'] || data.location || data['Location'] || "SW18 1UZ";
          const locationDesc = data.city || data.City || data.location_desc || "Wandsworth";
          const serviceCharge = data.service_charge || data['Service Charge'] || data.serviceCharge || "£2,551";
          const serviceAmenities = data.service_amenities || data['Services & Amenities'] || data.amenities || "Concierge";
          
          // Get city and state/region for header display
          const city = data.city || data.City || data.location_desc || data['City'] || "Wandsworth";
          const state = data.state || data.State || data.region || data.Region || data['State'] || data['Region'] || "";
          
          // Get location map coordinates from Column P (Location Map)
          // Handle different possible column name variations
          const locationMap = data.location_map || data['Location Map'] || data.locationMap || data['location_map'] || null;
          
          setDashboardData({
            propertySize: propertySize,
            bedrooms: bedrooms ? `${bedrooms} Bedroom${bedrooms !== '1' ? 's' : ''}` : "2 Bedroom",
            location: location,
            locationDesc: locationDesc,
            city: city,
            state: state,
            serviceCharge: serviceCharge.includes('/') ? serviceCharge : `£${serviceCharge} / Year`,
            serviceAmenities: serviceAmenities,
            locationMap: locationMap,
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching dashboard data:", error);
        }
        // Keep default values on error
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message immediately
    setMessages((prev) => [...prev, { text: userMessage, incoming: false }]);

    try {
      // Call backend chatbot API
      const response = await sendChatbotMessage(userMessage);
      
      if (response.success) {
        // Add bot response
        setMessages((prev) => [
          ...prev,
          {
            text: response.message,
            incoming: true,
          },
        ]);
      } else {
        // Handle error response
        setMessages((prev) => [
          ...prev,
          {
            text: response.message || "Sorry, I encountered an error. Please try again.",
            incoming: true,
          },
        ]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Chatbot error:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
      }
      
      // Show more specific error message
      let errorMessage = "Sorry, I'm having trouble connecting. Please try again later.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Please log in again to continue chatting.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to use the chatbot.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setMessages((prev) => [
        ...prev,
        {
          text: errorMessage,
          incoming: true,
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white font-inter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-start mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Hello, <span className="text-sidebar">{userName}</span>
        </h1>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg text-sm cursor-pointer">
          {dashboardData.city}{dashboardData.state ? `, ${dashboardData.state}` : ''} <span>▼</span>
        </div>
      </div>

      {/* Top Info Cards */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 rounded-lg p-5 shadow-sm animate-pulse">
            <div className="h-5 w-5 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
            <div className="h-6 w-32 bg-gray-300 rounded"></div>
          </div>
          <div className="bg-gray-100 rounded-lg p-5 shadow-sm animate-pulse">
            <div className="h-5 w-5 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
            <div className="h-6 w-32 bg-gray-300 rounded"></div>
          </div>
          <div className="bg-gray-100 rounded-lg p-5 shadow-sm animate-pulse">
            <div className="h-5 w-5 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
            <div className="h-6 w-32 bg-gray-300 rounded"></div>
          </div>
          <div className="bg-gray-100 rounded-lg p-5 shadow-sm animate-pulse">
            <div className="h-5 w-5 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
            <div className="h-6 w-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InfoCard icon={Ruler} title="Property Size" value={dashboardData.propertySize} desc={dashboardData.bedrooms} />
          <InfoCard icon={MapPin} title="Location" value={dashboardData.location} desc={dashboardData.locationDesc} />
          <InfoCard icon={Building2} title="Service Charge" value={dashboardData.serviceCharge} />
          <InfoCard icon={Code} title="Services & Amenities" value={dashboardData.serviceAmenities} />
        </div>
      )}

      {/* Middle Section - Ownership, Key Dates, and Score Bar */}
      <div className="grid grid-cols-1  lg:grid-cols-4 gap-6 mb-6">
        {/* LEFT COLUMN - Ownership and Key Dates */}
        <div className="space-y-6">
          <Card title="Ownership">
            <KeyValue label="Leaseholder" value="Lucy Clark" />
            <KeyValue label="Landlord" value="Star Building Ltd." />
            <KeyValue label="Managing Agent" value="London Building Ltd." />
            <KeyValue label="Residents Association" value="Yes" />
          </Card>

          <Card title="Key Dates">
            <KeyValue label="Lease Term" value="90 Years Remaining" />
            <KeyValue label="Service Charge Year End" value="31st December" />
            <KeyValue label="Payment Dates" value="1st January & 30th June" />
          </Card>
        </div>

        {/* RIGHT COLUMN - Score Bar (spans 3 columns) */}
        <div className="lg:col-span-3 rounded-lg shadow-sm">
          <div className="bg-gray-100 rounded-lg p-2 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Your Score: <span className="text-orange-500">High</span>
            </h3>

            <div className="flex rounded-full overflow-hidden h-10 mb-3">
              <Bar color="bg-green-500" label="VERY LOW" />
              <Bar color="bg-teal-400" label="LOW" />
              <Bar color="bg-yellow-400" label="MEDIUM" />
              <Bar color="bg-orange-500" label="HIGH" active />
              <Bar color="bg-red-500" label="VERY HIGH" />
            </div>

            <div className="flex justify-center items-center mb-6">
              <p className="text-sm text-gray-600">
                Your service charge is <span className="text-orange-500 font-medium">high</span> compared to other similar properties
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* MAP */}
            <div className="lg:col-span-2 bg-gray-100 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Location</h3>
                <span className="text-sm text-gray-500">
                  {dashboardData.locationDesc}, {dashboardData.location}
                </span>
              </div>

              {isLoadingData ? (
                <div className="h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">Loading map...</div>
                </div>
              ) : (
                <LocationMap
                  latitude={dashboardData.locationMap}
                  longitude={null}
                  location={`${dashboardData.locationDesc}, ${dashboardData.location}`}
                  height="288px"
                />
              )}
            </div>

            {/* DOCS + CHAT */}
            <div className="lg:col-span-1 space-y-6">
              {/* DOCS */}
              <Card title="Docs">
                <DocItem name="Budget Report.pdf" />
                <DocItem name="Monthly Report.pdf" />
                <DocItem name="Service Charge Invoice.pdf" />
              </Card>

              {/* CHAT */}
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm h-[320px] flex flex-col">
                <h3 className="font-semibold text-gray-900 mb-3">Chat</h3>

                <div className="flex-1 space-y-3 overflow-y-auto mb-3">
                  {messages.map((msg, index) => (
                    <ChatBubble key={index} text={msg.text} incoming={msg.incoming} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center gap-2 border-t pt-3">
                  <input
                    className="flex-1 text-sm px-3 py-2 border rounded-lg focus:ring-sidebar focus:outline-none"
                    placeholder="Ask about service charge, property, lease..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && inputMessage.trim()) {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Paperclip className="w-5 h-5 text-gray-500 cursor-pointer" />
                  <Send
                    className="w-5 h-5 text-sidebar cursor-pointer hover:text-teal-600 transition-colors"
                    onClick={handleSendMessage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Bottom Section - Map, Docs, and Chat (below score bar) */}
    </div>
  );
};

/* -------------------- Components -------------------- */

const InfoCard = ({ icon: Icon, title, value, desc }) => (
  <div className="bg-gray-100 rounded-lg p-5 shadow-sm">
    <Icon className="w-5 h-5 text-sidebar mb-2" />
    <p className="text-xs text-gray-600">{title}</p>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
    {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-gray-100 rounded-lg p-5 shadow-sm">
    <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const KeyValue = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-600">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

const Bar = ({ color, label, active }) => (
  <div className={`flex-1 ${color} flex items-center justify-center text-white text-xs font-semibold relative`}>
    {label}
    {active && (
      <div className="absolute -bottom-3 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-orange-500" />
    )}
  </div>
);

const DocItem = ({ name }) => (
  <div className="flex items-center gap-2 text-xs hover:bg-gray-100 p-1 rounded cursor-pointer">
    <div className="w-8 h-8 bg-gray-250 rounded flex items-center justify-center text-xs font-semibold">PDF</div>
    {name}
  </div>
);

const ChatBubble = ({ text, incoming }) => (
  <div className={`flex ${incoming ? "justify-start" : "justify-end"}`}>
    <div className={`px-3 py-2 rounded-lg text-sm max-w-xs ${incoming ? "bg-gray-100" : "bg-sidebar text-white"}`}>
      {text}
    </div>
  </div>
);

export default Dashboard;
