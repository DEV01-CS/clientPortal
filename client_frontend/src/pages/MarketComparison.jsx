import { useState } from "react";

const MarketComparison = () => {
  const [selectedView, setSelectedView] = useState("comparison"); // 'comparison' or 'analysis'

  const comparisonData = [
    {
      category: "Service Charge (£/unit/year)",
      yourProperty: "£2,551",
      market: "£2,400",
      insight: "Low",
    },
    {
      category: "Service Charge per sqm (£/sqm)",
      yourProperty: "£3.59",
      market: "£3.20",
      insight: "Low",
    },
    {
      category: "Total Annual Budget",
      yourProperty: "£370,000",
      market: "£350,000",
      insight: "Low",
    },
    {
      category: "Budget Change (YoY)",
      yourProperty: "+5%",
      market: "+3%",
      insight: "Low",
    },
    {
      category: "Management Fee (%)",
      yourProperty: "12%",
      market: "10%",
      insight: "Low",
    },
    {
      category: "Staffing Costs (%)",
      yourProperty: "27%",
      market: "25%",
      insight: "Low",
    },
    {
      category: "Utilities Costs (%)",
      yourProperty: "16%",
      market: "18%",
      insight: "Low",
    },
    {
      category: "Maintenance & Repairs (%)",
      yourProperty: "22%",
      market: "20%",
      insight: "Low",
    },
    {
      category: "Sinking / Reserve Fund (£/unit)",
      yourProperty: "£1,200",
      market: "£1,000",
      insight: "Low",
    },
    {
      category: "Cleaning & Concierge Costs (£/unit)",
      yourProperty: "£800",
      market: "£750",
      insight: "Low",
    },
    {
      category: "Insurance Cost (£/unit)",
      yourProperty: "£300",
      market: "£280",
      insight: "Low",
    },
    {
      category: "Number of Units",
      yourProperty: "145",
      market: "150",
      insight: "Low",
    },
    {
      category: "Building Type",
      yourProperty: "Residential",
      market: "Residential",
      insight: "Low",
    },
    {
      category: "Building Age",
      yourProperty: "30+ years",
      market: "25 years",
      insight: "Low",
    },
    {
      category: "Lift / M&E Complexity",
      yourProperty: "Standard",
      market: "Standard",
      insight: "Low",
    },
    {
      category: "Geographic Location",
      yourProperty: "SW18",
      market: "SW18",
      insight: "Low",
    },
    {
      category: "Overall Cost Position",
      yourProperty: "High",
      market: "Medium",
      insight: "Low",
    },
  ];

  const InsightBar = () => (
    <div className="flex items-center gap-2">
      <div className="flex h-4 w-24 rounded overflow-hidden">
        <div className="bg-green-500 w-1/6"></div>
        <div className="bg-yellow-400 w-1/3"></div>
        <div className="bg-red-500 w-1/2"></div>
      </div>
      <span className="text-sm text-gray-600">Low</span>
    </div>
  );

  return (
    <div className="font-inter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Market Comparison</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Wandsworth, SW18</span>
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
                    <td className="py-4 px-6 text-sm text-gray-900">{row.category}</td>
                    <td className="py-4 px-6 text-sm text-center text-white bg-sidebar">
                      {row.yourProperty}
                    </td>
                    <td className="py-4 px-6 text-sm text-center text-gray-900">
                      {row.market}
                    </td>
                    <td className="py-4 px-6 text-sm text-center">
                      <InsightBar />
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Age</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-sidebar mt-1">•</span>
                    <span>
                      Your property is more than 30 years old. This increases the
                      maintenance and reserve fund budget required for the structure,
                      roof and plant.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sidebar mt-1">•</span>
                    <span>
                      Your reserve fund is likely to be high to cover major works
                      projects due in the near future.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Type & Size
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-sidebar mt-1">•</span>
                    <span>
                      Your building is small so you will not benefit from being able
                      to spread budgets across a large number of flats.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sidebar mt-1">•</span>
                    <span>
                      It is not a tall high risk building so additional compliance
                      costs will not impact your budget.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Services & Amenities
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-sidebar mt-1">•</span>
                    <span>
                      You have a concierge, this services does not required high
                      maintenance or reserve fund. But employing staff can be expensive.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="text-center pt-6">
                <span className="text-2xl font-bold text-sidebar">Premium</span>
              </div>
            </div>

            {/* Right Column - Categories and CTA */}
            <div className="bg-gray-100 rounded-lg p-6 shadow-sm space-y-6">
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-gray-900">Age</h4>
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Type & Size
                    </h4>
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Services & Amenities
                    </h4>
                  </div>
                </div>

                <div className="space-y-2">
                  <CategoryItem name="Staff" />
                  <CategoryItem name="Contracts & Maintenance" />
                  <CategoryItem name="Utilities" />
                  <CategoryItem name="Insurance" />
                  <CategoryItem name="Professional Fees" />
                  <CategoryItem name="Reserve Fund" />
                </div>
              </div>

              {/* Premium CTA */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-6 text-white">
                <p className="text-sm mb-2">
                  Subscribe to <span className="font-bold text-sidebar">Premium</span>
                </p>
                <p className="text-sm text-gray-300">
                  to find out next steps and gain expert support
                </p>
              </div>
            </div>
          </div>

          {/* Notes and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Notes</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-sidebar mt-1">•</span>
                  <span>
                    The staffing needs for your building are low, as your building has
                    a 12-hour concierge, but no leisure staff or on-site team.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sidebar mt-1">•</span>
                  <span>
                    Your budget for staff service charge aligns with the requirements
                    of your building.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sidebar mt-1">•</span>
                  <span>
                    The budget may be impacted by staff employment costs if staff are
                    paid above market wages, agency staff are used regularly or VAT
                    is due.
                  </span>
                </li>
              </ul>
            </div>

            {/* Recommendation Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Recommendation
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  To reduce the impact of staff employment on your service charge the
                  following actions could be considered:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    Reduce reliance on temporary agency staff as they are more
                    expensive.
                  </li>
                  <li>
                    Freeholder directly employs staff so VAT is not due. This is not
                    always possible.
                  </li>
                  <li>Improve efficiency streamlining roles.</li>
                  <li>
                    Reduce reliance on overtime by improving shift planning.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryItem = ({ name }) => (
  <div className="px-4 py-2 bg-white rounded-lg text-sm text-gray-900 font-medium">
    {name}
  </div>
);

export default MarketComparison;
