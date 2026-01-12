import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

const MyExpert = () => {
    const tabs = [
        "Staff",
        "Contracts & Services",
        "Compliance",
        "Professional Fees",
        "Insurance",
        "Utilities",
        "Reserve Fund",
    ];

    const [activeTab, setActiveTab] = useState(0);

    // Data for each tab
    const tabData = {
        0: {
            // Staff
            budgetRating: { value: "Low", activeIndex: 1 },
            buildingRequirement: { value: "Low", activeIndex: 1 },
            approved: true,
            notes: [
                "The staffing needs for your building are low, as your building has a 12-hour concierge, but no leisure staff or on-site team.",
                "Your budget for staff service charge aligns with the requirements of your building.",
                "The budget may be impacted by staff employment costs if staff are paid above market wages, agency staff are used regularly or VAT is due.",
            ],
            recommendations: [
                "To reduce the impact of staff employment on your service charge the following actions could be considered:",
                "Reduce reliance on temporary agency staff.",
                "Freeholder directly employs staff so VAT is not due. This is not always possible.",
                "Improve efficiency streamlining roles.",
                "Reduce reliance on overtime by improving shift planning.",
            ],
        },
        1: {
            // Contracts & Services
            budgetRating: { value: "Medium", activeIndex: 2 },
            buildingRequirement: { value: "Medium", activeIndex: 2 },
            approved: true,
            notes: [
                "The contracts and maintenance needs for your building are average, as your building has a communal heating system, but no lift or complex leisure facilities.",
                "Your budget for contracts & maintenance service charges aligns with the requirements of your building.",                
                "The budget will be impacted by the age of the equipment as your building is more than 30 years out and majority of plant equipment has a lifespan of 20 to 25 years. The older the equipment the higher the requirement for reactive maintenance. Also, over-frequent cleaning or ground works, legacy contracts that have not been retender or the overuse of emergency call outs will have a negative impact on expenditure.",
            ],
            recommendations: [
                "To reduce the impact of contracts and maintenance on your service charge the following actions could be considered:",
                " Reduce or eliminate non-essential contracts. For example, reduce window cleaning from four times a year to twice.",
                " Retender existing contracts to ensure they are offering a good quality service for a competitive price.",
                " Ensure all equipment and plant is replaced at the end of its lifespan to retain efficiency and reduce reactive maintenance and repairs expenditure.",
                " Ensure all planned maintenance is completed by a qualified contractor and well documented.",
            ],
        },
        2: {
            // Compliance
            budgetRating: { value: "High", activeIndex: 3 },
            buildingRequirement: { value: "Medium", activeIndex: 2 },
            approved: false,
            notes: [
                "Compliance costs are high due to regulatory requirements and safety standards.",
                "Your building meets medium-level requirements for compliance standards.",
                "Regular compliance audits are essential to maintain standards and avoid penalties.",
            ],
            recommendations: [
                "To manage compliance costs effectively:",
                "Schedule regular compliance audits to identify issues early.",
                "Maintain detailed records to streamline audit processes.",
                "Invest in training for staff on compliance requirements.",
                "Consider compliance software to track and manage requirements efficiently.",
            ],
        },
        3: {
            // Professional Fees
            budgetRating: { value: "Low", activeIndex: 1 },
            buildingRequirement: { value: "Low", activeIndex: 1 },
            approved: true,
            notes: [
                "Professional fees are currently at a low level.",
                "Regular review of professional service providers is recommended.",
            ],
            recommendations: [
                "To maintain cost-effective professional services:",
                "Compare quotes from multiple service providers.",
                "Review service agreements annually.",
            ],
        },
        4: {
            // Insurance
            budgetRating: { value: "Medium", activeIndex: 2 },
            buildingRequirement: { value: "Medium", activeIndex: 2 },
            approved: true,
            notes: [
                "Insurance costs are at a medium level.",
                "Regular review of insurance coverage is essential.",
            ],
            recommendations: [
                "To optimize insurance costs:",
                "Review insurance policies annually.",
                "Compare quotes from multiple insurers.",
            ],
        },
        5: {
            // Utilities
            budgetRating: { value: "Low", activeIndex: 1 },
            buildingRequirement: { value: "Low", activeIndex: 1 },
            approved: true,
            notes: [
                "Utility costs are well managed.",
                "Energy efficiency measures are in place.",
            ],
            recommendations: [
                "To further reduce utility costs:",
                "Implement energy-saving measures.",
                "Monitor usage patterns regularly.",
            ],
        },
        6: {
            // Reserve Fund
            budgetRating: { value: "Medium", activeIndex: 2 },
            buildingRequirement: { value: "Medium", activeIndex: 2 },
            approved: false,
            notes: [
                "Reserve fund is at an appropriate level.",
                "Regular contributions are essential for future maintenance.",
            ],
            recommendations: [
                "To maintain adequate reserve fund:",
                "Ensure regular contributions are made.",
                "Review fund requirements annually.",
            ],
        },
    };

    const currentData = tabData[activeTab];

    return (
        <div className="bg-white min-h-screen p-6 font-inter">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-start gap-4 mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">My Expert</h1>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">
                            Wandsworth, SW18
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>

                    <button className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium">
                        SCUK Rating System
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-2">
                {tabs.map((tab, i) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(i)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === activeTab
                                ? "bg-gray-200 text-sidebar shadow"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Top Section */}
            <div className="bg-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-2 px-4 rounded-lg">
                {/* Ratings */}
                <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm space-y-10">
                    <RatingBlock
                        title="Budget Rating"
                        value={currentData.budgetRating.value}
                        activeIndex={currentData.budgetRating.activeIndex}
                    />
                    <RatingBlock
                        title="Building Requirement"
                        value={currentData.buildingRequirement.value}
                        activeIndex={currentData.buildingRequirement.activeIndex}
                    />
                </div>

                {/* Approval */}
                <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center">
                    <h3 className="font-semibold mb-4 text-gray-900">Approval</h3>
                    {currentData.approved ? (
                        <div className="w-28 h-28 bg-green-500/10 rounded-full flex items-center justify-center">
                            <svg
                                className="w-20 h-20 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                viewBox="0 0 24 24"
                            >
                                <path d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-28 h-28 bg-red-500/10 rounded-full flex items-center justify-center">
                            <X className="w-20 h-20 text-red-500" strokeWidth={3} />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="bg-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-lg">
                {/* Notes */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold mb-3 text-gray-900">Notes</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                        {currentData.notes.map((note, index) => (
                            <li key={index}>{note}</li>
                        ))}
                    </ul>
                </div>

                {/* Recommendation */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold mb-3 text-gray-900">
                        Recommendation
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                        {currentData.recommendations[0]}
                    </p>
                    <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
                        {currentData.recommendations.slice(1).map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
};

/* ---------------- COMPONENTS ---------------- */

const RatingBlock = ({ title, value, activeIndex }) => {
    const labels = ["VERY LOW", "LOW", "MEDIUM", "HIGH", "VERY HIGH"];
    const colors = [
        "bg-green-500",
        "bg-teal-400",
        "bg-yellow-400",
        "bg-orange-400",
        "bg-red-500",
    ];

    return (
        <div>
            <h3 className="font-semibold text-gray-900 mb-4">
                {title}: <span className="text-teal-500">{value}</span>
            </h3>

            <div className="relative">
                {/* Points Container */}
                <div className="flex justify-between items-start relative">
                    {labels.map((label, i) => (
                        <div key={label} className="flex flex-col items-center relative z-10">
                            {/* Dot */}
                            <div className={`w-4 h-4 rounded-full ${colors[i]} relative z-10`} />

                            {/* Active Arrow */}
                            {i === activeIndex && (
                                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-black mt-1" />
                            )}

                            {/* Label */}
                            <span className="text-xs mt-2 text-gray-700">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Line - positioned to pass through center of dots (8px from top for w-4 h-4 dot center) */}
                <div className="absolute top-2 left-0 w-full h-[2px] bg-black z-0" />
            </div>
        </div>
    );
};

export default MyExpert;
