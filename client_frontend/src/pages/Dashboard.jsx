import {
  Ruler,
  MapPin,
  Building2,
  Sparkles,
  Paperclip,
  Send,
  Home,
  ChevronDown,
  ArrowRight,
  Clock,
  RefreshCw,
  CalendarClock,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { sendChatbotMessage } from "../services/chatbotService";
import { fetchDashboardData } from "../services/dashboardService";
import { fetchDocuments } from "../services/documentService";
import { getEducationArticles } from "../services/educationService";
import LocationMap from "../components/LocationMap";
import DocumentUploadModal from "../components/DocumentUploadModal";
import EducationCard from "../components/EducationCard";
import RecentUpdatesWidget from "../components/RecentUpdatesWidget";
import api from "../services/api";

/* ── Deadline helpers ────────────────────────────────────── */
const MONTH_MAP = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

/**
 * Parse a UK date string into the next upcoming Date.
 * Handles: "31st March", "31 March 2025", "31/03/2025", "1st January and 1st July"
 * When multiple dates (separated by "and"), returns the soonest upcoming one.
 */
const parseNextDeadline = (raw) => {
  if (!raw || raw === "N/A") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates = [];

  // Split on "and" for multiple payment dates
  const parts = raw.split(/\s+and\s+/i);

  for (const part of parts) {
    const str = part.trim();

    // Format: dd/mm/yyyy or dd/mm
    const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1], 10);
      const month = parseInt(slashMatch[2], 10) - 1;
      const year = slashMatch[3] ? parseInt(slashMatch[3], 10) : today.getFullYear();
      const d = new Date(year, month, day);
      if (!slashMatch[3] && d < today) d.setFullYear(d.getFullYear() + 1);
      candidates.push(d);
      continue;
    }

    // Format: "31st March 2025" or "31st March" or "31 March"
    const wordMatch = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/);
    if (wordMatch) {
      const day = parseInt(wordMatch[1], 10);
      const month = MONTH_MAP[wordMatch[2].toLowerCase()];
      if (month !== undefined) {
        const year = wordMatch[3] ? parseInt(wordMatch[3], 10) : today.getFullYear();
        const d = new Date(year, month, day);
        if (!wordMatch[3] && d < today) d.setFullYear(d.getFullYear() + 1);
        candidates.push(d);
      }
    }
  }

  if (!candidates.length) return null;
  // Return the soonest upcoming date
  const upcoming = candidates
    .filter((d) => d >= today)
    .sort((a, b) => a - b);
  return upcoming[0] || candidates.sort((a, b) => a - b)[0];
};

const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
};

const deadlineChipStyle = (days) => {
  if (days === null) return null;
  if (days <= 14) return { bg: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-400" };
  if (days <= 30) return { bg: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-400" };
  return { bg: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-400" };
};

const getField = (data, fieldVariations, defaultValue) => {
  if (!data) return defaultValue;
  for (const field of fieldVariations) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      return data[field];
    }
  }
  return defaultValue;
};



const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { latestNotifications, allRecentNotifications } = useNotifications();
  const userName = user?.name || "N/A";
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm here to help you with questions about your service charge, property, lease, and related client services. How can I assist you today?",
      incoming: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [educationArticles, setEducationArticles] = useState([]);
  const [dataLastFetched, setDataLastFetched] = useState(null);
  const [newSinceLastVisit, setNewSinceLastVisit] = useState(0);

  useEffect(() => {
    const loadEducation = async () => {
      try {
        const articles = await getEducationArticles();
        setEducationArticles(articles.slice(0, 3));
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading education articles:", error);
        }
      }
    };
    loadEducation();
  }, []);

  // Load documents
  const loadDocuments = useCallback(async () => {
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
  }, []);


  // Dashboard data from Google Sheets
  const [dashboardData, setDashboardData] = useState({
    propertySize: "N/A",
    bedrooms: "N/A",
    bedroomsNumber: "N/A",
    location: "N/A",
    locationDesc: "N/A",
    city: "N/A",
    state: "N/A",
    serviceCharge: "N/A",
    serviceChargeIncludes: "N/A",
    serviceAmenities: "N/A",
    locationMap: null,
    scoreBar: "",
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

          const propertySize = getField(data, ['property_size', 'Property Size', 'propertySize', '1"02'], "N/A");
          const bedrooms = getField(data, ['bedrooms', 'Bedrooms','1"15'], "N/A");
          const bedroomsNumber = bedrooms !== "N/A" ? bedrooms : "2";
          const location = getField(data, ['postcode', 'postal_code', 'Postal Code', 'location', 'Location', '1"03'], "N/A");
          const locationDesc = getField(data, ['city', 'City', 'location_desc', '1"01', 'Address Box'], "N/A");
          const serviceCharge = getField(data, ['service_charge', 'Service Charge', 'serviceCharge', '1"04'], "N/A");
          const serviceChargeIncludes = getField(data, ['service_charge_includes', 'Service Charge Includes', 'serviceChargeIncludes', '1"14'], "");
          const serviceAmenities = getField(data, ['service_amenities', 'Services & Amenities', 'amenities', '1"05'], "N/A");
          const state = getField(data, ['state', 'State', 'region', 'Region'], "");
          const locationMap = getField(data, ['location_map', 'Location Map', 'locationMap', 'location_map'], null);
          
          // ownership fields
          const ownershipLandlord = getField(data, ['ownership_landlord', 'Ownership - Landlord', 'landlord','1"07'], "N/A");
          const ownershipLeaseholder = getField(data, ['ownership_leaseholder', 'Ownership - Leaseholder', 'leaseholder','1"06'], "N/A");
          const ownershipManagingAgents = getField(data, ['ownership_managing_agents', 'Ownership - Managing Agents', 'managing_agents','1"08'], "N/A");
          const ownershipResidentsAssociation = getField(data, ['ownership_residents_association', 'Ownership - Residents Association', 'residents_association','1"09'], "N/A");

          //keydate fields
          const keydateleaseTerm = getField(data, ['Key Dates - Lease Term', 'lease_term','1"10'], "N/A");
          const keydateServiceChargeYearEnd = getField(data, ['Key Dates - Service Charge Year End', 'service_charge_year_end','1"11'], "N/A");
          const keydatePaymentDates = getField(data, ['Key Dates - Payment Dates', 'payment_dates','1"12'], "N/A");

          //score-bar
          const scoreBar = getField(data, ['Your Score', 'your_score','1"13'], "N/A");

          setDashboardData({
            propertySize: propertySize,
            bedrooms: bedrooms ? `${bedrooms} Bedroom${bedrooms !== '1' ? 's' : ''}` : "2 Bedroom",
            bedroomsNumber: bedroomsNumber,
            location: location,
            locationDesc: locationDesc,
            city: locationDesc,
            state: state,
            serviceCharge: formatServiceCharge(serviceCharge, propertySize),
            serviceChargeIncludes: serviceChargeIncludes,
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
        setDataLastFetched(new Date());
      }
    };

    loadDashboardData();
    loadDocuments();
  }, [loadDocuments]);

  // "New since last visit" — compare allRecentNotifications against stored timestamp
  useEffect(() => {
    if (!allRecentNotifications.length) return;
    const lastVisitStr = localStorage.getItem('dashboard_last_visit');
    const lastVisit = lastVisitStr ? new Date(lastVisitStr) : null;
    if (lastVisit) {
      const count = allRecentNotifications.filter(
        (n) => new Date(n.created_at) > lastVisit
      ).length;
      setNewSinceLastVisit(count);
    }
    // Record this visit
    localStorage.setItem('dashboard_last_visit', new Date().toISOString());
  }, [allRecentNotifications]);

  
  const handleDocumentUploadSuccess = () => {
    loadDocuments(); // Reload documents after successful upload
  };

  const handleDocumentDownload = useCallback(async (doc) => {
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
  }, []);

  const handleSendMessage = useCallback(async () => {
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
  }, [inputMessage]);

  // Deadline chips — computed from already-loaded data, no extra API call
  const deadlineChips = useMemo(() => {
    const chips = [];

    const paymentDate = parseNextDeadline(dashboardData.keydatePaymentDates);
    const paymentDays = daysUntil(paymentDate);
    if (paymentDays !== null && paymentDays <= 90) {
      const style = deadlineChipStyle(paymentDays);
      chips.push({
        label: paymentDays === 0 ? "Payment due today" :
               paymentDays === 1 ? "Payment due tomorrow" :
               `Payment due in ${paymentDays} days`,
        style,
        icon: CalendarClock,
      });
    }

    const yearEndDate = parseNextDeadline(dashboardData.keydateServiceChargeYearEnd);
    const yearEndDays = daysUntil(yearEndDate);
    if (yearEndDays !== null && yearEndDays <= 90) {
      const style = deadlineChipStyle(yearEndDays);
      chips.push({
        label: yearEndDays === 0 ? "Service charge year ends today" :
               yearEndDays === 1 ? "Service charge year ends tomorrow" :
               `Service charge year ends in ${yearEndDays} days`,
        style,
        icon: Clock,
      });
    }

    return chips;
  }, [dashboardData.keydatePaymentDates, dashboardData.keydateServiceChargeYearEnd]);

  return (
    <div className="min-h-screen p-6 bg-white font-quicksand">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-3 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Hello,{" "}
            <span className="text-sidebar">
              {userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase()}
            </span>
          </h1>
          {/* Last updated timestamp */}
          {dataLastFetched && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Data updated {dataLastFetched.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              {newSinceLastVisit > 0 && (
                <button
                  onClick={() => navigate("/notifications")}
                  className="ml-2 px-2 py-0.5 bg-sidebar text-white rounded-full text-xs font-semibold hover:bg-teal-600 transition-colors"
                >
                  {newSinceLastVisit} new since last visit
                </button>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg text-sm cursor-pointer">
              <Home className="w-4 h-4 text-gray-600" />
              <span>{dashboardData.locationDesc}, {dashboardData.location}</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-200"></div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
            <Home className="w-4 h-4" />
            <span>My Properties</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deadline chips — only shown when within 90 days */}
      {!isLoadingData && deadlineChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {deadlineChips.map((chip, i) => {
            const ChipIcon = chip.icon;
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${chip.style.bg}`}
              >
                <span className={`w-2 h-2 rounded-full ${chip.style.dot}`} />
                <ChipIcon className="w-3 h-3" />
                {chip.label}
              </span>
            );
          })}
        </div>
      )}

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
          <InfoCard 
            icon={Ruler} 
            title="Property Size" 
            value={`${dashboardData.propertySize} Square Foot`} 
            desc={`${dashboardData.bedroomsNumber || 'N/A'} beds`} 
          />
          <InfoCard icon={MapPin} title="Location" value={dashboardData.location} desc={dashboardData.locationDesc} />
          <InfoCard 
            icon={Building2} 
            title="Service Charge" 
            value={dashboardData.serviceCharge}
            // desc={dashboardData.serviceChargeIncludes}
          />
          <InfoCard icon={Sparkles} title="Services & Amenities" value={dashboardData.serviceAmenities} />
        </div>
      )}

      {/* Middle Section - Ownership, Key Dates, Recent Updates | Score Bar + Map + Docs + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">

        {/* LEFT COLUMN — Ownership, Key Dates, Recent Updates */}
        <div className="space-y-4">
          <Card title="Ownership">
            <KeyValue label="Landlord" value={dashboardData.ownershipLandlord} />
            <KeyValue label="Leaseholder" value={dashboardData.ownershipLeaseholder} />
            <KeyValue label="Managing Agent" value={dashboardData.ownershipManagingAgents} />
            <KeyValue label="Residents Association" value={dashboardData.ownershipResidentsAssociation} />
          </Card>

          <Card title="Key Dates">
            <KeyValue label="Lease Term Remaining" value={dashboardData.keydateleaseTerm} />
            <KeyValue label="Service Charge Year End" value={dashboardData.keydateServiceChargeYearEnd} />
            <KeyValue label="Payment Dates" value={formatPaymentDates(dashboardData.keydatePaymentDates)} />
          </Card>

          {/* Recent Updates — integrated in left column, max 3 items */}
          <RecentUpdatesWidget
            notifications={allRecentNotifications.length > 0 ? allRecentNotifications : latestNotifications}
            maxItems={3}
          />

          <DocumentUploadModal
            isOpen={isDocumentModalOpen}
            onClose={() => setIsDocumentModalOpen(false)}
            onUploadSuccess={handleDocumentUploadSuccess}
          />
        </div>

        {/* RIGHT COLUMN — Score Bar, Map, Docs, Chat (spans 3 columns, unchanged) */}
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
            <div className="lg:col-span-2 bg-gray-100 rounded-lg p-6 shadow-sm flex flex-col">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Location</h3>
                <span className="text-sm text-gray-500">
                  {dashboardData.locationDesc}, {dashboardData.location}
                </span>
              </div>

              {isLoadingData ? (
                <div className="flex-1 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">Loading map...</div>
                </div>
              ) : (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dashboardData.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 cursor-pointer"
                >
                  <LocationMap
                    latitude={dashboardData.locationMap}
                    longitude={null}
                    location={`${dashboardData.locationDesc}, ${dashboardData.location}`}
                    postcode={dashboardData.location}
                    height="100%"
                  />
                </a>
              )}
            </div>

            {/* DOCS + CHAT */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {/* DOCS */}
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">Documents</h3>
                  <button
                    onClick={() => setIsDocumentModalOpen(true)}
                    className="bg-sidebar text-white px-3 py-1 rounded-md text-sm hover:bg-teal-600 transition-colors"
                  >
                    + Add Doc
                  </button>
                </div>
                {documents.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-3">
                    No documents yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <DocItem
                        key={index}
                        name={doc.name || 'Untitled Document'}
                        type={doc.type}
                        onClick={() => handleDocumentDownload(doc)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* CHAT */}
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm flex flex-col h-[320px]">
                <h3 className="font-semibold text-gray-900 mb-3">Chat</h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
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

      {/* Education Teaser — 2 cards + "View All", no extra row overhead */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Education & Insights</h2>
          <button
            onClick={() => navigate("/education")}
            className="flex items-center gap-1 text-sm font-medium text-sidebar hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {educationArticles.slice(0, 2).map((article) => (
            <EducationCard key={article.id} article={article} />
          ))}
        </div>
      </div>

      {/* Survey Shack — full-width horizontal promo banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl px-6 py-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Survey Shack</p>
            <p className="text-purple-100 text-xs">Big insights. Small price.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-5 py-2 bg-white text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors shadow-sm whitespace-nowrap flex-shrink-0">
          Download
        </button>
      </div>
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

const formatPaymentDates = (dates) => {
  if (!dates || dates === "N/A") return dates;
  
  return dates
    .split(' and ')
    .map(date => {
      const words = date.trim().split(' ');
      return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    })
    .join(' and ');
};

const formatServiceCharge = (serviceCharge, propertySize) => {
  if (!serviceCharge || serviceCharge === "N/A") return "N/A";

  // Strip any £ sign, commas, spaces to get a clean number
  const cleanedCharge = serviceCharge.replace(/[£,\s]/g, '');
  const chargeNum = parseFloat(cleanedCharge);

  if (isNaN(chargeNum)) return serviceCharge;

  // If the value is small (< 100) it's likely a per-sqft rate — calculate annual total
  if (chargeNum < 100 && propertySize && propertySize !== "N/A") {
    const sizeNum = parseFloat(String(propertySize).replace(/[^0-9.]/g, ''));
    if (!isNaN(sizeNum) && sizeNum > 0) {
      const annualTotal = Math.round(chargeNum * sizeNum);
      return `£${annualTotal.toLocaleString('en-GB')} per year`;
    }
  }

  // Already a full annual amount — just reformat neatly
  const fullAmount = Math.round(chargeNum);
  return `£${fullAmount.toLocaleString('en-GB')} per year`;
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

const DocItem = ({ name, type, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200 transition-colors"
  >
    <div className="w-9 h-9 bg-sidebar/10 rounded-lg flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-sidebar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
      {type && <p className="text-xs text-gray-400 mt-0.5">{type}</p>}
    </div>
    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
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
