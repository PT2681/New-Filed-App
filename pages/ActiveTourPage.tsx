
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Car, Bike, Bus, Building2, Undo2, Flag, HelpCircle } from 'lucide-react';
import { Button } from '../components/FormElements';
import { TourEndModal } from '../components/TourEndModal';
import { Tour, RoutePath, TourPhase, Site } from '../types';

export const ActiveTourPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<TourPhase>('OUTWARD');

  useEffect(() => {
    const savedTours = localStorage.getItem('tours_data');
    if (savedTours) {
      const parsedTours: Tour[] = JSON.parse(savedTours);
      const found = parsedTours.find(t => t.id === id);
      if (found) {
        setTour(found);
        setCurrentPhase(found.tourPhase || 'OUTWARD');
      } else {
        navigate(RoutePath.TOURS);
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!tour) return;

    const interval = setInterval(() => {
      let startTimestamp = 0;
      
      if (currentPhase === 'OUTWARD') {
         startTimestamp = new Date(tour.actualStartDate!).getTime();
      } else if (currentPhase === 'ON_SITE') {
         startTimestamp = new Date(tour.siteArrivalTime!).getTime();
      } else if (currentPhase === 'RETURN') {
         startTimestamp = new Date(tour.returnStartTime!).getTime();
      }

      if (startTimestamp > 0) {
        const now = new Date().getTime();
        const diff = now - startTimestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tour, currentPhase]);

  const handleCheckpointSuccess = (data: { selfieUrl: string, location: any, newSite?: Site }) => {
    if (!tour) return;
    
    const savedTours = JSON.parse(localStorage.getItem('tours_data') || '[]');
    let updatedTour = { ...tour };
    
    // Logic Branch based on current phase
    if (currentPhase === 'OUTWARD') {
        // Transition to ON_SITE
        updatedTour = {
            ...updatedTour,
            tourPhase: 'ON_SITE',
            siteArrivalTime: new Date().toISOString(),
            siteArrivalSelfieUrl: data.selfieUrl
        };
        
        // If a new site was defined, update the tour destination details
        if (data.newSite) {
          updatedTour.toLocation = data.newSite.name;
          updatedTour.toCoordinates = data.newSite.coordinates;
        }

        setCurrentPhase('ON_SITE');
    } 
    else if (currentPhase === 'ON_SITE') {
        // Transition to RETURN
        updatedTour = {
            ...updatedTour,
            tourPhase: 'RETURN',
            returnStartTime: new Date().toISOString(),
            returnStartSelfieUrl: data.selfieUrl
        };
        setCurrentPhase('RETURN');
    } 
    else if (currentPhase === 'RETURN') {
        // Transition to COMPLETED
        updatedTour = {
            ...updatedTour,
            status: 'Completed',
            endSelfieUrl: data.selfieUrl,
            actualEndDate: new Date().toISOString(),
            // Mock Distance: We assume return trip matches outward, so total = 12.4 * 2
            distanceCovered: 24.8 
        };
        navigate(RoutePath.TOURS);
    }

    // Save to LocalStorage
    const updatedToursList = savedTours.map((t: Tour) => t.id === tour.id ? updatedTour : t);
    localStorage.setItem('tours_data', JSON.stringify(updatedToursList));
    setTour(updatedTour);
    setShowActionModal(false);
  };

  const getPhaseColor = () => {
    if (currentPhase === 'ON_SITE') return 'bg-teal-500';
    if (currentPhase === 'RETURN') return 'bg-orange-500';
    return 'bg-indigo-500';
  };

  const getPhaseText = () => {
    if (currentPhase === 'ON_SITE') return 'On Site - Working';
    if (currentPhase === 'RETURN') return 'Returning to Base';
    return 'Traveling to Site';
  };

  // Determine if location is known
  const hasDestination = tour && tour.toCoordinates && tour.toCoordinates.lat !== 0;

  if (!tour) return null;

  return (
    <div className="min-h-full flex flex-col pt-2 pb-6 h-[calc(100vh-80px)]">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <button 
          onClick={() => navigate(RoutePath.TOURS)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
           <h1 className="text-xl font-bold text-slate-900 leading-none">Trip In Progress</h1>
           <p className="text-xs text-slate-500 mt-1">{tour.projectName}</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-slate-200 rounded-3xl relative overflow-hidden shadow-inner border border-slate-300 mb-4">
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-[#e5e7eb] opacity-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Route Line SVG - Flip direction for Return. Only show if we know where we are going! */}
        {hasDestination && (
          <svg className={`absolute inset-0 w-full h-full pointer-events-none transition-transform duration-500 ${currentPhase === 'RETURN' ? 'scale-x-[-1]' : ''}`}>
            <path 
              d="M 50 350 Q 150 200 300 50" 
              fill="none" 
              stroke={currentPhase === 'ON_SITE' ? '#14b8a6' : '#6366f1'} 
              strokeWidth="4" 
              strokeDasharray={currentPhase === 'ON_SITE' ? '0' : '8 4'}
              className={currentPhase !== 'ON_SITE' ? "animate-[dash_20s_linear_infinite]" : ""} 
            />
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -100;
                }
              }
            `}</style>
          </svg>
        )}

        {/* Start Marker */}
        <div className="absolute bottom-10 left-8 flex flex-col items-center">
            <div className="bg-white px-2 py-1 rounded shadow text-[10px] font-bold text-slate-600 whitespace-nowrap mb-1">
                {tour.fromLocation}
            </div>
            <div className="w-4 h-4 bg-slate-400 rounded-full border-2 border-white shadow-sm"></div>
        </div>

        {/* End Marker */}
        <div className="absolute top-10 right-8 flex flex-col items-center">
             <div className={`w-8 h-8 ${currentPhase === 'ON_SITE' ? 'bg-teal-500' : 'bg-white text-primary'} rounded-full flex items-center justify-center shadow-lg border-2 border-white ${currentPhase !== 'ON_SITE' ? 'animate-bounce' : ''}`}>
                {hasDestination ? (
                  <MapPin className={`w-5 h-5 ${currentPhase === 'ON_SITE' ? 'text-white' : 'fill-current'}`} />
                ) : (
                  <HelpCircle className="w-5 h-5 text-slate-400" />
                )}
             </div>
             <div className="bg-white px-2 py-1 rounded shadow text-[10px] font-bold text-primary whitespace-nowrap mt-1 max-w-[120px] truncate">
                {tour.toLocation}
            </div>
        </div>

        {/* User Location Marker (Movement Logic) */}
        {/* If destination unknown, we keep the user in the middle moving slightly */}
        <div className={`absolute transition-all duration-1000 ${
            !hasDestination && currentPhase === 'OUTWARD' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse' :
            currentPhase === 'OUTWARD' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
            currentPhase === 'ON_SITE' ? 'top-10 right-8 translate-x-2 -translate-y-2' :
            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' 
        }`}>
             {currentPhase !== 'ON_SITE' && (
               <div className={`w-12 h-12 ${currentPhase === 'RETURN' ? 'bg-orange-500/20' : 'bg-primary/20'} rounded-full flex items-center justify-center animate-ping absolute`}></div>
             )}
             <div className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center relative z-10">
                 {currentPhase === 'ON_SITE' ? (
                    <Building2 className="w-5 h-5 text-teal-600" />
                 ) : (
                    <>
                      {tour.transportMode === 'Bike' && <Bike className={`w-5 h-5 ${currentPhase === 'RETURN' ? 'text-orange-600' : 'text-primary'}`} />}
                      {tour.transportMode === 'Car' && <Car className={`w-5 h-5 ${currentPhase === 'RETURN' ? 'text-orange-600' : 'text-primary'}`} />}
                      {tour.transportMode === 'Bus' && <Bus className={`w-5 h-5 ${currentPhase === 'RETURN' ? 'text-orange-600' : 'text-primary'}`} />}
                    </>
                 )}
             </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-6">
         
         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getPhaseColor()}`}>
                  <Clock className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">{getPhaseText()}</p>
                  <p className="text-xl font-mono font-bold text-slate-900">{elapsedTime}</p>
               </div>
            </div>
            {currentPhase !== 'ON_SITE' && hasDestination && (
              <div className="text-right">
                 <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Distance</p>
                 <p className="text-xl font-bold text-slate-900">
                    {currentPhase === 'RETURN' ? '24.8' : '12.4'} <span className="text-sm font-normal text-slate-500">km</span>
                 </p>
              </div>
            )}
            {/* If unknown destination, show tracking indicator instead of distance */}
            {currentPhase !== 'ON_SITE' && !hasDestination && (
               <div className="text-right">
                 <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tracking</p>
                 <p className="text-sm font-bold text-primary animate-pulse">GPS Active</p>
               </div>
            )}
         </div>

         {currentPhase === 'OUTWARD' && (
            <Button onClick={() => setShowActionModal(true)} className="py-4 bg-teal-600 hover:bg-teal-700 shadow-teal-100">
               <Building2 className="w-5 h-5" /> 
               {hasDestination ? 'Mark Arrival' : 'Arrived - Define Site'}
            </Button>
         )}

         {currentPhase === 'ON_SITE' && (
            <Button onClick={() => setShowActionModal(true)} className="py-4 bg-orange-600 hover:bg-orange-700 shadow-orange-100">
               <Undo2 className="w-5 h-5" /> Start Return Journey
            </Button>
         )}

         {currentPhase === 'RETURN' && (
            <Button variant="danger" onClick={() => setShowActionModal(true)} className="py-4 shadow-red-100">
                <Flag className="w-5 h-5" /> End Trip
            </Button>
         )}

      </div>

      {/* Action Checkpoint Modal */}
      {tour && (
          <TourEndModal 
            isOpen={showActionModal}
            tour={tour}
            phase={currentPhase}
            onClose={() => setShowActionModal(false)}
            onSuccess={handleCheckpointSuccess}
          />
      )}
    </div>
  );
};
