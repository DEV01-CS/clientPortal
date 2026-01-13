import { useState } from "react";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import {
  testGoogleSheetsConnection,
  testGoogleDriveConnection,
} from "../services/sheetsService";

const TestConnection = () => {
  const [sheetsStatus, setSheetsStatus] = useState(null);
  const [driveStatus, setDriveStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const testSheets = async () => {
    setLoading(true);
    setSheetsStatus(null);
    try {
      const result = await testGoogleSheetsConnection();
      setSheetsStatus({ success: true, data: result });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sheets connection error:', error);
      }
      let errorMessage = error.message || 'Unknown error';
      
      // Better error handling
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please login and connect your Google account.';
        } else if (error.response.data) {
          errorMessage = error.response.data.error || error.response.data.message || errorMessage;
        }
      }
      
      setSheetsStatus({ success: false, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const testDrive = async () => {
    setLoading(true);
    setDriveStatus(null);
    try {
      const result = await testGoogleDriveConnection();
      setDriveStatus({ success: true, data: result });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Drive connection error:', error);
      }
      let errorMessage = error.message || 'Unknown error';
      
      // Better error handling
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please login and connect your Google account.';
        } else if (error.response.data) {
          errorMessage = error.response.data.error || error.response.data.message || errorMessage;
        }
      }
      
      setDriveStatus({ success: false, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen p-6 font-inter">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Test Google Sheets & Drive OAuth Connection
      </h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This test requires you to be logged in and have your Google account connected via OAuth. 
          Visit the <strong>My Account</strong> page to connect your Google account if you haven't already.
        </p>
      </div>

      <div className="space-y-6">
        {/* Google Sheets Test */}
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Google Sheets Connection
            </h2>
            <button
              onClick={testSheets}
              disabled={loading}
              className="px-4 py-2 bg-sidebar text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Testing...
                </span>
              ) : (
                "Test Connection"
              )}
            </button>
          </div>

          {sheetsStatus && (
            <div
              className={`p-4 rounded-lg ${
                sheetsStatus.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {sheetsStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      sheetsStatus.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {sheetsStatus.success
                      ? "Connection Successful!"
                      : "Connection Failed"}
                  </p>
                  {sheetsStatus.success ? (
                    <div className="mt-2 text-sm text-gray-700">
                      <p>
                        <strong>Spreadsheet:</strong>{" "}
                        {sheetsStatus.data.spreadsheet_title}
                      </p>
                      <p>
                        <strong>Sheet ID:</strong> {sheetsStatus.data.sheet_id}
                      </p>
                      {sheetsStatus.data.headers && (
                        <div className="mt-2">
                          <strong>Headers:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {sheetsStatus.data.headers.map((header, idx) => (
                              <li key={idx}>{header}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-red-700">
                      {sheetsStatus.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google Drive Test */}
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Google Drive Connection
            </h2>
            <button
              onClick={testDrive}
              disabled={loading}
              className="px-4 py-2 bg-sidebar text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Testing...
                </span>
              ) : (
                "Test Connection"
              )}
            </button>
          </div>

          {driveStatus && (
            <div
              className={`p-4 rounded-lg ${
                driveStatus.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {driveStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      driveStatus.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {driveStatus.success
                      ? "Connection Successful!"
                      : "Connection Failed"}
                  </p>
                  {driveStatus.success ? (
                    <div className="mt-2 text-sm text-gray-700">
                      <p>
                        <strong>Files Found:</strong>{" "}
                        {driveStatus.data.files_count}
                      </p>
                      {driveStatus.data.sample_files &&
                        driveStatus.data.sample_files.length > 0 && (
                          <div className="mt-2">
                            <strong>Sample Files:</strong>
                            <ul className="list-disc list-inside ml-2">
                              {driveStatus.data.sample_files.map((file, idx) => (
                                <li key={idx}>{file.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-red-700">
                      {driveStatus.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestConnection;

