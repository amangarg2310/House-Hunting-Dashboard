import React, { useEffect, useState } from 'react';
import { useListings } from './hooks/useListings';
import { DashboardStats } from './components/DashboardStats';
import { FilterSidebar } from './components/FilterSidebar';
import { ViewTabs, ViewMode } from './components/ViewTabs';
import { NewTodayView } from './components/NewTodayView';
import { GradedPropertiesView } from './components/GradedPropertiesView';
import { AllPropertiesView } from './components/AllPropertiesView';
export function App() {
  const {
    listings,
    allListings,
    filters,
    setFilters,
    assignGrade,
    clearFilters,
    compareMode,
    setCompareMode,
    toggleSingleFloor,
    gradedCounts,
    loading,
    error,
    resetAllGrades
  } = useListings();
  const [currentView, setCurrentView] = useState<ViewMode>('new-today');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (selectedListingId) {
        const gradeMap: Record<string, 'A' | 'B' | 'C' | 'D' | 'F'> = {
          '1': 'A',
          '2': 'B',
          '3': 'C',
          '4': 'D',
          '5': 'F'
        };
        const grade = gradeMap[e.key];
        if (grade) {
          assignGrade(selectedListingId, grade);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedListingId, assignGrade]);
  const newCount = allListings.filter(l => {
    if (!l.listedDate) return l.isNew && !l.grade;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const listedDate = new Date(l.listedDate);
    return listedDate >= yesterday && !l.grade;
  }).length;

  const totalCount = allListings.length;

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading properties...</p>
      </div>
    </div>;
  }

  // Show error state
  if (error) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-red-600 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500">Please check your .env configuration and try refreshing the page.</p>
      </div>
    </div>;
  }

  return <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Only in new-today and all-properties */}
      {currentView !== 'my-grades' && <FilterSidebar filters={filters} setFilters={setFilters} onClearFilters={clearFilters} compareMode={compareMode} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats Header - Only in new-today */}
        {currentView === 'new-today' && <DashboardStats listings={listings} allListings={allListings} compareMode={compareMode} onCompareModeChange={setCompareMode} showSingleFloorOnly={filters.showSingleFloorOnly} onToggleSingleFloor={toggleSingleFloor} />}

        {/* View Tabs */}
        <ViewTabs currentView={currentView} onViewChange={setCurrentView} newCount={newCount} totalCount={totalCount} />

        {/* View Content */}
        {currentView === 'new-today' && <NewTodayView listings={listings} onAssignGrade={assignGrade} compareMode={compareMode} />}

        {currentView === 'my-grades' && <GradedPropertiesView listings={listings} onAssignGrade={assignGrade} compareMode={compareMode} onResetAllGrades={resetAllGrades} />}

        {currentView === 'all-properties' && <AllPropertiesView listings={listings} onAssignGrade={assignGrade} compareMode={compareMode} onCompareModeChange={setCompareMode} />}
      </div>
    </div>;
}