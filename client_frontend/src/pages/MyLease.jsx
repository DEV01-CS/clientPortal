import { ChevronDown, ChevronRight, FileText, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { fetchDashboardData } from "../services/dashboardService";
import { fetchDocuments, downloadDocument } from "../services/documentService";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SECTIONS = [
  { title: "Property Demise", start: 2, end: 4 },
  { title: "Service Charge Recoverable", start: 5, end: 16 },
  { title: "Health & Safety Recoverable", start: 17, end: 26 },
  { title: "Non-Recoverables", start: 27, end: 34 },
  { title: "Sweeper Clauses", start: 35, end: 38 },
];

const MyLease = () => {
  const [openSection, setOpenSection] = useState(null);
  const [leaseData, setLeaseData] = useState({});
  const [loading, setLoading] = useState(true);

  const [leaseDocs, setLeaseDocs] = useState([]);
  const [selectedDocIdx, setSelectedDocIdx] = useState(0);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [containerWidth, setContainerWidth] = useState(null);

  const pageRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchDashboardData();
        if (response.data) setLeaseData(response.data);
      } catch (error) {
        console.error("Error loading lease data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadLeaseDocs = async () => {
      try {
        const docsResponse = await fetchDocuments();
        const documents = docsResponse.documents || [];
        const leases = documents.filter(
          (doc) => doc.type?.toLowerCase() === "lease" && doc.drive_file?.id
        );
        setLeaseDocs(leases);

        if (leases.length === 0) {
          setPdfError("No lease document uploaded yet");
          setPdfLoading(false);
        }
      } catch (error) {
        console.error("Error loading documents:", error);
        setPdfError("Failed to load documents");
        setPdfLoading(false);
      }
    };
    loadLeaseDocs();
  }, []);

  useEffect(() => {
    if (leaseDocs.length === 0) return;
    const doc = leaseDocs[selectedDocIdx];
    if (!doc) return;

    let cancelled = false;
    const loadPdf = async () => {
      setPdfLoading(true);
      setPdfError(null);
      setPdfBlob(null);
      setNumPages(null);
      pageRefs.current = {};

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      try {
        const blob = await downloadDocument(doc.drive_file.id);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setPdfBlob(url);
      } catch (error) {
        if (cancelled) return;
        console.error("Error loading lease PDF:", error);
        setPdfError("Failed to load lease document");
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    };
    loadPdf();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [leaseDocs, selectedDocIdx]);

  useEffect(() => {
    const el = pdfContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setContainerWidth(w - 16);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getData = useCallback(
    (key) => {
      if (!leaseData) return "Loading...";
      return (
        leaseData[key] ||
        leaseData[key.replace('"', "\u201C")] ||
        leaseData[key.replace('"', "\u201D")] ||
        "Data not available"
      );
    },
    [leaseData]
  );

  const extractPageRef = useCallback((text) => {
    if (!text || text === "Data not available") return null;
    const match = text.match(/(?:page|pg\.?|p\.?)\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }, []);

  const getSectionPageRef = useCallback(
    (start, end) => {
      for (let i = start; i <= end; i++) {
        const key = `5"${i.toString().padStart(2, "0")}`;
        const text = getData(key);
        const pageRef = extractPageRef(text);
        if (pageRef) return pageRef;
      }
      return null;
    },
    [getData, extractPageRef]
  );

  const scrollToPage = useCallback((pageNum) => {
    const el = pageRefs.current[pageNum];
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleSectionClick = useCallback(
    (sectionIdx, start, end) => {
      const isOpening = openSection !== sectionIdx;
      setOpenSection((prev) => (prev === sectionIdx ? null : sectionIdx));
      if (isOpening) {
        const pageRef = getSectionPageRef(start, end);
        if (pageRef) setTimeout(() => scrollToPage(pageRef), 150);
      }
    },
    [openSection, getSectionPageRef, scrollToPage]
  );

  const renderLeaseRange = useCallback(
    (start, end) => {
      const items = [];
      for (let i = start; i <= end; i++) {
        const key = `5"${i.toString().padStart(2, "0")}`;
        const text = getData(key);
        if (text && text !== "Data not available" && text !== "") {
          items.push(
            <li key={key} className="mb-2">
              {text}
            </li>
          );
        }
      }
      return items.length > 0 ? (
        <ul className="list-disc ml-5 text-sm text-gray-700">{items}</ul>
      ) : (
        <p className="text-sm text-gray-500">Data not available</p>
      );
    },
    [getData]
  );

  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
  }, []);

  const pages = useMemo(() => {
    if (!numPages) return null;
    return Array.from({ length: numPages }, (_, i) => i + 1);
  }, [numPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-600">Loading lease data...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6 font-inter">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Lease</h1>
        {leaseDocs.length > 1 && (
          <select
            value={selectedDocIdx}
            onChange={(e) => setSelectedDocIdx(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
          >
            {leaseDocs.map((doc, idx) => (
              <option key={idx} value={idx}>
                {doc.name || doc.drive_file?.name || `Lease ${idx + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL - Lease Clauses */}
        <div className="bg-gray-200 rounded-lg p-4 space-y-2">
          {SECTIONS.map((section, idx) => (
            <Accordion
              key={idx}
              title={section.title}
              isOpen={openSection === idx}
              onClick={() =>
                handleSectionClick(idx, section.start, section.end)
              }
            >
              {renderLeaseRange(section.start, section.end)}
            </Accordion>
          ))}
        </div>

        {/* RIGHT PANEL - Lease Document Viewer */}
        <div
          ref={(el) => {
            scrollContainerRef.current = el;
            pdfContainerRef.current = el;
          }}
          className="bg-white rounded-lg shadow-sm overflow-y-auto h-[75vh]"
        >
          {pdfLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-sidebar rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Loading lease document...
                </p>
              </div>
            </div>
          ) : pdfError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{pdfError}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Upload a lease document from the Documents page to view it
                  here.
                </p>
              </div>
            </div>
          ) : pdfBlob ? (
            <Document
              file={pdfBlob}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-sidebar rounded-full animate-spin" />
                </div>
              }
              error={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-6">
                    <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                    <p className="text-sm text-red-500">
                      Failed to render lease document
                    </p>
                  </div>
                </div>
              }
            >
              {pages?.map((pageNum) => (
                <div
                  key={pageNum}
                  ref={(el) => {
                    pageRefs.current[pageNum] = el;
                  }}
                  className="mb-1"
                >
                  <Page
                    pageNumber={pageNum}
                    width={containerWidth || 500}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                  <div className="text-center text-xs text-gray-400 py-1 border-b border-gray-100">
                    Page {pageNum} of {numPages}
                  </div>
                </div>
              ))}
            </Document>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* ---------------- COMPONENTS ---------------- */

const Accordion = ({ title, children, isOpen, onClick }) => (
  <div className="bg-gray-100 rounded-lg">
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg text-gray-900"
    >
      {title}
      {isOpen ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>

    {isOpen && children && <div className="px-4 pb-4">{children}</div>}
  </div>
);

export default MyLease;
