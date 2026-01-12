import { useState } from "react";
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
} from "recharts";

const MyTrends = () => {
  const [selectedYear, setSelectedYear] = useState("2025");

  // Budget data for pie chart
  const budgetData = [
    { name: "Staff", value: 100000, color: "#14B8A6" },
    { name: "Contracts & Maintenance", value: 80000, color: "#5EEAD4" },
    { name: "Utilities", value: 60000, color: "#99F6E4" },
    { name: "Other", value: 130000, color: "#E5E7EB" },
  ];

  // Budget vs Actual table data
  const budgetTableData = [
    { category: "Staff", budget: 20000, actual: 25000 },
    { category: "Contracts & Maintenance", budget: 80000, actual: 75000 },
    { category: "Utilities", budget: 60000, actual: 65000 },
    { category: "Insurance", budget: 30000, actual: 32000 },
    { category: "Professional Fees", budget: 40000, actual: 38000 },
    { category: "Compliance", budget: 50000, actual: 55000 },
    { category: "Reserve Fund", budget: 100000, actual: 110000 },
  ];

  // Calculate variance for bar chart
  const varianceData = budgetTableData.map((item) => ({
    category: item.category,
    variance: ((item.actual - item.budget) / item.budget) * 100,
  }));

  // Past budget trends data
  const trendsData = [
    { year: 2023, yourServiceCharge: 15, tpiIndex: 12, staff: 8 },
    { year: 2024, yourServiceCharge: 20, tpiIndex: 15, staff: 6 },
    { year: 2025, yourServiceCharge: 28, tpiIndex: 18, staff: 10 },
    { year: 2026, yourServiceCharge: 25, tpiIndex: 20, staff: 12 },
  ];

  // Influencers data
  const influencersData = [
    { category: "Managing Fees", value: -2 },
    { category: "Staff", value: 4 },
    { category: "C, M & S", value: 3 },
    { category: "Compliance", value: 5 },
    { category: "Insurance", value: 2 },
    { category: "Utilities", value: 1 },
    { category: "Reserve Fund", value: 6 },
  ];

  const totalBudget = budgetTableData.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = budgetTableData.reduce((sum, item) => sum + item.actual, 0);

  return (
    <div className="font-inter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Trends</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Wandsworth, SW18</span>
          <span className="text-gray-500">▼</span>
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
                          £{item.budget.toLocaleString()}
                        </td>
                        <td className="text-right py-2 text-gray-700">
                          £{item.actual.toLocaleString()}
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
                  <XAxis type="number" domain={[-50, 50]} />
                  <YAxis dataKey="category" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="variance" fill="#14B8A6" />
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
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 40]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="yourServiceCharge"
                stroke="#1E40AF"
                strokeWidth={2}
                name="Your Service Charge"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="tpiIndex"
                stroke="#60A5FA"
                strokeWidth={2}
                name="TPI Service Charge Index"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="staff"
                stroke="#9CA3AF"
                strokeWidth={2}
                name="Staff"
                dot={{ r: 4 }}
              />
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
              <YAxis domain={[-4, 8]} />
              <Tooltip />
              <Bar dataKey="value" fill="#14B8A6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-sidebar"></div>
              <span className="text-sm text-gray-600">Internal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500"></div>
              <span className="text-sm text-gray-600">External</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTrends;

