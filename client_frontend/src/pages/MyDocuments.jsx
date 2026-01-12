import React from 'react'
import { Search, FileText } from 'lucide-react'

const MyDocuments = () => {
    const documents = Array.from({ length: 9 });
    return (
        <div className="bg-gray-100 min-h-screen p-6 font-inter">
            {/* Page Title */}
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                Documents
            </h1>

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
            <div className="bg-gray-200 rounded-lg overflow-hidden">
                {documents.map((_, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 px-6 py-4 border-b border-gray-400 last:border-b-0"
                    >
                        {/* Icon */}
                        <div className="w-8 h-8 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-black" />
                        </div>

                        {/* Name */}
                        <div className="flex-1 text-sm font-medium text-gray-900">
                            Service Charge Review.pdf
                        </div>

                        {/* Type */}
                        <div className="w-32 text-sm text-gray-700">
                            Review
                        </div>

                        {/* Property */}
                        <div className="w-48 text-sm text-gray-700">
                            Wandsworth, SW18
                        </div>

                        {/* Date */}
                        <div className="w-40 text-sm text-gray-600">
                            6/16/2026 <span className="text-gray-500">by Lucy Clark</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default MyDocuments