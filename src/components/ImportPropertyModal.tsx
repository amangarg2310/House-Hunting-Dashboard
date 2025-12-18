import React, { useState } from 'react';
import { XIcon, UploadIcon, AlertCircleIcon, CheckCircleIcon, LoaderIcon } from 'lucide-react';

interface ImportPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  entry: string;
  address?: string;
  error?: string;
}

export function ImportPropertyModal({ isOpen, onClose, onSuccess }: ImportPropertyModalProps) {
  const [inputText, setInputText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    // Parse input - split by newlines and filter empty lines
    const entries = inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (entries.length === 0) {
      return;
    }

    setIsImporting(true);
    setShowResults(false);

    try {
      const response = await fetch('/api/import-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setShowResults(true);

        // If any imports succeeded, trigger refresh
        if (data.successCount > 0) {
          onSuccess();
        }
      } else {
        setResults([{
          success: false,
          entry: 'Import failed',
          error: data.error || 'Unknown error'
        }]);
        setShowResults(true);
      }
    } catch (error: any) {
      setResults([{
        success: false,
        entry: 'Network error',
        error: error.message
      }]);
      setShowResults(true);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setResults([]);
    setShowResults(false);
    onClose();
  };

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UploadIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Import Properties</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showResults ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Paste Zillow URLs or property addresses (one per line):
                </p>
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <div>• Zillow URLs: https://www.zillow.com/homedetails/...</div>
                  <div>• Addresses: 805 Creekside Trail, Alpharetta, GA 30004</div>
                  <div>• Paste from Excel: Copy addresses/URLs and paste here</div>
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="https://www.zillow.com/homedetails/...&#10;805 Creekside Trail, Alpharetta, GA 30004&#10;..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                disabled={isImporting}
              />

              <div className="mt-4 text-sm text-gray-500">
                {inputText.split('\n').filter(line => line.trim().length > 0).length} entries ready to import
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Import Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total</div>
                    <div className="text-lg font-bold text-gray-900">{results.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Success</div>
                    <div className="text-lg font-bold text-green-600">{successCount}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Failed</div>
                    <div className="text-lg font-bold text-red-600">{failureCount}</div>
                  </div>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {result.address || result.entry}
                        </div>
                        {result.error && (
                          <div className="text-xs text-red-600 mt-1">{result.error}</div>
                        )}
                        {result.success && result.entry !== result.address && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            From: {result.entry}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          {!showResults ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || inputText.trim().length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    Import Properties
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
