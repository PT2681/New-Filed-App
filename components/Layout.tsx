import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { TourStartModal } from './TourStartModal';
import { RoutePath, Tour } from '../types';
import { MOCK_TOURS, MOCK_PROJECTS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  
  // Define routes where navigation bars should be hidden
  const hideNavRoutes = [RoutePath.LOGIN, RoutePath.FORGOT_PASSWORD];
  const shouldHideNav = hideNavRoutes.includes(location.pathname as RoutePath);

  // Template for new ad-hoc tour
  const AD_HOC_TOUR_TEMPLATE: Tour = {
    id: '', // Will be generated on save
    projectId: '',
    projectName: 'Ad-hoc Visit',
    taskName: '', 
    fromLocation: 'Current Location',
    toLocation: '',
    toCoordinates: { lat: 0, lng: 0 },
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'Upcoming'
  };

  const handleTourStartSuccess = (tourData: Partial<Tour>) => {
    // 1. Get existing tours
    const saved = localStorage.getItem('tours_data');
    const existingTours: Tour[] = saved ? JSON.parse(saved) : MOCK_TOURS;

    // 2. Resolve project name
    const project = MOCK_PROJECTS.find(p => p.id === tourData.projectId);

    // 3. Create new tour object
    const newTourId = `TR-${Date.now().toString().slice(-6)}`;
    const newTour: Tour = {
      ...AD_HOC_TOUR_TEMPLATE,
      ...tourData,
      id: newTourId,
      projectName: project ? project.name : (tourData.projectName || 'Ad-hoc Visit')
    };

    // 4. Save
    const updatedTours = [newTour, ...existingTours];
    localStorage.setItem('tours_data', JSON.stringify(updatedTours));

    // 5. Close and Navigate
    setIsTourModalOpen(false);
    navigate(RoutePath.ACTIVE_TOUR.replace(':id', newTourId));
  };

  if (shouldHideNav) {
    return (
      <main className="h-screen w-full bg-surface overflow-y-auto no-scrollbar">
        {children}
      </main>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50">
      <Navbar />
      
      {/* 
        Main content area. 
        'flex-1' takes remaining height. 
        'overflow-y-auto' allows scrolling within this area.
        'pb-20' adds padding at bottom so content isn't hidden behind BottomNav.
      */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 max-w-3xl mx-auto w-full no-scrollbar">
        {children}
      </main>

      <BottomNav onStartTour={() => setIsTourModalOpen(true)} />

      <TourStartModal 
        isOpen={isTourModalOpen}
        tour={AD_HOC_TOUR_TEMPLATE}
        onClose={() => setIsTourModalOpen(false)}
        onSuccess={handleTourStartSuccess}
      />
    </div>
  );
};