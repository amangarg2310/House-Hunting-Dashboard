import React from 'react';
import { SparkleIcon, FolderIcon, ArchiveIcon } from 'lucide-react';
export type ViewMode = 'new-today' | 'my-grades' | 'all-properties';
interface ViewTabsProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  newCount: number;
  totalCount: number;
}
export function ViewTabs({
  currentView,
  onViewChange,
  newCount,
  totalCount
}: ViewTabsProps) {
  return <div className="bg-white border-b border-gray-200">
      <div className="px-6">
        <div className="flex gap-1 relative">
          {/* New Today Tab */}
          <button onClick={() => onViewChange('new-today')} className={`relative px-6 py-4 text-sm font-medium transition-colors ${currentView === 'new-today' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <div className="flex items-center gap-2">
              <SparkleIcon className="w-4 h-4" />
              <span>New Today</span>
            </div>
            {currentView === 'new-today' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>

          {/* All Properties Tab */}
          <button onClick={() => onViewChange('all-properties')} className={`relative px-6 py-4 text-sm font-medium transition-colors ${currentView === 'all-properties' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <div className="flex items-center gap-2">
              <ArchiveIcon className="w-4 h-4" />
              <span>All Properties</span>
              <span className="text-xs text-gray-500">({totalCount})</span>
            </div>
            {currentView === 'all-properties' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>

          {/* My Grades Tab */}
          <button onClick={() => onViewChange('my-grades')} className={`relative px-6 py-4 text-sm font-medium transition-colors ${currentView === 'my-grades' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <div className="flex items-center gap-2">
              <FolderIcon className="w-4 h-4" />
              <span>My Grades</span>
            </div>
            {currentView === 'my-grades' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        </div>
      </div>
    </div>;
}