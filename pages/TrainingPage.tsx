import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, GraduationCap, Users, Calendar, 
  MapPin, Clock, Filter, PlayCircle, StopCircle, CheckCircle2 
} from 'lucide-react';
import { Input, Button } from '../components/FormElements';
import { SessionVerificationModal } from '../components/SessionVerificationModal';
import { SessionCompletionModal } from '../components/SessionCompletionModal';
import { TrainingSession, RoutePath } from '../types';
import { MOCK_TRAINING_SESSIONS } from '../constants';

type TabType = 'TAKE' | 'GIVE';
type SubTabType = 'UPCOMING' | 'COMPLETED';
type FilterSort = 'LATEST' | 'OLDEST';

export const TrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('TAKE');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<FilterSort>('LATEST');
  
  // State for sessions (initialized with mock data)
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  
  // Modals
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    // Load from local storage or mock
    const saved = localStorage.getItem('training_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    } else {
      setSessions(MOCK_TRAINING_SESSIONS);
    }
  }, []);

  const saveSessions = (updatedSessions: TrainingSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('training_sessions', JSON.stringify(updatedSessions));
  };

  const handleStartSession = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowVerificationModal(true);
  };

  const handleSessionStarted = (data: { selfieUrl: string, venuePhotoUrl: string, location: any }) => {
    if (!selectedSession) return;
    
    const updatedSessions = sessions.map(s => {
      if (s.id === selectedSession.id) {
        return {
          ...s,
          status: 'In Progress' as const,
          photoUrl: data.venuePhotoUrl, // Storing Venue Photo as primary
          actualStartTime: new Date().toISOString()
        };
      }
      return s;
    });
    
    saveSessions(updatedSessions);
    setShowVerificationModal(false);
    setSelectedSession(null);
  };

  const handleEndSession = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowCompletionModal(true);
  };

  const handleSessionCompleted = (data: { selfieUrl: string, sessionPhotoUrl: string, remarks: string }) => {
    if (!selectedSession) return;

    const updatedSessions = sessions.map(s => {
      if (s.id === selectedSession.id) {
        return {
          ...s,
          status: 'Completed' as const,
          actualEndTime: new Date().toISOString(),
          completionPhotoUrl: data.sessionPhotoUrl, // Storing Session Photo as primary
          remarks: data.remarks
        };
      }
      return s;
    });

    saveSessions(updatedSessions);
    setShowCompletionModal(false);
    setSelectedSession(null);
  };

  // Helper to calculate duration
  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return 'N/A';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;

    if (diff < 0) return '0m';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Filter Logic
  const filteredSessions = sessions.filter(session => {
    // 1. Role Check
    const roleMatch = activeTab === 'TAKE' ? session.role === 'TRAINEE' : session.role === 'TRAINER';
    if (!roleMatch) return false;

    // 2. SubTab Status Check
    let statusMatch = false;
    if (activeSubTab === 'UPCOMING') {
      statusMatch = session.status === 'Due' || session.status === 'In Progress';
    } else {
      statusMatch = session.status === 'Completed' || session.status === 'Cancelled';
    }
    if (!statusMatch) return false;

    // 3. Search Query
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = session.topic.toLowerCase().includes(searchLower) ||
                        session.projectName.toLowerCase().includes(searchLower) ||
                        session.locationName.toLowerCase().includes(searchLower);
    
    return searchMatch;
  });

  // Sort Logic
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    // Basic date sort
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return sortOrder === 'LATEST' ? dateA - dateB : dateB - dateA;
  });

  // Override sort for "LATEST" logic based on tab context
  if (sortOrder === 'LATEST') {
     if (activeSubTab === 'UPCOMING') {
        sortedSessions.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
     } else {
        sortedSessions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
     }
  } else {
     if (activeSubTab === 'UPCOMING') {
        sortedSessions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
     } else {
        sortedSessions.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
     }
  }

  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  return (
    <div className="min-h-full flex flex-col space-y-4 pt-2 pb-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(RoutePath.HOME)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Training Mgmt</h1>
      </div>

      {/* Main Tabs (Role) */}
      <div className="bg-slate-100 p-1 rounded-xl flex">
        <button
          onClick={() => setActiveTab('TAKE')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'TAKE' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Take Training
        </button>
        <button
          onClick={() => setActiveTab('GIVE')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'GIVE' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Give Training
        </button>
      </div>

      {/* Secondary Tabs (Status) & Filters */}
      <div className="flex flex-col gap-3">
         <div className="flex border-b border-slate-200">
            {(['UPCOMING', 'COMPLETED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSubTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500'
                }`}
              >
                {tab === 'UPCOMING' ? 'Upcoming' : 'History'}
              </button>
            ))}
         </div>
         
         <div className="flex gap-2">
            <div className="flex-1">
              <Input 
                placeholder="Search topic, location..." 
                icon={Search} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2 text-sm"
              />
            </div>
            <button 
              onClick={() => setSortOrder(prev => prev === 'LATEST' ? 'OLDEST' : 'LATEST')}
              className="px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center"
            >
              <Filter className={`w-4 h-4 ${sortOrder !== 'LATEST' ? 'text-primary' : ''}`} />
            </button>
         </div>
      </div>

      {/* List View */}
      <div className="space-y-4">
        {sortedSessions.length > 0 ? (
          sortedSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              
              {/* Badge Row */}
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {session.projectName}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  session.status === 'In Progress' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                  session.status === 'Completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  session.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}>
                  {session.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight">{session.topic}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{session.description}</p>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {new Date(session.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(session.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-medium line-clamp-2">{session.locationName}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                 {activeSubTab === 'UPCOMING' && (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => navigate(RoutePath.TRAINING_DETAILS.replace(':id', session.id))}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                        >
                            View Details
                        </button>
                        <div className="flex-1">
                            {session.status === 'In Progress' ? (
                                <Button variant="danger" onClick={() => handleEndSession(session)}>
                                    <StopCircle className="w-4 h-4" /> End
                                </Button>
                            ) : (
                                <Button 
                                    disabled={!isToday(session.startDate)} 
                                    className={!isToday(session.startDate) ? "opacity-50" : ""}
                                    onClick={() => handleStartSession(session)}
                                >
                                    <PlayCircle className="w-4 h-4" /> Start
                                </Button>
                            )}
                        </div>
                    </div>
                 )}
                 
                 {activeSubTab === 'UPCOMING' && !isToday(session.startDate) && session.status === 'Due' && (
                    <p className="text-center text-[10px] text-slate-400">
                      Scheduled for {new Date(session.startDate).toLocaleDateString()}
                    </p>
                  )}
              
                  {activeSubTab === 'COMPLETED' && (
                     <div className="pt-2 border-t border-slate-50 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Ended: {session.actualEndTime ? new Date(session.actualEndTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}</span>
                            {session.actualStartTime && session.actualEndTime && (
                              <div className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                 <Clock className="w-3 h-3" />
                                 {calculateDuration(session.actualStartTime, session.actualEndTime)}
                              </div>
                            )}
                        </div>
                        <button 
                            onClick={() => navigate(RoutePath.TRAINING_DETAILS.replace(':id', session.id))}
                            className="w-full py-2 mt-1 rounded-lg bg-slate-50 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors"
                        >
                            View Full Report
                        </button>
                     </div>
                  )}
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No Sessions Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {activeSubTab === 'UPCOMING' ? "You're all caught up!" : "No history available."}
            </p>
          </div>
        )}
      </div>

      {/* Start Session Modal */}
      {selectedSession && (
        <SessionVerificationModal 
          isOpen={showVerificationModal}
          session={selectedSession}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedSession(null);
          }}
          onSuccess={handleSessionStarted}
        />
      )}

      {/* End Session Modal */}
      {selectedSession && (
        <SessionCompletionModal 
          isOpen={showCompletionModal}
          session={selectedSession}
          onClose={() => {
            setShowCompletionModal(false);
            setSelectedSession(null);
          }}
          onSuccess={handleSessionCompleted}
        />
      )}
    </div>
  );
};