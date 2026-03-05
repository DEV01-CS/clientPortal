import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchDashboardData } from "../services/dashboardService";

const MarketComparison = () => {
  const [selectedView, setSelectedView] = useState("comparison"); // 'comparison' or 'analysis'
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchDashboardData();
        if (response.data) {
          setMarketData(response.data);
        }
      } catch (error) {
        console.error("Error loading market data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getData = useCallback((key) => {
    if (!marketData) return "";
    // Try exact match, or match with different quote types
    return marketData[key] || marketData[key.replace('"', '”')] || marketData[key.replace('”', '"')] || "";
  }, [marketData]);

  const comparisonData = useMemo(() => [
    {
      category: "Service Charge (£/unit/year)",
      yourProperty: getData('4"01') || "N/A",
      market: getData('4"18') || "N/A",
      insight: getData('4"35') || "N/A",
    },
    {
      category: "Service Charge per sqm (£/sqm)",
      yourProperty: getData('4"02') || "N/A",
      market: getData('4"19') || "N/A",
      insight: getData('4"36') || "N/A",
    },
    {
      category: "Total Annual Budget",
      yourProperty: getData('4"03') || "N/A",
      market: getData('4"20') || "N/A",
      insight: getData('4"37') || "N/A",
    },
    {
      category: "Budget Change (YoY)",
      yourProperty: getData('4"04') || "N/A",
      market: getData('4"21') || "N/A",
      insight: getData('4"38') || "N/A",
    },
    {
      category: "Management Fee (%)",
      yourProperty: getData('4"05') || "N/A",
      market: getData('4"22') || "N/A",
      insight: getData('4"39') || "N/A",
    },
    {
      category: "Staffing Costs (%)",
      yourProperty: getData('4"06') || "N/A",
      market: getData('4"23') || "N/A",
      insight: getData('4"40') || "N/A",
    },
    {
      category: "Utilities Costs (%)",
      yourProperty: getData('4"07') || "N/A",
      market: getData('4"24') || "N/A",
      insight: getData('4"41') || "N/A",
    },
    {
      category: "Maintenance & Repairs (%)",
      yourProperty: getData('4"08') || "N/A",
      market: getData('4"25') || "N/A",
      insight: getData('4"42') || "N/A",
    },
    {
      category: "Sinking / Reserve Fund (£/unit)",
      yourProperty: getData('4"09') || "N/A",
      market: getData('4"26') || "N/A",
      insight: getData('4"43') || "N/A",
    },
    {
      category: "Cleaning & Concierge Costs (£/unit)",
      yourProperty: getData('4"10') || "N/A",
      market: getData('4"27') || "N/A",
      insight: getData('4"44') || "N/A",
    },
    {
      category: "Insurance Cost (£/unit)",
      yourProperty: getData('4"11') || "N/A",
      market: getData('4"28') || "N/A",
      insight: getData('4"45') || "N/A",
    },
    {
      category: "Number of Units",
      yourProperty: getData('4"12') || "N/A",
      market: getData('4"29') || "N/A",
      insight: getData('4"46') || "N/A",
    },
    {
      category: "Building Type",
      yourProperty: getData('4"13') || "N/A",
      market: getData('4"30') || "N/A",
      insight: getData('4"47') || "N/A",
    },
    {
      category: "Building Age",
      yourProperty: getData('4"14') || "N/A",
      market: getData('4"31') || "N/A",
      insight: getData('4"48') || "N/A",
    },
    {
      category: "Lift / M&E Complexity",
      yourProperty: getData('4"15') || "N/A",
      market: getData('4"32') || "N/A",
      insight: getData('4"49') || "N/A",
    },
    {
      category: "Geographic Location",
      yourProperty: getData('4"16') || "N/A",
      market: getData('4"33') || "N/A",
      insight: getData('4"50') || "N/A",
    },
    {
      category: "Overall Cost Position",
      yourProperty: getData('4"17') || "N/A",
      market: getData('4"34') || "N/A",
      insight: getData('4"51') || "N/A",
    },
  ], [getData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-600">Loading market comparison...</div>
      </div>
    );
  }

  return (
    <div className="font-inter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Market Comparison</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg cursor-pointer">
            {/* <span className="text-sm font-medium text-gray-700">Wandsworth, SW18</span> */}
            <span className="text-sm font-medium text-gray-700">{getData('1"01').split(',')[getData('1"01').split(',').length - 1]}</span>
          </div>
          <button className="px-4 py-2 bg-sidebar text-white rounded-lg font-medium hover:bg-teal-600 transition-colors">
            SCUK Rating System
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSelectedView("comparison")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedView === "comparison"
              ? "text-sidebar border-b-2 border-sidebar"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Comparison
        </button>
        <button
          onClick={() => setSelectedView("analysis")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedView === "analysis"
              ? "text-sidebar border-b-2 border-sidebar"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Analysis
        </button>
      </div>

      {/* Comparison View */}
      {selectedView === "comparison" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-white bg-sidebar">
                    Your Property
                  </th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-900">
                    Market
                  </th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-900">
                    Insight
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-900">{row.category}</td>
                    <td className="py-3 px-6 text-sm text-center text-white bg-sidebar">
                      {row.yourProperty}
                    </td>
                    <td className="py-3 px-6 text-sm text-center text-gray-900">
                      {row.market}
                    </td>
                    <td className="py-3 px-6 text-sm text-center">
                      <InsightIndicator level={row.insight} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analysis View */}
      {selectedView === "analysis" && (
        <div className="space-y-6">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Analysis Points */}
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
              <div >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Age</h3>
                <p className="text-sm text-gray-700">
                  The property's age is listed as <span className="font-semibold">{getData('4"14') || 'not specified'}</span>. Older buildings may require higher maintenance and reserve fund contributions for structural elements, roofing, and plant machinery.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Type & Size
                </h3>
                <p className="text-sm text-gray-700">
                  This is a <span className="font-semibold">{getData('4"13') || 'unspecified'}</span> type building with <span className="font-semibold">{getData('4"12') || 'an unknown number of'}</span> units. The size of the building can impact economies of scale for service charges.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Services & Amenities
                </h3>
                <p className="text-sm text-gray-700">
                  The staffing costs are <span className="font-semibold">{getData('4"06') || 'not specified'}</span> of the budget, and cleaning/concierge costs are <span className="font-semibold">{getData('4"10') || 'not specified'}</span>. Amenities like these can be a significant driver of service charge costs.
                </p>
              </div>
            </div>

            {/* Right Column - Categories and CTA */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm space-y-6 flex flex-col">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <AnalysisCategoryItem name="Staffing Costs" value={getData('4"06')} />
                  <AnalysisCategoryItem name="Maintenance & Repairs" value={getData('4"08')} />
                  <AnalysisCategoryItem name="Utilities Costs" value={getData('4"07')} />
                  <AnalysisCategoryItem name="Insurance Cost" value={getData('4"11')} />
                  <AnalysisCategoryItem name="Management Fee" value={getData('4"05')} />
                  <AnalysisCategoryItem name="Sinking / Reserve Fund" value={getData('4"09')} />
                </div>
              </div>

              {/* Premium CTA */}
              <div className="mt-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-6 text-white text-center">
                <p className="text-lg font-semibold mb-2">
                  Subscribe to <span className="font-bold text-sidebar">Premium</span>
                </p>
                <p className="text-sm text-gray-300">
                  to find out next steps and gain expert support.
                </p>
              </div>
            </div>
          </div>

          {/* Notes and Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Notes</h3>
              {renderTextAsList(getData('4"52'))}
            </div>

            {/* Recommendation Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Recommendation
              </h3>
              {renderTextAsList(getData('4"53'))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalysisCategoryItem = ({ name, value }) => (
  <div className="px-4 py-3 bg-white rounded-lg flex justify-between items-center shadow-sm">
    <span className="text-sm text-gray-800 font-medium">{name}</span>
    <span className="text-sm text-sidebar font-semibold">{value || 'N/A'}</span>
  </div>
);

const InsightIndicator = ({ level }) => {
  if (!level || level === "N/A" || level.trim() === "") {
    return <span className="text-sm text-gray-500">N/A</span>;
  }

  const levelLower = level.toLowerCase();
  let color = 'bg-gray-400';
  let position = '50%'; // Default to medium

  if (levelLower.includes('very low')) {
    color = 'bg-green-500';
    position = '10%';
  } else if (levelLower.includes('low')) {
    color = 'bg-teal-400';
    position = '30%';
  } else if (levelLower.includes('medium')) {
    color = 'bg-yellow-400';
    position = '50%';
  } else if (levelLower.includes('high')) {
    color = 'bg-orange-500';
    position = '70%';
  } else if (levelLower.includes('very high')) {
    color = 'bg-red-500';
    position = '90%';
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="w-28 bg-gray-200 rounded-full h-2.5 relative">
        <div className={`absolute top-0 h-2.5 rounded-full ${color}`} style={{ width: position }}></div>
      </div>
      <span className="text-xs text-gray-600">{level}</span>
    </div>
  );
};

const renderTextAsList = (text) => {
  if (!text || text === "Data not available" || text.trim() === "") {
    return <p className="text-sm text-gray-500">Data not available</p>;
  }
  // Split by newline or dot followed by a space to handle different formatting
  const sentences = text.split(/(?:\r\n|\n|\.\s+)/).map(s => s.trim()).filter(s => s.length > 0);
  
  return (
    <ul className="space-y-3 text-sm text-gray-700">
      {sentences.map((sentence, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="text-sidebar mt-1">•</span>
          <span>{sentence}</span>
        </li>
      ))}
    </ul>
  );
};

export default MarketComparison;
