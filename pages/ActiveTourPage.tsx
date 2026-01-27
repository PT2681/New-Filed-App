import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Clock, StopCircle, Car, Bike, Bus } from 'lucide-react';
import { Button } from '../components/FormElements';
import { TourEndModal } from '../components/TourEndModal';
import { Tour, RoutePath } from '../types';

export const ActiveTourPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [showEndModal, setShowEndModal] = useState(false);

  useEffect(() => {
    const savedTours = localStorage.getItem('tours_data');
    if (savedTours) {
      const parsedTours: Tour[] = JSON.parse(savedTours);
      const found = parsedTours.find(t => t.id === id);
      if (found) {
        setTour(found);
      } else {
        navigate(RoutePath.TOURS); // Fallback
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!tour || !tour.actualStartDate) return;

    const interval = setInterval(() => {
      const start = new Date(tour.actualStartDate!).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [tour]);

  const handleEndTourSuccess = (data: { selfieUrl: string, location: any }) => {
    if (!tour) return;
    
    // Update local storage
    const savedTours = JSON.parse(localStorage.getItem('tours_data') || '[]');
    const updatedTours = savedTours.map((t: Tour) => {
      if (t.id === tour.id) {
        return {
          ...t,
          status: 'Completed',
          endSelfieUrl: data.selfieUrl,
          actualEndDate: new Date().toISOString(),
          distanceCovered: 18.5 // Mock distance for the session
        };
      }
      return t;
    });

    localStorage.setItem('tours_data', JSON.stringify(updatedTours));
    setShowEndModal(false);
    navigate(RoutePath.TOURS);
  };

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
        
        {/* Route Line SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path 
            d="M 50 350 Q 150 200 300 50" 
            fill="none" 
            stroke="#6366f1" 
            strokeWidth="4" 
            strokeDasharray="8 4"
            className="animate-[dash_20s_linear_infinite]" 
          />
          <style>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -100;
              }
            }
          `}</style>
        </svg>

        {/* Start Marker */}
        <div className="absolute bottom-10 left-8 flex flex-col items-center">
            <div className="bg-white px-2 py-1 rounded shadow text-[10px] font-bold text-slate-600 whitespace-nowrap mb-1">
                {tour.fromLocation}
            </div>
            <div className="w-4 h-4 bg-slate-400 rounded-full border-2 border-white shadow-sm"></div>
        </div>

        {/* End Marker */}
        <div className="absolute top-10 right-8 flex flex-col items-center">
             <div className="w-8 h-8 text-primary bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                <MapPin className="w-5 h-5 fill-current" />
             </div>
             <div className="bg-white px-2 py-1 rounded shadow text-[10px] font-bold text-primary whitespace-nowrap mt-1">
                {tour.toLocation}
            </div>
        </div>

        {/* User Location Marker (Mock Movement) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-ping absolute"></div>
             <div className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center relative z-10">
                 {tour.transportMode === 'Bike' && <Bike className="w-5 h-5 text-primary" />}
                 {tour.transportMode === 'Car' && <Car className="w-5 h-5 text-primary" />}
                 {tour.transportMode === 'Bus' && <Bus className="w-5 h-5 text-primary" />}
                 {!tour.transportMode && <Navigation className="w-5 h-5 text-primary" />}
             </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-6">
         
         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-primary">
                  <Clock className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Duration</p>
                  <p className="text-xl font-mono font-bold text-slate-900">{elapsedTime}</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Distance</p>
               <p className="text-xl font-bold text-slate-900">12.4 <span className="text-sm font-normal text-slate-500">km</span></p>
            </div>
         </div>

         <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Expected Arrival: <span className="font-semibold text-slate-900">10:45 AM</span></span>
            <span className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> GPS Active
            </span>
         </div>

         <Button variant="danger" onClick={() => setShowEndModal(true)} className="py-4 shadow-red-100">
            <StopCircle className="w-5 h-5" /> End Trip
         </Button>

      </div>

      {/* End Tour Modal */}
      {tour && (
          <TourEndModal 
            isOpen={showEndModal}
            tour={tour}
            onClose={() => setShowEndModal(false)}
            onSuccess={handleEndTourSuccess}
          />
      )}
    </div>
  );
};