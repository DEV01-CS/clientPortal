import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchDashboardData } from "../services/dashboardService";

const MyLease = () => {
  const [openSection1, setOpenSection1] = useState(false);  
  const [openSection2, setOpenSection2] = useState(false);
  const [openSection3, setOpenSection3] = useState(false);
  const [openSection4, setOpenSection4] = useState(false);
  const [openSection5, setOpenSection5] = useState(false);
  
  const [leaseData, setLeaseData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchDashboardData();
        if (response.data) {
          setLeaseData(response.data);
        }
      } catch (error) {
        console.error("Error loading lease data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Helper to safely get data by degree key (handling potential quote variations)
  const getData = (key) => {
    if (!leaseData) return "Loading...";
    // Try exact match, or match with different quote types just in case
    return leaseData[key] || leaseData[key.replace('"', '”')] || leaseData[key.replace('”', '"')] || "Data not available";
  };

  // Helper to render a range of lease items
  const renderLeaseRange = (start, end) => {
    const items = [];
    for (let i = start; i <= end; i++) {
      const key = `4"${i.toString().padStart(2, '0')}`;
      const text = getData(key);
      if (text && text !== "Data not available" && text !== "") {
        items.push(<li key={key} className="mb-2">{text}</li>);
      }
    }
    return items.length > 0 ? (
      <ul className="list-disc ml-5 text-sm text-gray-700">{items}</ul>
    ) : (
      <p className="text-sm text-gray-500">Data not available</p>
    );
  };

  // Generate list items for the right panel (4"02 to 4"38)
  const rightPanelItems = [];
  for (let i = 2; i <= 38; i++) {
    rightPanelItems.push({ key: `4"${i.toString().padStart(2, '0')}`, id: i });
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-600">Loading lease data...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6 font-inter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Lease</h1>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="bg-gray-200 rounded-lg p-4 space-y-2">
          <Accordion
            title="Property Demise"
            isOpen={openSection1 === true}
            onClick={() => setOpenSection1(openSection1 === true ? false : true)}
            >
            {renderLeaseRange(2, 4)}
          </Accordion>

          <Accordion
            title="Service Charge Recoverable"
            isOpen={openSection2 === true}
            onClick={() => setOpenSection2(openSection2 === true ? false : true)}
          >
            {renderLeaseRange(5, 16)}
          </Accordion>

          <Accordion
            title="Health & Safety Recoverable"
            isOpen={openSection3 === true}
            onClick={() => setOpenSection3(openSection3 === true ? false : true)}
            >
            {renderLeaseRange(17, 26)}
          </Accordion>

          <Accordion
            title="Non-Recoverables"
            isOpen={openSection4 === true}
            onClick={() => setOpenSection4(openSection4 === true ? false : true)}
            >
            {renderLeaseRange(27, 34)}
          </Accordion>

          <Accordion
            title="Sweeper Clauses"
            isOpen={openSection5 === true}
            onClick={() => setOpenSection5(openSection5 === true ? false : true)}
            >
            {renderLeaseRange(35, 38)}
          </Accordion>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-white rounded-lg p-6 shadow-sm overflow-y-auto h-[75vh]">
          <h2 className="text-center text-sm font-semibold mb-6">
            Schedule Services and Service Costs
          </h2>

          <div className="text-sm leading-relaxed text-gray-800 space-y-4">

            <ol className="list-decimal ml-5 space-y-2">
              {rightPanelItems.map((item) => {
                const text = getData(item.key);
                // Only render list item if data exists and is not the default "Data not available"
                if (!text || text === "Data not available" || text === "") return null;
                return (
                  <li key={item.id}>
                    {text}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- COMPONENTS ---------------- */

const Accordion = ({ title, children, isOpen, onClick, active }) => (
  <div className="bg-gray-100 rounded-lg">
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg
        ${
          active
            ? "text-sidebar"
            : "text-gray-900"
        }`}
    >
      {title}
      {isOpen ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>

    {isOpen && children && (
      <div className="px-4 pb-4">{children}</div>
    )}
  </div>
);

export default MyLease;
