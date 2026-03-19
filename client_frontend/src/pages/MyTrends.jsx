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
  Customized,
} from "recharts";

/* ─── Custom Pie Tooltip ─────────────────────────────── */
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-sidebar font-medium">£{Number(value).toLocaleString("en-GB")}</p>
      </div>
    );
  }
  return null;
};

/* ─── Custom Variance Bar Tooltip ────────────────────── */
const VarianceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#14B8A6" }}>
            Variance: {typeof p.value === "number" ? `${p.value.toFixed(1)}%` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Custom Influencers Tooltip ─────────────────────── */
const InfluencersTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill || "#14B8A6" }}>
            Year on Year % Change: {typeof p.value === "number" ? `${p.value.toFixed(1)}%` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Separator between Internal / External groups ───── */
const GroupSeparator = (props) => {
  const { xAxisMap, offset } = props;
  const xAxis = xAxisMap && Object.values(xAxisMap)[0];
  if (!xAxis?.scale?.bandwidth) return null;

  const bw        = xAxis.scale.bandwidth();
  const staffPos  = xAxis.scale("Staff");
  const cmsPos    = xAxis.scale("C, M & S");
  if (staffPos === undefined || cmsPos === undefined) return null;

  const xPos  = staffPos + bw + (cmsPos - staffPos - bw) / 2;
  const yTop  = offset.top;
  const yBot  = offset.top + offset.height;

  // label positions
  const internalMid = (xAxis.scale("Managing Fees") + staffPos + bw) / 2;
  const externalMid = (cmsPos + xAxis.scale("Reserve Fund") + bw) / 2;

  return (
    <g>
      {/* vertical dashed separator */}
      <line x1={xPos} y1={yTop} x2={xPos} y2={yBot}
            stroke="#94A3B8" strokeDasharray="5 4" strokeWidth={1.5} />
      {/* bottom group labels */}
      <text x={internalMid} y={yBot + 42} textAnchor="middle" fontSize={11} fill="#14B8A6" fontWeight={600}>
        Internal
      </text>
      <text x={externalMid} y={yBot + 42} textAnchor="middle" fontSize={11} fill="#3B82F6" fontWeight={600}>
        External
      </text>
      {/* bottom axis line */}
      <line x1={offset.left} y1={yBot} x2={offset.left + offset.width} y2={yBot}
            stroke="#9CA3AF" strokeWidth={1} />
    </g>
  );
};

/* ─── Section Card ───────────────────────────────────── */
const SectionCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ─── Main Component ─────────────────────────────────── */
const MyTrends = () => {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [appData, setAppData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSeries, setActiveSeries] = useState(null);

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

  const getData = useCallback((key) => {
    if (!appData) return null;
    let value = appData[key];
    if (value === undefined) value = appData[key.replace('"', "\u201c")];
    if (value === undefined) value = appData[key.replace('"', "\u201d")];
    if (value === undefined || value === null || String(value).trim() === "") return null;
    return value;
  }, [appData]);

  const getNumber = useCallback((key) => {
    const val = getData(key);
    if (val === null) return 0;
    const num = parseFloat(String(val).replace(/,/g, "").replace(/£/g, ""));
    return isNaN(num) ? 0 : num;
  }, [getData]);

  /* ── Budget table ── */
  const budgetTableData = useMemo(() => {
    const categories = [
      { name: "Staff",                   budgetKey: '2"02', actualKey: '2"09' },
      { name: "Contracts & Maintenance", budgetKey: '2"03', actualKey: '2"10' },
      { name: "Utilities",               budgetKey: '2"04', actualKey: '2"11' },
      { name: "Insurance",               budgetKey: '2"05', actualKey: '2"12' },
      { name: "Professional Fees",       budgetKey: '2"06', actualKey: '2"13' },
      { name: "Compliance",              budgetKey: '2"07', actualKey: '2"14' },
      { name: "Reserve Fund",            budgetKey: '2"08', actualKey: '2"15' },
    ];
    if (selectedYear === "2025") {
      return categories.map(cat => ({
        category: cat.name,
        budget: getData(cat.budgetKey),
        actual: getData(cat.actualKey),
      }));
    }
    const yearMap = { "2023": 17, "2024": 23, "2026": 35 };
    const startKey = yearMap[selectedYear];
    if (startKey) {
      const trendOffsets = {
        "Staff": 0, "Contracts & Maintenance": 1, "Utilities": 2,
        "Insurance": 3, "Compliance": 4, "Reserve Fund": 5,
      };
      return categories.map(cat => {
        const offset = trendOffsets[cat.name];
        if (offset !== undefined) {
          const key = `2"${String(startKey + offset).padStart(2, "0")}`;
          return { category: cat.name, budget: getData(key), actual: null };
        }
        return { category: cat.name, budget: null, actual: null };
      });
    }
    return categories.map(cat => ({ category: cat.name, budget: null, actual: null }));
  }, [selectedYear, getData]);

  /* ── Pie chart ── */
  const budgetData = useMemo(() => {
    const m = new Map(budgetTableData.map(i => [i.category, parseFloat(i.budget || 0) || 0]));
    return [
      { name: "Staff",                   value: m.get("Staff") || 0,                   color: "#14B8A6" },
      { name: "Contracts & Maintenance", value: m.get("Contracts & Maintenance") || 0, color: "#5EEAD4" },
      { name: "Utilities",               value: m.get("Utilities") || 0,               color: "#99F6E8" },
      {
        name: "Other",
        value: (m.get("Insurance") || 0) + (m.get("Professional Fees") || 0) +
               (m.get("Compliance") || 0) + (m.get("Reserve Fund") || 0),
        color: "#E5E7EB",
      },
    ];
  }, [budgetTableData]);

  /* ── Variance bar ── */
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

  /* ── Past Budget Value line chart ── */
  const pastBudgetsData = useMemo(() => {
    const years = [2023, 2024, 2025, 2026];
    const categories = [
      "Staff", "Contracts & Maintenance", "Utilities",
      "Insurance", "Professional Fees", "Compliance", "Reserve Fund",
    ];
    const data = [];
    let keyIndex = 17;
    for (const year of years) {
      const yearData = { year };
      for (const cat of categories) {
        const key = `2"${String(keyIndex).padStart(2, "0")}`;
        yearData[cat] = getNumber(key);
        keyIndex++;
      }
      data.push(yearData);
    }
    return data;
  }, [getNumber]);

  const trendLineCategories = [
    { name: "Staff",                   color: "#14B8A6" },
    { name: "Contracts & Maintenance", color: "#3B82F6" },
    { name: "Utilities",               color: "#F59E0B" },
    { name: "Insurance",               color: "#EF4444" },
    { name: "Professional Fees",       color: "#8B5CF6" },
    { name: "Compliance",              color: "#EC4899" },
    { name: "Reserve Fund",            color: "#10B981" },
  ];

  /* ── Budget Influencers (Year on Year % Change) — no "Other" ── */
  const influencersData = useMemo(() => {
    const categories = [
      { name: "Managing Fees", key: '2"42', group: "Internal" },
      { name: "Staff",         key: '2"41', group: "Internal" },
      { name: "C, M & S",      key: '2"43', group: "External" },
      { name: "Compliance",    key: '2"44', group: "External" },
      { name: "Insurance",     key: '2"45', group: "External" },
      { name: "Utilities",     key: '2"46', group: "External" },
      { name: "Reserve Fund",  key: '2"47', group: "External" },
    ];
    return categories.map(cat => ({
      category: cat.name,
      yoyChange: getNumber(cat.key),
      group: cat.group,
      fill: cat.group === "Internal" ? "#14B8A6" : "#3B82F6",
    }));
  }, [getNumber]);

  const totalBudget = useMemo(() => budgetTableData.reduce((s, i) => s + (parseFloat(i.budget) || 0), 0), [budgetTableData]);
  const totalActual = useMemo(() => budgetTableData.reduce((s, i) => s + (parseFloat(i.actual) || 0), 0), [budgetTableData]);

  /* Line tooltip — shows only the hovered series (individual dot) */
  const LineTooltipSingle = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const filtered = activeSeries
        ? payload.filter(p => p.dataKey === activeSeries)
        : [];
      if (!filtered.length) return null;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          {filtered.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {p.name}: £{Number(p.value).toLocaleString("en-GB")}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, [activeSeries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-500 text-sm">Loading trends data…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-quicksand space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Trends</h1>
        <p className="text-sm text-gray-500 mt-1">View and analyse your service charge budget, actuals and trends over time.</p>
      </div>

      {/* ── Budget Analysis ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Budget Analysis</h2>
            <p className="text-xs text-gray-500 mt-0.5">Breakdown of your service charge budget and actual spend by category.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Year of Analysis</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar bg-white"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Budget Distribution</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={budgetData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={95} dataKey="value">
                  {budgetData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Budget vs Actual ({selectedYear})</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Category</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Budget</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Actual</th>
                </tr>
              </thead>
              <tbody>
                {budgetTableData.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 text-gray-800">{item.category}</td>
                    <td className="text-right py-2 text-gray-700">
                      {item.budget !== null ? `£${parseFloat(item.budget).toLocaleString("en-GB")}` : <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="text-right py-2 text-gray-700">
                      {item.actual !== null ? `£${parseFloat(item.actual).toLocaleString("en-GB")}` : <span className="text-gray-400">N/A</span>}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-semibold">
                  <td className="py-2 text-gray-900">Total</td>
                  <td className="text-right py-2 text-gray-900">£{totalBudget.toLocaleString("en-GB")}</td>
                  <td className="text-right py-2 text-gray-900">£{totalActual.toLocaleString("en-GB")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Variance */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Variance (Budget vs Actual)</p>
            <p className="text-xs text-gray-400 mb-3">Positive = over budget · Negative = under budget</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={varianceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[-50, 50]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" width={130} tick={{ fontSize: 10 }} />
                <Tooltip content={<VarianceTooltip />} />
                <ReferenceLine x={0} stroke="#9CA3AF" />
                <Bar dataKey="variance" radius={[0, 3, 3, 0]}>
                  {varianceData.map((entry, i) => (
                    <Cell key={i} fill={entry.variance >= 0 ? "#14B8A6" : "#EF4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Year on Year Variances ────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Year on Year Variances</h2>
        <p className="text-xs text-gray-500 mb-4">Historical budget values and the key influencers driving year-on-year changes.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Past Budget Value */}
          <SectionCard
            title="Past Budget Value"
            subtitle="Historical budget spend per category across all years."
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pastBudgetsData}
                onMouseLeave={() => setActiveSeries(null)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => `£${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  tick={{ fontSize: 10 }}
                  width={55}
                />
                <Tooltip content={<LineTooltipSingle />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                {trendLineCategories.map(cat => (
                  <Line
                    key={cat.name}
                    type="monotone"
                    dataKey={cat.name}
                    stroke={cat.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{
                      r: 6,
                      onMouseEnter: () => setActiveSeries(cat.name),
                      onMouseLeave: () => setActiveSeries(null),
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Budget Influencers */}
          <SectionCard
            title="Budget Influencers"
            subtitle="Year on year % change in key cost categories — Internal vs External drivers."
          >
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={influencersData} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="category"
                  angle={-30}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: "#9CA3AF" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[-10, 10]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: "#9CA3AF" }}
                />
                <Tooltip content={<InfluencersTooltip />} />
                <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
                <Bar dataKey="yoyChange" name="Year on Year % Change" radius={[3, 3, 0, 0]}>
                  {influencersData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
                <Customized component={GroupSeparator} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default MyTrends;
