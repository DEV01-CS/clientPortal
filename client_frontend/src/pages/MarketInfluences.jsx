import { useState, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { fetchDashboardData } from "../services/dashboardService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

const MarketInfluences = () => {
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

  const getData = (key) => {
    if (!marketData) return "";
    // Try exact match, or match with different quote types
    return marketData[key] || marketData[key.replace('"', '”')] || marketData[key.replace('”', '"')] || "";
  };

  const renderTextAsList = (text) => {
    if (!text || text === "Data not available") return <p className="text-sm font-medium text-gray-500">Data not available</p>;
    const sentences = text.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    return (
      <ul className="space-y-1 text-sm font-medium text-gray-900">
        {sentences.map((sentence, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-sidebar mt-0.5">•</span>
            <span>{sentence}</span>
          </li>
        ))}
      </ul>
    );
  };

  const budgetImpactsData = useMemo(() => {
    const dataString = getData('3"05');
    if (!dataString || dataString === "Data not available" || dataString.toLowerCase().includes("chart to be developed")) {
        return [];
    }
    try {
        return dataString.split(',').map((item, index) => {
            const cleanItem = item.trim();
            if (!cleanItem) return null;

            let category = `Item ${index + 1}`;
            let value = 0;

            if (cleanItem.includes(':')) {
                const parts = cleanItem.split(':');
                category = parts[0].trim();
                value = parseFloat(parts[1].trim());
            } else {
                value = parseFloat(cleanItem);
            }

            if (isNaN(value)) return null;
            return {
                category,
                value,
                fill: value >= 0 ? '#14B8A6' : '#ef4444' // teal for positive, red for negative
            };
        }).filter(Boolean); // remove nulls
    } catch (e) {
        console.error("Failed to parse chart data for Headline Budget Impacts", e);
        return [];
    }
  }, [marketData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-600">Loading market influences...</div>
      </div>
    );
  }

  return (
    <div className="font-inter space-y-6 p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-start gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Market Influences</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg cursor-pointer">
            <span className="text-sm font-medium text-gray-700">{getData('1"01') || 'Wandsworth'}, {getData('1"03') || 'SW18'}</span>
          </div>
          <button 
            onClick={() => {
                const link = getData('3"04');
                if (link && link !== "Data not available" && link !== "") {
                    window.open(link, '_blank');
                }
            }}
            className="px-4 py-2 bg-sidebar text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
          >
            SCUK Rating System
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Key Drivers */}
        <div className="bg-gray-100 rounded-lg p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">
            Key Service Charge Drivers
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Age</p>
              {renderTextAsList(getData('3"01'))}
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Type & size of building</p>
              {renderTextAsList(getData('3"02'))}
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Services & Amenities</p>
              {renderTextAsList(getData('3"03'))}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Services charger UK rating</p>
              {renderTextAsList(getData('3"04'))}
            </div>
          </div>
        </div>

        {/* Right Column - Budget Impacts */}
        <div className="space-y-6">
           <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-sidebar">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Headline Budget Impacts</h3>
            <div className="text-sm text-gray-700 h-[300px]">
                {budgetImpactsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetImpactsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                            <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                            <ReferenceLine x={0} stroke="#000" />
                            <Bar dataKey="value">
                                {budgetImpactsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-500 italic">
                            {getData('3"05') && getData('3"05').toLowerCase().includes("chart to be developed") ? "Chart to be developed" : "Data not available"}
                        </p>
                    </div>
                )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-2">Note</h3>
            <p className="text-sm text-gray-600">
              These factors are key determinants of your service charge budget. Understanding them can help in benchmarking against similar properties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInfluences;