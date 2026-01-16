import { useState } from "react";
import { X, Upload, FileText } from "lucide-react";
import { uploadDocument } from "../services/documentService";
import { useAuth } from "../auth/AuthContext";

const DocumentUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Auto-fill name if empty
      if (!formData.name) {
        setFormData({
          ...formData,
          file: file,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        });
      } else {
        setFormData({ ...formData, file: file });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter a document name");
      return;
    }

    if (!formData.file) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadDocument(
        formData.file,
        formData.name,
        formData.description
      );

      if (response.success) {
        // Show warning if metadata wasn't saved but upload succeeded
        if (response.data?.warning) {
          // Show warning but don't block success
          if (process.env.NODE_ENV === 'development') {
            console.warn(response.data.warning);
          }
        }
        
        // Reset form
        setFormData({
          name: "",
          description: "",
          file: null,
        });
        // Reset file input
        const fileInput = document.getElementById("file-upload");
        if (fileInput) fileInput.value = "";

        // Call success callback
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
        onClose();
      } else {
        setError(response.message || "Upload failed. Please try again.");
      }
    } catch (err) {
      let errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Upload failed. Please try again.";
      
      // Handle specific error cases
      if (err.response?.data?.requires_write_permission) {
        errorMessage = "Document upload requires write permissions. Your Google account currently has read-only access. Please contact your administrator to grant write permissions.";
      } else if (err.response?.data?.requires_reconnect) {
        errorMessage = "OAuth permissions have changed. Please disconnect and reconnect your Google account from the My Account page.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to upload documents. Please ensure your Google account has write access to Google Drive.";
      } else if (err.response?.status === 401) {
        errorMessage = "Please connect your Google account first from the My Account page.";
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFormData({
        name: "",
        description: "",
        file: null,
      });
      setError("");
      const fileInput = document.getElementById("file-upload");
      if (fileInput) fileInput.value = "";
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Document
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Document Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sidebar"
              placeholder="Enter document name"
              required
              disabled={isUploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sidebar resize-none"
              rows="3"
              placeholder="Enter document description (optional)"
              disabled={isUploading}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-sidebar transition-colors">
              <div className="space-y-1 text-center">
                {formData.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-sidebar" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{formData.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(formData.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-sidebar hover:text-teal-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sidebar"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          disabled={isUploading}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
            {formData.file && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, file: null });
                  const fileInput = document.getElementById("file-upload");
                  if (fileInput) fileInput.value = "";
                }}
                disabled={isUploading}
                className="mt-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Remove file
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !formData.file || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-sidebar text-white rounded-md hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;

