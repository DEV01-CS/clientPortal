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
import { fetchDocuments } from "../services/documentService";
import LocationMap from "../components/LocationMap";
import DocumentUploadModal from "../components/DocumentUploadModal";
// Assuming a central API client setup for making authenticated requests
import api from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.name || "N/A";
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
    scoreBar: "N/A",
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
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
          // Handle different possible column name variations (optimized with helper function)
          const getField = (fieldVariations, defaultValue) => {
            for (const field of fieldVariations) {
              if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
                return data[field];
              }
            }
            return defaultValue;
          };

          const propertySize = getField(['property_size', 'Property Size', 'propertySize', '1"02'], "N/A");
          const bedrooms = getField(['bedrooms', 'Bedrooms'], "N/A");
          const location = getField(['postcode', 'postal_code', 'Postal Code', 'location', 'Location', '1"03'], "N/A");
          const locationDesc = getField(['city', 'City', 'location_desc', '1"01', 'Address Box'], "N/A");
          const serviceCharge = getField(['service_charge', 'Service Charge', 'serviceCharge', '1"04'], "N/A");
          const serviceAmenities = getField(['service_amenities', 'Services & Amenities', 'amenities', '1"05'], "N/A");
          const state = getField(['state', 'State', 'region', 'Region'], "");
          const locationMap = getField(['location_map', 'Location Map', 'locationMap', 'location_map'], null);
          
          // ownership fields
          const ownershipLandlord = getField(['ownership_landlord', 'Ownership - Landlord', 'landlord','1"07'], "N/A");
          const ownershipLeaseholder = getField(['ownership_leaseholder', 'Ownership - Leaseholder', 'leaseholder','1"06'], "N/A");
          const ownershipManagingAgents = getField(['ownership_managing_agents', 'Ownership - Managing Agents', 'managing_agents','1"08'], "N/A");
          const ownershipResidentsAssociation = getField(['ownership_residents_association', 'Ownership - Residents Association', 'residents_association','1"09'], "N/A");

          //keydate fields
          const keydateleaseTerm = getField(['Key Dates - Lease Term', 'lease_term','1"10'], "N/A");
          const keydateServiceChargeYearEnd = getField(['Key Dates - Service Charge Year End', 'service_charge_year_end','1"11'], "N/A");
          const keydatePaymentDates = getField(['Key Dates - Payment Dates', 'payment_dates','1"12'], "N/A");

          //score-bar
          const scoreBar = getField(['Your Score', 'your_score','1"13'], "N/A");

          setDashboardData({
            propertySize: propertySize,
            bedrooms: bedrooms ? `${bedrooms} Bedroom${bedrooms !== '1' ? 's' : ''}` : "2 Bedroom",
            location: location,
            locationDesc: locationDesc,
            city: locationDesc,
            state: state,
            serviceCharge: serviceCharge.includes('/') ? serviceCharge : `£${serviceCharge} / Year`,
            serviceAmenities: serviceAmenities,
            locationMap: locationMap,
            ownershipLandlord: ownershipLandlord,
            ownershipLeaseholder: ownershipLeaseholder,
            ownershipManagingAgents: ownershipManagingAgents,
            ownershipResidentsAssociation: ownershipResidentsAssociation, 
            keydateleaseTerm: keydateleaseTerm,
            keydateServiceChargeYearEnd: keydateServiceChargeYearEnd,
            keydatePaymentDates: keydatePaymentDates,
            scoreBar: scoreBar,
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
    loadDocuments();
  }, []);

  // Load documents
  const loadDocuments = async () => {
    try {
      const response = await fetchDocuments();
      if (response.documents) {
        setDocuments(response.documents.slice(0, 3)); // Show only first 3 in dashboard
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching documents:", error);
        // Check if it's an admin OAuth error
        if (error.response?.status === 401 && error.response?.data?.error === "Admin Google account not connected") {
          console.warn("Admin Google account not connected");
        }
      }
    }
  };

  const handleDocumentUploadSuccess = () => {
    loadDocuments(); // Reload documents after successful upload
  };

  const handleDocumentDownload = async (doc) => {
    if (!doc.drive_file?.id) {
      console.error("No file ID available for download.");
      alert("This document cannot be downloaded as it has no associated file.");
      return;
    }

    try {
      // This assumes your `api` service is set up to handle blob responses
      // and includes authentication tokens.
      const response = await api.get(`/sheets/documents/download/${doc.drive_file.id}/`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = doc.name || doc.drive_file.name || 'download';
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download the document. It may have been removed or there was a network issue.");
    }
  };

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
          {dashboardData.city}{dashboardData.state ? `, ${dashboardData.state}` : ''}
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
            <KeyValue label="Leaseholder" value={dashboardData.ownershipLeaseholder} />
            <KeyValue label="Landlord" value={dashboardData.ownershipLandlord} />
            <KeyValue label="Managing Agent" value={dashboardData.ownershipManagingAgents} />
            <KeyValue label="Residents Association" value={dashboardData.ownershipResidentsAssociation} />
          </Card>

          <Card title="Key Dates">
            <KeyValue label="Lease Term" value={dashboardData.keydateleaseTerm} />
            <KeyValue label="Service Charge Year End" value={dashboardData.keydateServiceChargeYearEnd} />
            <KeyValue label="Payment Dates" value={dashboardData.keydatePaymentDates}/>
          </Card>
        </div>  

        {/* RIGHT COLUMN - Score Bar (spans 3 columns) */}
        <div className="lg:col-span-3 rounded-lg shadow-sm">
          <div className="bg-gray-100 rounded-lg p-2 mb-6">
            <h3 className="font-semibold text-gray-900 m-2">
              Your Score: <span className="text-orange-500">{dashboardData.scoreBar}</span>
            </h3>

            <div className="flex rounded-full overflow-hidden h-10 mb-3 relative">
              <Bar color="bg-green-500" label="VERY LOW" />
              <Bar color="bg-teal-400" label="LOW" />
              <Bar color="bg-yellow-400" label="MEDIUM" />
              <Bar color="bg-orange-500" label="HIGH" />
              <Bar color="bg-red-500" label="VERY HIGH" />
              {/* Arrow indicator on the active bar */}
              <div 
                className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-10 transition-all duration-500"
                style={{ left: getScorePosition(dashboardData.scoreBar) }}
              >
                <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-white mt-8"></div>
              </div>
            </div>

            <div className="flex justify-center items-center mb-6">
              <p className="text-sm text-gray-600">
                Your service charge is <span className="text-orange-500 font-medium">{dashboardData.scoreBar}</span> compared to other similar properties
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
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dashboardData.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer"
                >
                  <LocationMap
                    latitude={dashboardData.locationMap}
                    longitude={null}
                    location={`${dashboardData.locationDesc}, ${dashboardData.location}`}
                    postcode={dashboardData.location}
                    height="288px"
                  />
                </a>
              )}
            </div>

            {/* DOCS + CHAT */}
            <div className="lg:col-span-1 space-y-6">
              {/* DOCS */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Documents</h3>
                  <button
                    onClick={() => setIsDocumentModalOpen(true)}
                    className="bg-sidebar text-white px-3 py-1 rounded-md text-sm hover:bg-teal-600 transition-colors"
                  >
                    + Add Doc
                  </button>
                </div>
                {documents.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No documents yet
                  </div>
                ) : (
                  documents.map((doc, index) => (
                    <DocItem
                      key={index}
                      name={doc.name || 'Untitled Document'}
                      onClick={() => handleDocumentDownload(doc)}
                    />
                  ))
                )}
              </Card>

              {/* Document Upload Modal */}
              <DocumentUploadModal
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                onUploadSuccess={handleDocumentUploadSuccess}
              />

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

const getScorePosition = (score) => {
  if (!score || score === "N/A") return "50%";
  const s = score.toString().toUpperCase().trim();
  
  switch (s) {
    case "VERY LOW": return "10%";
    case "LOW": return "30%";
    case "MEDIUM": return "50%";
    case "HIGH": return "70%";
    case "VERY HIGH": return "90%";
    default: return "50%";
  }
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
  </div>
);

const DocItem = ({ name, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-2 text-xs hover:bg-gray-100 p-1 rounded cursor-pointer"
  >
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
