import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { fetchDashboardData } from "../services/dashboardService";

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
    const [expertData, setExpertData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchDashboardData();
                if (response.data) {
                    setExpertData(response.data);
                }
            } catch (error) {
                console.error("Error loading expert data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getData = (key) => {
        if (!key || !expertData) return "Data not available";
        return expertData[key] || expertData[key.replace('"', '”')] || expertData[key.replace('”', '"')] || "Data unavailable";
    };

    const getRatingData = (ratingValue) => {
        if (!ratingValue || ratingValue === "Data unavailable") {
            return { value: "N/A", activeIndex: -1 };
        }
        const value = ratingValue.trim();
        const labels = ["VERY LOW", "LOW", "MEDIUM", "HIGH", "VERY HIGH"];
        const activeIndex = labels.findIndex(l => l === value.toUpperCase());
        return { value, activeIndex };
    };

    const parseNotesAndRecs = (text) => {
        if (!text || text === 'Data not available') {
            return { notes: [], recommendations: [] };
        }

        // Find "Recommendations" header (case-insensitive, optional colon)
        // Looks for pattern preceded by start-of-line, newline, or dot-space
        const headerRegex = /(?:^|[\r\n]+|\.\s+)(Recc?ommendations?)(?:\s*:)?(?:\s|$)/i;
        const match = text.match(headerRegex);

        let notesText = text;
        let recsText = '';
        if (match) {
            let splitIdx = match.index;
            // If match starts with dot, include it in notes
            if (match[0].trim().startsWith('.')) {
                splitIdx += 1;
            }
            notesText = text.substring(0, splitIdx).trim();
            recsText = text.substring(match.index + match[0].length).trim();
        }

        // Split by newline or dot followed by space to get list items
        const splitItems = (str) => str.split(/(?:[\r\n]+|\.\s+)/).map(s => s.trim()).filter(s => s.length > 0);

        const notes = splitItems(notesText);
        const recommendations = splitItems(recsText);
        return { notes, recommendations };
    };

    const tabMapping = {
        0: { notesKey: '5"06', budgetRatingKey: '5"07', buildingRequirementKey: '5"08', approvedKey: '5"09' },
        1: { notesKey: '5"10', budgetRatingKey: '5"11', buildingRequirementKey: '5"12', approvedKey: '5"13' },
        2: { notesKey: '5"14', budgetRatingKey: '5"15', buildingRequirementKey: '5"16', approvedKey: '5"17' },
        3: { notesKey: '5"18', budgetRatingKey: '5"19', buildingRequirementKey: '5"20', approvedKey: '5"21' },
        4: { notesKey: '5"22', budgetRatingKey: '5"23', buildingRequirementKey: '5"24', approvedKey: '5"25' },
        5: { notesKey: '5"26', budgetRatingKey: '5"27', buildingRequirementKey: '5"28', approvedKey: '5"29' },
        6: { notesKey: '5"30', budgetRatingKey: '5"31', buildingRequirementKey: '5"32', approvedKey: '5"33' },
    };

    const getTabData = (tabIndex) => {
        const mapping = tabMapping[tabIndex];
        if (!mapping) return { notes: [], recommendations: [], budgetRating: { value: 'N/A', activeIndex: -1 }, buildingRequirement: { value: 'N/A', activeIndex: -1 }, approved: false, approvedValue: "N/A" };

        const { notes, recommendations } = parseNotesAndRecs(getData(mapping.notesKey));
        const budgetRating = getRatingData(getData(mapping.budgetRatingKey));
        const buildingRequirement = getRatingData(getData(mapping.buildingRequirementKey));
        const approvedValue = getData(mapping.approvedKey);
        const approved = approvedValue && /^(true|yes|approved|pass|Green|satisfactory|Good)$/i.test(String(approvedValue).trim());

        return { notes, recommendations, budgetRating, buildingRequirement, approved, approvedValue };
    };

    const currentData = getTabData(activeTab);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-gray-600">Loading expert analysis...</div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen p-6 font-inter">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-start gap-4 mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">My Expert</h1>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">
                            {getData('5"01') || 'Wandsworth, SW18'}
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            const link = getData('5"02');
                            if (link && link !== "Data not available") window.open(link, '_blank');
                        }}
                        className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium"
                    >
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
                    <h2 className="font-bold mb-2 text-gray-900">Approval</h2>
                    <hr className="w-full border-t border-black mb-8" />
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
        
                        <div className="w-28 h-28 bg-red-300/10 rounded-full flex items-center justify-center">
                            <X className="w-20 h-20 text-red-500" strokeWidth={3} />
                        </div>
                    )}
                    <p className="mt-4 text-md font-semibold text-grey-900 mb-2 ">
                        {currentData.approvedValue && currentData.approvedValue !== "Data not available" ? currentData.approvedValue : ""}
                    </p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="bg-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-lg">
                {/* Notes */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold mb-3 text-gray-900">Notes</h3>
                    {currentData.notes && currentData.notes.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                            {currentData.notes.map((note, index) => (
                                <li key={index}>{note}</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500">No notes available.</p>}
                </div>

                {/* Recommendation */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold mb-3 text-gray-900">
                        Recommendation
                    </h3>
                    {currentData.recommendations && currentData.recommendations.length > 0 ? (
                        <>
                            <p className="text-sm text-gray-700 mb-3">
                                {currentData.recommendations[0]}
                            </p>
                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                                {currentData.recommendations.slice(1).map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                ))}
                            </ul>
                        </>
                    ) : <p className="text-sm text-gray-500">No recommendations</p>}
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
