import { useState, useEffect, useMemo, useCallback } from "react";
import { Info } from "lucide-react";
import { fetchDashboardData } from "../services/dashboardService";

/* ─── Traffic Light Helpers ───────────────────────────── */

const getTrafficLight = (value) => {
    if (!value || value === "Data unavailable" || value === "Data not available" || value === "N/A") return "gray";
    const v = String(value).trim().toUpperCase();

    if (["GREEN", "G", "TRUE", "YES", "APPROVED", "PASS", "SATISFACTORY", "GOOD"].includes(v)) return "green";
    if (["AMBER", "YELLOW", "A", "Y", "MEDIUM", "CAUTION", "WARNING"].includes(v)) return "amber";
    if (["RED", "R", "FALSE", "NO", "REJECTED", "FAIL", "UNSATISFACTORY", "BAD"].includes(v)) return "red";

    if (["VERY LOW", "LOW"].includes(v)) return "green";
    if (["HIGH", "VERY HIGH"].includes(v)) return "red";

    return "gray";
};

const TRAFFIC = {
    green: { bg: "#22C55E", bgLight: "bg-green-50",  ring: "ring-green-100",  text: "text-green-700", border: "border-green-200" },
    amber: { bg: "#F59E0B", bgLight: "bg-amber-50",  ring: "ring-amber-100",  text: "text-amber-700", border: "border-amber-200" },
    red:   { bg: "#EF4444", bgLight: "bg-red-50",    ring: "ring-red-100",    text: "text-red-700",   border: "border-red-200" },
    gray:  { bg: "#D1D5DB", bgLight: "bg-gray-50",   ring: "ring-gray-100",   text: "text-gray-500",  border: "border-gray-200" },
};

const tabMapping = {
    0: { notesKey: '6"06', budgetLevelKey: '6"07', buildingRequirementKey: '6"08', ratingKey: '6"09' },
    1: { notesKey: '6"10', budgetLevelKey: '6"11', buildingRequirementKey: '6"12', ratingKey: '6"13' },
    2: { notesKey: '6"14', budgetLevelKey: '6"15', buildingRequirementKey: '6"16', ratingKey: '6"17' },
    3: { notesKey: '6"18', budgetLevelKey: '6"19', buildingRequirementKey: '6"20', ratingKey: '6"21' },
    4: { notesKey: '6"22', budgetLevelKey: '6"23', buildingRequirementKey: '6"24', ratingKey: '6"25' },
    5: { notesKey: '6"26', budgetLevelKey: '6"27', buildingRequirementKey: '6"28', ratingKey: '6"29' },
    6: { notesKey: '6"30', budgetLevelKey: '6"31', buildingRequirementKey: '6"32', ratingKey: '6"33' },
};

const parseNotesAndRecs = (text) => {
    if (!text || text === "Data not available" || text === "Data unavailable") {
        return { notes: [], recommendations: [] };
    }
    const headerRegex = /(?:^|[\r\n]+|[.!?]\s+)(Recc?ommendations?)\s*:?\s*/i;
    const match = text.match(headerRegex);

    let notesText = text;
    let recsText = "";
    if (match) {
        let splitIdx = match.index;
        if (/[.!?]/.test(match[0][0])) splitIdx += 1;
        notesText = text.substring(0, splitIdx).trim();
        recsText = text.substring(match.index + match[0].length).trim();
    }

    const splitItems = (str) => {
        if (!str) return [];
        let items = str
            .split(/[\r\n]+/)
            .map((s) => s.replace(/^[\s]*[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
            .filter((s) => s.length > 0);
        if (items.length === 1 && items[0].length > 150) {
            items = items[0]
                .split(/(?<=[.!?])\s+(?=[A-Z])/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
        }
        return items;
    };

    return { notes: splitItems(notesText), recommendations: splitItems(recsText) };
};

const TABS = [
    "Staff",
    "Contracts & Services",
    "Compliance",
    "Professional Fees",
    "Insurance",
    "Utilities",
    "Reserve Fund",
];

const INFO_TEXTS = {
    budgetLevel: "How the current budget allocation compares to similar properties and benchmarks.",
    buildingRequirement: "The level of maintenance and service investment the building currently needs.",
    rating: "Overall expert assessment for this service category based on budget level and building requirement.",
    notes: "Expert observations and analysis for this service category.",
    recommendations: "Suggested actions and improvements from our expert review.",
};

const MyExpert = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [expertData, setExpertData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchDashboardData();
                if (response.data) setExpertData(response.data);
            } catch (error) {
                console.error("Error loading expert data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getData = useCallback(
        (key) => {
            if (!key || !expertData) return "Data not available";
            return (
                expertData[key] ||
                expertData[key.replace('"', "\u201C")] ||
                expertData[key.replace('"', "\u201D")] ||
                "Data unavailable"
            );
        },
        [expertData]
    );

    const currentData = useMemo(() => {
        const mapping = tabMapping[activeTab];
        if (!mapping)
            return {
                notes: [],
                recommendations: [],
                budgetLevel: { value: "N/A", color: "gray" },
                buildingRequirement: { value: "N/A", color: "gray" },
                rating: { value: "N/A", color: "gray" },
            };

        const { notes, recommendations } = parseNotesAndRecs(getData(mapping.notesKey));
        const blVal = getData(mapping.budgetLevelKey);
        const brVal = getData(mapping.buildingRequirementKey);
        const rtVal = getData(mapping.ratingKey);

        return {
            notes,
            recommendations,
            budgetLevel: { value: blVal, color: getTrafficLight(blVal) },
            buildingRequirement: { value: brVal, color: getTrafficLight(brVal) },
            rating: { value: rtVal, color: getTrafficLight(rtVal) },
        };
    }, [activeTab, getData]);

    const handleRatingSystemClick = useCallback(() => {
        const link = getData('6"02');
        if (link && link !== "Data not available") window.open(link, "_blank");
    }, [getData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-gray-600">Loading expert analysis...</div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen p-6 font-inter space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-start gap-4">
                <h1 className="text-2xl font-semibold text-gray-900">My Expert</h1>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gray-200 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{getData('6"01')}</span>
                    </div>
                    <button
                        onClick={handleRatingSystemClick}
                        className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        SCUK Rating System
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1.5">
                {TABS.map((tab, i) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(i)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            i === activeTab
                                ? "bg-white text-sidebar shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Ratings Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <TrafficLightCard
                    title="Budget Level"
                    value={currentData.budgetLevel.value}
                    color={currentData.budgetLevel.color}
                    info={INFO_TEXTS.budgetLevel}
                />
                <TrafficLightCard
                    title="Building Requirement"
                    value={currentData.buildingRequirement.value}
                    color={currentData.buildingRequirement.color}
                    info={INFO_TEXTS.buildingRequirement}
                />
                <div className="md:col-span-2">
                    <TrafficLightCard
                        title="Rating"
                        value={currentData.rating.value}
                        color={currentData.rating.color}
                        large
                        info={INFO_TEXTS.rating}
                    />
                </div>
            </div>

            {/* Notes & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-1.5 mb-3">
                        <h3 className="font-semibold text-gray-900">Notes</h3>
                        <InfoTooltip text={INFO_TEXTS.notes} />
                    </div>
                    {currentData.notes.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                            {currentData.notes.map((note, i) => (
                                <li key={i}>{note}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No notes available.</p>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-1.5 mb-3">
                        <h3 className="font-semibold text-gray-900">Recommendations</h3>
                        <InfoTooltip text={INFO_TEXTS.recommendations} />
                    </div>
                    {currentData.recommendations.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                            {currentData.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No recommendations.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const TrafficLightCard = ({ title, value, color, large, info }) => {
    const c = TRAFFIC[color] || TRAFFIC.gray;
    const displayVal =
        value && value !== "Data unavailable" && value !== "Data not available" ? value : "N/A";

    const circleSize = large ? 80 : 48;

    return (
        <div
            className={`rounded-xl border border-gray-200 flex flex-col items-center justify-center transition-colors
                ${large ? "py-7 px-6 " + c.bgLight : "py-5 px-4 bg-white"}`}
        >
            <div className="flex items-center gap-1.5 mb-4">
                <h3 className={`font-semibold text-gray-900 ${large ? "text-base" : "text-sm"}`}>
                    {title}
                </h3>
                {info && <InfoTooltip text={info} />}
            </div>

            <div
                className="rounded-full mb-3 relative"
                style={{
                    width: circleSize,
                    height: circleSize,
                    background: `radial-gradient(circle at 38% 35%, ${c.bg}cc, ${c.bg})`,
                    boxShadow: `0 0 0 4px ${c.bg}20, 0 4px 12px ${c.bg}30`,
                }}
            >
                <div
                    className="absolute rounded-full"
                    style={{
                        width: circleSize * 0.35,
                        height: circleSize * 0.25,
                        top: "18%",
                        left: "22%",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)",
                        borderRadius: "50%",
                    }}
                />
            </div>

            <p className={`font-semibold ${c.text} ${large ? "text-base" : "text-sm"}`}>
                {displayVal}
            </p>
        </div>
    );
};

/* ─── Info Tooltip ─────────────────────────────────────── */

const InfoTooltip = ({ text }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative inline-flex">
            <button
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                onClick={() => setShow((p) => !p)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <Info className="w-3.5 h-3.5" />
            </button>
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-lg z-50 pointer-events-none">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
};

export default MyExpert;
