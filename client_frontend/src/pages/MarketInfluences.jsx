import { useState, useEffect, useCallback } from "react";
import { fetchDashboardData } from "../services/dashboardService";

const impactConfig = {
  high:   { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-400",    label: "High",   text: "text-red-700",   tipText: "text-red-300"   },
  medium: { bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400",  label: "Medium", text: "text-amber-700", tipText: "text-amber-300" },
  low:    { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-400",  label: "Low",    text: "text-green-700", tipText: "text-green-300" },
};

const matrixRows = [
  { category: "Staff",                  age: "low",    typeSize: "low",    services: "medium" },
  { category: "Contracts & Maintenance",age: "high",   typeSize: "medium", services: "low"    },
  { category: "Utilities",              age: "high",   typeSize: "low",    services: "low"    },
  { category: "Insurance",              age: "medium", typeSize: "low",    services: "low"    },
  { category: "Professional Fees",      age: "medium", typeSize: "low",    services: "low"    },
  { category: "Reserve Fund",           age: "high",   typeSize: "medium", services: "low"    },
];

const matrixTooltips = {
  "Staff-age":                    "Building age has low impact on staff costs. Staffing is driven more by services offered.",
  "Staff-typeSize":               "Smaller buildings spread staffing costs across fewer flats, slightly increasing per-flat cost.",
  "Staff-services":               "Concierge and premium services significantly increase staff costs.",
  "Contracts & Maintenance-age":  "Older buildings require more frequent maintenance contracts, significantly increasing costs.",
  "Contracts & Maintenance-typeSize": "Building size affects how costs are spread; taller buildings have higher compliance costs.",
  "Contracts & Maintenance-services": "Additional services add to maintenance obligations.",
  "Utilities-age":                "Older buildings are less energy-efficient, leading to higher utility bills.",
  "Utilities-typeSize":           "Building size moderately affects total utility consumption.",
  "Utilities-services":           "Amenities like lifts and communal lighting add to utility usage.",
  "Insurance-age":                "Age increases rebuild risk and insurance premiums moderately.",
  "Insurance-typeSize":           "Building type and size affect insurance risk ratings.",
  "Insurance-services":           "Additional amenities can slightly affect insurance premiums.",
  "Professional Fees-age":        "Older buildings may require more frequent surveys and inspections.",
  "Professional Fees-typeSize":   "Larger or more complex buildings incur higher professional fee requirements.",
  "Professional Fees-services":   "More services may require additional professional management.",
  "Reserve Fund-age":             "Older buildings require higher reserve funds for major upcoming works.",
  "Reserve Fund-typeSize":        "Building type affects the scale of reserve fund contributions needed.",
  "Reserve Fund-services":        "More services mean more assets to maintain, increasing reserve fund needs.",
};

const driverImpact = { age: "high", typeSize: "medium", services: "medium" };

const renderTextAsList = (text) => {
  if (!text || text === "Data not available") {
    return <p className="text-sm text-gray-500 italic">Data not available</p>;
  }
  const sentences = text.split(".").map((s) => s.trim()).filter((s) => s.length > 0);
  return (
    <ul className="space-y-1.5">
      {sentences.map((sentence, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
          {sentence}.
        </li>
      ))}
    </ul>
  );
};

const ImpactCell = ({ level, tooltipKey }) => {
  const [pos, setPos] = useState(null);
  const cfg = impactConfig[level] || impactConfig.low;
  const tip = matrixTooltips[tooltipKey] || "";

  const handleEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <td className="p-2 text-center">
      <button
        onMouseEnter={handleEnter}
        onMouseLeave={() => setPos(null)}
        onFocus={handleEnter}
        onBlur={() => setPos(null)}
        className={`w-10 h-10 rounded-md border ${cfg.bg} ${cfg.border} flex items-center justify-center mx-auto transition-transform hover:scale-110`}
        aria-label={`${cfg.label} impact — ${tip}`}
      >
        <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
      </button>
      {pos && tip && (
        <div
          className="fixed z-[9999] w-60 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-2xl pointer-events-none"
          style={{ left: Math.min(pos.x - 120, window.innerWidth - 254), top: pos.y - 8, transform: "translateY(-100%)" }}
        >
          <span className={`font-semibold ${cfg.tipText} mr-1`}>{cfg.label} impact:</span>
          {tip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </td>
  );
};

const BuildingInfluences = () => {
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchDashboardData();
        if (response.data) setMarketData(response.data);
      } catch (error) {
        console.error("Error loading building influences data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getData = useCallback(
    (key) => marketData[key] || marketData[key.replace('"', "\u201c")] || marketData[key.replace('"', "\u201d")] || "",
    [marketData]
  );

  const handleRatingSystemClick = useCallback(() => {
    const link = getData('3"04');
    if (link && link !== "Data not available" && link !== "") window.open(link, "_blank");
  }, [getData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 text-sm">Loading building influences…</div>
      </div>
    );
  }

  const drivers = [
    { label: "Age",                   key: '3"01', impact: driverImpact.age      },
    { label: "Type & Size of Building",key: '3"02', impact: driverImpact.typeSize },
    { label: "Services & Amenities",  key: '3"03', impact: driverImpact.services  },
  ];

  return (
    <div className="font-quicksand space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Building Influences</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            How key building characteristics impact your service charge budget.
          </p>
        </div>
        <button
          onClick={handleRatingSystemClick}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors border border-gray-300"
        >
          SCUK Rating System ↗
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Key Service Charge Drivers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Key Service Charge Drivers</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This section explains how key characteristics of your building will impact your overall budget.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {drivers.map(({ label, key, impact }) => {
              const cfg = impactConfig[impact];
              return (
                <div key={label} className="flex gap-0">
                  {/* Row label */}
                  <div className="w-40 flex-shrink-0 flex items-start px-5 py-4 bg-gray-50 border-r border-gray-100">
                    <span className="text-sm font-semibold text-gray-700 leading-snug">{label}</span>
                  </div>
                  {/* Content cell */}
                  <div className={`flex-1 px-5 py-4 ${cfg.bg}`}>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold mb-2 ${cfg.text}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label} Impact
                    </span>
                    {renderTextAsList(getData(key))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — Headline Budget Impacts matrix */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Headline Budget Impacts</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This section explains how key parts of your budget will be affected by the characteristics of your building,
              the services offered and the amenities you have access to.
            </p>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-3 pr-2 font-medium text-gray-500 w-36" />
                  <th className="text-center pb-3 px-2 font-semibold text-gray-700 w-16">Age</th>
                  <th className="text-center pb-3 px-2 font-semibold text-gray-700 w-20">
                    Type &amp; Size<br />of Building
                  </th>
                  <th className="text-center pb-3 px-2 font-semibold text-gray-700 w-20">
                    Services<br />&amp; Amenities
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {matrixRows.map((row) => (
                  <tr key={row.category}>
                    <td className="py-2 pr-3 text-xs font-semibold text-gray-700 leading-tight">{row.category}</td>
                    <ImpactCell level={row.age}      tooltipKey={`${row.category}-age`}      />
                    <ImpactCell level={row.typeSize} tooltipKey={`${row.category}-typeSize`} />
                    <ImpactCell level={row.services} tooltipKey={`${row.category}-services`} />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4">
              <span className="text-xs text-gray-500 font-medium">Impact Level:</span>
              {Object.entries(impactConfig).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              ))}
              <span className="text-xs text-gray-400 ml-auto italic">Hover over a cell for details</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingInfluences;
