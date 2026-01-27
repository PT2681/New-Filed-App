import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Calendar, Navigation, CheckCircle2, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/FormElements';
import { TourStartModal } from '../components/TourStartModal';
import { Tour, RoutePath } from '../types'; 
import { MOCK_TOURS as INITIAL_TOURS } from '../constants'; 

export const ToursPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CLAIMED'>('UPCOMING');
  const [tours, setTours] = useState<Tour[]>([]);
  
  // Modal State
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tours_data');
    if (saved) {
      setTours(JSON.parse(saved));
    } else {
      setTours(INITIAL_TOURS);
    }
  }, []);

  const saveTours = (newTours: Tour[]) => {
    setTours(newTours);
    localStorage.setItem('tours_data', JSON.stringify(newTours));
  };

  const handleStartClick = (tour: Tour) => {
    setSelectedTour(tour);
    setStartModalOpen(true);
  };

  const handleTourStarted = (data: Partial<Tour>) => {
    if (!selectedTour) return;
    const updated = tours.map(t => t.id === selectedTour.id ? { ...t, ...data } : t);
    saveTours(updated);
    setStartModalOpen(false);
    setSelectedTour(null);
    // Navigate to active tour page
    navigate(RoutePath.ACTIVE_TOUR.replace(':id', selectedTour.id));
  };

  const handleTrackClick = (tour: Tour) => {
    navigate(RoutePath.ACTIVE_TOUR.replace(':id', tour.id));
  };

  const handleClaimClick = (tour: Tour) => {
    const confirm = window.confirm(`Claim expenses for ${tour.projectName}?`);
    if (confirm) {
        const updated = tours.map(t => t.id === tour.id ? {
            ...t,
            status: 'Claimed' as const,
            claimStatus: 'Due' as const,
            claimAmount: 850 // Mock calc
        } : t);
        saveTours(updated);
    }
  };

  const filteredTours = tours.filter(t => {
      if (activeTab === 'UPCOMING') return t.status === 'Upcoming' || t.status === 'In Progress';
      if (activeTab === 'COMPLETED') return t.status === 'Completed';
      if (activeTab === 'CLAIMED') return t.status === 'Claimed';
      return false;
  });

  return (
    <div className="min-h-full flex flex-col space-y-4 pt-2 pb-6 animate-in slide-in-from-right-4">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(RoutePath.HOME)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Tour & Visits</h1>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex">
        {(['UPCOMING', 'COMPLETED', 'CLAIMED'] as const).map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
                    activeTab === tab ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
                }`}
            >
                {tab}
            </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredTours.map(tour => (
            <div key={tour.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                {/* Status Stripe */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                    tour.status === 'In Progress' ? 'bg-green-500' : 
                    tour.status === 'Upcoming' ? 'bg-blue-500' :
                    tour.status === 'Completed' ? 'bg-slate-400' : 'bg-orange-500'
                }`}></div>

                {/* Top Row */}
                <div className="flex justify-between items-start mb-3 pl-3">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{tour.id}</span>
                        <h3 className="font-bold text-slate-900 leading-tight">{tour.projectName}</h3>
                        <p className="text-xs text-slate-500 mt-1">{tour.taskName}</p>
                    </div>
                    {tour.status === 'In Progress' && (
                         <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse border border-green-200">
                             ONGOING
                         </span>
                    )}
                    {tour.claimStatus && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                            tour.claimStatus === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                            {tour.claimStatus.toUpperCase()}
                        </span>
                    )}
                </div>

                {/* Route */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4 ml-3 border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                            <div className="w-0.5 h-6 bg-slate-300"></div>
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">From</p>
                                <p className="text-xs font-medium text-slate-800">{tour.fromLocation}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">To</p>
                                <p className="text-xs font-medium text-slate-800">{tour.toLocation}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 ml-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(tour.startDate).toLocaleDateString()}</span>
                    </div>
                    {tour.advanceAmount && (
                         <div className="flex items-center gap-2 text-xs text-slate-600">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            <span>Adv: ${tour.advanceAmount}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="ml-3 pt-2">
                    {activeTab === 'UPCOMING' && tour.status === 'Upcoming' && (
                        <Button onClick={() => handleStartClick(tour)}>
                            <Navigation className="w-4 h-4" /> Start Trip
                        </Button>
                    )}
                    {activeTab === 'UPCOMING' && tour.status === 'In Progress' && (
                        <Button variant="primary" onClick={() => handleTrackClick(tour)}>
                             <Map className="w-4 h-4" /> Track Trip
                        </Button>
                    )}
                    {activeTab === 'COMPLETED' && (
                        <Button onClick={() => handleClaimClick(tour)} variant="outline">
                            <DollarSign className="w-4 h-4" /> Claim Expenses
                        </Button>
                    )}
                    {activeTab === 'CLAIMED' && (
                        <p className="text-center text-xs text-slate-400 italic">
                            Claim submitted on {new Date().toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        ))}
      </div>

      {/* Modals */}
      {selectedTour && (
          <TourStartModal 
            isOpen={startModalOpen}
            tour={selectedTour}
            onClose={() => { setStartModalOpen(false); setSelectedTour(null); }}
            onSuccess={handleTourStarted}
          />
      )}
    </div>
  );
};