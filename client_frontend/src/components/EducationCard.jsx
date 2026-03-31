import { useState } from "react";
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const EducationCard = ({ article }) => {
  const { title, summary, keyPoints, category, icon: Icon, readTime, link } = article;
  const CardIcon = Icon || BookOpen;
  const [expanded, setExpanded] = useState(false);
  const hasKeyPoints = keyPoints && keyPoints.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Card Header */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-sidebar/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <CardIcon className="w-5 h-5 text-sidebar" />
          </div>
          {category && (
            <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full whitespace-nowrap">
              {category}
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug">
          {title}
        </h3>

        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          {summary}
        </p>

        {/* Key Points — expandable */}
        {hasKeyPoints && (
          <div className="mt-auto">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-sidebar hover:text-teal-700 transition-colors mb-2"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Hide key points
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Show key points ({keyPoints.length})
                </>
              )}
            </button>

            {expanded && (
              <ul className="space-y-2 mb-3 animate-fadeIn">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sidebar flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-600 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
        {readTime && (
          <span className="text-xs text-gray-400">{readTime} min read</span>
        )}
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-sidebar hover:underline flex items-center gap-1 ml-auto"
          >
            Full Article <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-gray-300 ml-auto">Internal resource</span>
        )}
      </div>
    </div>
  );
};

export default EducationCard;
