import { useState, useMemo, useEffect, useCallback } from "react";
import { fetchDashboardData } from "../services/dashboardService";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const MyTrends = () => {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [appData, setAppData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchDashboardData();
        if (response.data) {
          setAppData(response.data);
        }
      } catch (error) {
        console.error("Error loading trends data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get raw data (returns null if missing/empty) for display
  const getData = useCallback((key) => {
    if (!appData) return null;
    let value = appData[key];
    if (value === undefined) value = appData[key.replace('"', '”')];
    if (value === undefined) value = appData[key.replace('”', '"')];

    if (value === undefined || value === null || String(value).trim() === '') return null;
    return value;
  }, [appData]);

  // Get numeric data (returns 0 if missing) for charts
  const getNumber = useCallback((key) => {
    const val = getData(key);
    if (val === null) return 0;
    const num = parseFloat(String(val).replace(/,/g, '').replace(/£/g, ''));
    return isNaN(num) ? 0 : num;
  }, [getData]);

  // Budget Table Data (2"02 to 2"15)
  const budgetTableData = useMemo(() => {
    const categories = [
      { name: "Staff", budgetKey: '2"02', actualKey: '2"09' },
      { name: "Contracts & Maintenance", budgetKey: '2"03', actualKey: '2"10' },
      { name: "Utilities", budgetKey: '2"04', actualKey: '2"11' },
      { name: "Insurance", budgetKey: '2"05', actualKey: '2"12' },
      { name: "Professional Fees", budgetKey: '2"06', actualKey: '2"13' },
      { name: "Compliance", budgetKey: '2"07', actualKey: '2"14' },
      { name: "Reserve Fund", budgetKey: '2"08', actualKey: '2"15' },
    ];

    // If selected year is 2025, use the detailed keys (2"02 - 2"15)
    if (selectedYear === "2025") {
      return categories.map(cat => ({
        category: cat.name,
        budget: getData(cat.budgetKey),
        actual: getData(cat.actualKey),
      }));
    }

    // For other years, map from trend data (2"17 onwards)
    // 2023: 17-23, 2024: 24-30, 2026: 38-44
    // Note: 2025 trend data is 31-37, but we use detailed keys for 2025 above
    const yearMap = { "2023": 17, "2024": 24, "2026": 38 };
    const startKey = yearMap[selectedYear];

    if (startKey) {
      return categories.map((cat, index) => {
        const key = `2"${String(startKey + index).padStart(2, '0')}`;
        return {
          category: cat.name,
          budget: getData(key), // Assuming trend data represents Budget
          actual: null // No actuals available for these years in this view
        };
      });
    }

    return categories.map(cat => ({ category: cat.name, budget: null, actual: null }));
  }, [appData, selectedYear, getData]);

  // Budget data for pie chart (year-specific)
  const budgetData = useMemo(() => {
    // Create a map for O(1) lookup instead of repeated .find()
    const budgetMap = new Map(budgetTableData.map(item => [item.category, parseFloat(item.budget || 0) || 0]));

    return [
      { name: "Staff", value: budgetMap.get("Staff") || 0, color: "#14B8A6" },
      { name: "Contracts & Maintenance", value: budgetMap.get("Contracts & Maintenance") || 0, color: "#5EEAD4" },
      { name: "Utilities", value: budgetMap.get("Utilities") || 0, color: "#99F6E4" },
      { name: "Other", value: (budgetMap.get("Insurance") || 0) + (budgetMap.get("Professional Fees") || 0) + (budgetMap.get("Compliance") || 0) + (budgetMap.get("Reserve Fund") || 0), color: "#E5E7EB" },
    ];
  }, [budgetTableData]);

  // Calculate variance for bar chart (year-specific)
  const varianceData = useMemo(() => {
    const varianceValue = getNumber('2"16');
    return budgetTableData.map((item, index) => {
      let variance = 0;
      const budget = parseFloat(item.budget || 0);
      const actual = parseFloat(item.actual || 0);

      if (index === 0 && selectedYear === "2025") {
        variance = varianceValue;
      } else if (item.budget && item.actual) {
        variance = ((actual - budget) / (budget || 1)) * 100;
      }
      return { category: item.category, variance };
    });
  }, [budgetTableData, selectedYear, getNumber]);

  // Past budget trends data (2"17 to 2"44)
  const pastBudgetsData = useMemo(() => {
    const years = [2023, 2024, 2025, 2026];
    const categories = [
        "Staff", "Contracts & Maintenance", "Utilities", "Insurance",
        "Professional Fees", "Compliance", "Reserve Fund"
    ];
    const data = [];
    let keyIndex = 17;
    for (const year of years) {
        const yearData = { year };
        for (const cat of categories) {
            const key = `2"${String(keyIndex).padStart(2, '0')}`;
            yearData[cat] = getNumber(key);
            keyIndex++;
        }
        data.push(yearData);
    }
    return data;
  }, [getNumber]);

  const trendLineCategories = [
    { name: "Staff", color: "#1E40AF" },
    { name: "Contracts & Maintenance", color: "#60A5FA" },
    { name: "Utilities", color: "#93C5FD" },
    { name: "Insurance", color: "#F87171" },
    { name: "Professional Fees", color: "#FB923C" },
    { name: "Compliance", color: "#FBBF24" },
    { name: "Reserve Fund", color: "#4ADE80" },
  ];

  // Influencers data
  const influencersData = useMemo(() => {
    const categories = [
        { name: "Managing Fees", key: '2"42', group: 'Internal' },
        { name: "Staff", key: '2"41', group: 'Internal' },
        { name: "C, M & S", key: '2"43', group: 'External' },
        { name: "Compliance", key: '2"44', group: 'External' },
        { name: "Insurance", key: '2"45', group: 'External' },
        { name: "Utilities", key: '2"46', group: 'External' },
        { name: "Reserve Fund", key: '2"47', group: 'External' },
        { name: "Other", key: '2"48', group: 'External' },
    ];
    return categories.map(cat => ({
        category: cat.name,
        value: getNumber(cat.key),
        group: cat.group,
        fill: cat.group === 'Internal' ? '#14B8A6' : '#3B82F6',
    }));
  }, [getNumber]);

  // Calculate totals (year-specific)
  const totalBudget = useMemo(() => {
    return budgetTableData.reduce((sum, item) => sum + (parseFloat(item.budget) || 0), 0);
  }, [budgetTableData]);

  const totalActual = useMemo(() => {
    return budgetTableData.reduce((sum, item) => sum + (parseFloat(item.actual) || 0), 0);
  }, [budgetTableData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading trends data...</div>
      </div>
    );
  }

  return (
    <div className="font-inter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Trends</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Wandsworth, SW18</span>
        </div>
      </div>

      {/* Budget Overview Section */}
      <div className="shadow-sm ">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-start gap-4 mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Budget {selectedYear}
            </h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <div className="lg:col-span-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Table */}
            <div className="lg:col-span-1">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-700">Category</th>
                      <th className="text-right py-2 text-gray-700">Budget</th>
                      <th className="text-right py-2 text-gray-700">Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetTableData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 text-gray-900">{item.category}</td>
                        <td className="text-right py-2 text-gray-700">
                          {item.budget !== null ? `£${parseFloat(item.budget).toLocaleString()}` : "N/A"}
                        </td>
                        <td className="text-right py-2 text-gray-700">
                          {item.actual !== null ? `£${parseFloat(item.actual).toLocaleString()}` : "N/A"}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-2 text-gray-900">Total</td>
                      <td className="text-right py-2 text-gray-900">
                        £{totalBudget.toLocaleString()}
                      </td>
                      <td className="text-right py-2 text-gray-900">
                        £{totalActual.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget vs Actual Chart */}
            <div className="lg:col-span-1 bg-white rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Budget vs Actual
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={varianceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[-50, 50]} tickFormatter={(value) => `${value}%`} />
                  <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <ReferenceLine x={0} stroke="#000" />
                  <Bar dataKey="variance" >
                    {varianceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.variance >= 0 ? '#14B8A6' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-100 p-4 rounded-lg">
        {/* Past Budget Trends */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Past Budget</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pastBudgetsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `£${value.toLocaleString()}`} />
              <Tooltip />
              <Legend />
              {trendLineCategories.map(cat => (
                <Line
                  key={cat.name}
                  type="monotone"
                  dataKey={cat.name}
                  stroke={cat.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Influencers */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Influencers</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={influencersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[-10, 10]} tickFormatter={(value) => `${value}%`} />
              <Tooltip />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="value">
                {influencersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-sidebar"></div>
              <span className="text-sm text-gray-600">Internal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600"></div>
              <span className="text-sm text-gray-600">External</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTrends;
