import React, { useState, useEffect } from 'react'
import { Search, FileText } from 'lucide-react'
import DocumentUploadModal from '../components/DocumentUploadModal'
import { fetchDocuments } from '../services/documentService'

const MyDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const response = await fetchDocuments();
            if (response.documents) {
                setDocuments(response.documents);
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error loading documents:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        loadDocuments(); // Reload documents after successful upload
    };

    return (
        <div className="bg-gray-100 min-h-screen p-6 font-inter">
            {/* Page Title */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Documents
                </h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-sidebar text-white px-3 py-2 rounded-md text-sm hover:bg-sidebar/80 transition-colors"
                >
                    + Add Doc
                </button>
            </div>

            {/* Upload Modal */}
            <DocumentUploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
            {/* Filters */}
            <div className="bg-white rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
                    {/* Keywords */}
                    <div>
                        <label className="text-xs text-gray-600 block mb-1">
                            Keywords
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder=""
                                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="text-xs text-gray-600 block mb-1">
                            Type
                        </label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm">
                            <option>All</option>
                        </select>
                    </div>

                    {/* Property */}
                    <div>
                        <label className="text-xs text-gray-600 block mb-1">
                            Property
                        </label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm">
                            <option>All</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="text-xs text-gray-600 block mb-1">
                            Date Range
                        </label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm">
                            <option>All</option>
                        </select>
                    </div>

                    {/* Filters Button */}
                    <div>
                        <button className="w-full bg-sidebar text-white text-sm px-4 py-2 rounded-md flex items-center justify-center gap-2">
                            Filters
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Documents List */}
            {isLoading ? (
                <div className="bg-gray-200 rounded-lg p-6 text-center">
                    <div className="text-gray-500">Loading documents...</div>
                </div>
            ) : documents.length === 0 ? (
                <div className="bg-gray-200 rounded-lg p-6 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No documents found. Upload your first document!</p>
                </div>
            ) : (
                <div className="bg-gray-200 rounded-lg overflow-hidden">
                    {documents.map((doc, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 px-6 py-4 border-b border-gray-400 last:border-b-0 hover:bg-gray-300 transition-colors cursor-pointer"
                            onClick={() => {
                                if (doc.drive_file?.webViewLink) {
                                    window.open(doc.drive_file.webViewLink, '_blank');
                                }
                            }}
                        >
                            {/* Icon */}
                            <div className="w-8 h-8 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-black" />
                            </div>

                            {/* Name */}
                            <div className="flex-1 text-sm font-medium text-gray-900">
                                {doc.name || 'Untitled Document'}
                            </div>

                            {/* Type */}
                            <div className="w-32 text-sm text-gray-700">
                                {doc.type || '-'}
                            </div>

                            {/* Property */}
                            <div className="w-48 text-sm text-gray-700">
                                {doc.property || '-'}
                            </div>

                            {/* Date */}
                            <div className="w-40 text-sm text-gray-600">
                                {doc.date || '-'} {doc.uploaded_by && <span className="text-gray-500">by {doc.uploaded_by}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default MyDocuments