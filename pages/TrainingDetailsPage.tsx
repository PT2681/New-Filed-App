import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Building2, 
  FileText, PlayCircle, StopCircle, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/FormElements';
import { SessionVerificationModal } from '../components/SessionVerificationModal';
import { SessionCompletionModal } from '../components/SessionCompletionModal';
import { TrainingSession, RoutePath } from '../types';
import { MOCK_TRAINING_SESSIONS } from '../constants';

export const TrainingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TrainingSession | null>(null);
  
  // Modals
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = () => {
    const saved = localStorage.getItem('training_sessions');
    let sessions: TrainingSession[] = saved ? JSON.parse(saved) : MOCK_TRAINING_SESSIONS;
    const found = sessions.find(s => s.id === id);
    setSession(found || null);
  };

  const updateSessionState = (updatedSession: TrainingSession) => {
    const saved = localStorage.getItem('training_sessions');
    let sessions: TrainingSession[] = saved ? JSON.parse(saved) : MOCK_TRAINING_SESSIONS;
    const updatedList = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    localStorage.setItem('training_sessions', JSON.stringify(updatedList));
    setSession(updatedSession);
  };

  const handleSessionStarted = (data: { photoUrl: string, location: any }) => {
    if (!session) return;
    const updated: TrainingSession = {
      ...session,
      status: 'In Progress',
      photoUrl: data.photoUrl,
      actualStartTime: new Date().toISOString()
    };
    updateSessionState(updated);
    setShowVerificationModal(false);
  };

  const handleSessionCompleted = (data: { photoUrl: string, remarks: string }) => {
    if (!session) return;
    const updated: TrainingSession = {
      ...session,
      status: 'Completed',
      actualEndTime: new Date().toISOString(),
      completionPhotoUrl: data.photoUrl,
      remarks: data.remarks
    };
    updateSessionState(updated);
    setShowCompletionModal(false);
  };

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

  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-slate-500">Session not found.</p>
        <Button variant="ghost" onClick={() => navigate(RoutePath.TRAINING)} className="w-auto">
          Go Back
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="flex flex-col space-y-6 pt-2 pb-24 animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(RoutePath.TRAINING)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 line-clamp-1">{session.topic}</h1>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            {session.projectName}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${getStatusColor(session.status)}`}>
            {session.status}
          </span>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{session.topic}</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
           <Building2 className="w-4 h-4" />
           <span>{session.role === 'TRAINEE' ? 'Trainee' : 'Trainer'}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Date</p>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                 <Calendar className="w-4 h-4 text-primary" />
                 {new Date(session.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
           </div>
           <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Time</p>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                 <Clock className="w-4 h-4 text-primary" />
                 {new Date(session.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
           </div>
        </div>
      </div>

      {/* Location Map Placeholder */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
         <div className="bg-slate-200 h-40 flex items-center justify-center relative">
            <MapPin className="w-8 h-8 text-slate-400" />
            <div className="absolute inset-0 bg-slate-900/5"></div>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1.5">
               <MapPin className="w-3.5 h-3.5 text-red-500" />
               {session.locationName}
            </div>
         </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
         <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            About Session
         </h3>
         <p className="text-slate-600 text-sm leading-relaxed">
            {session.description}
         </p>
      </div>

      {/* Completion Details (If Completed) */}
      {session.status === 'Completed' && (
         <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5 text-blue-600" />
               Completion Report
            </h3>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center text-sm border-b border-blue-100 pb-2">
                  <span className="text-slate-500">Start Time</span>
                  <span className="font-medium text-slate-900">
                     {new Date(session.actualStartTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </span>
               </div>
               <div className="flex justify-between items-center text-sm border-b border-blue-100 pb-2">
                  <span className="text-slate-500">End Time</span>
                  <span className="font-medium text-slate-900">
                     {new Date(session.actualEndTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </span>
               </div>
               <div className="flex justify-between items-center text-sm border-b border-blue-100 pb-2">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-bold text-blue-700 px-2 py-0.5 bg-blue-100 rounded">
                     {calculateDuration(session.actualStartTime, session.actualEndTime)}
                  </span>
               </div>
               
               {session.remarks && (
                  <div className="bg-white p-3 rounded-xl border border-blue-100 text-xs text-slate-600 italic">
                     "{session.remarks}"
                  </div>
               )}

               {session.completionPhotoUrl && (
                  <div>
                     <p className="text-xs text-slate-500 mb-2 font-medium">Site Photo</p>
                     <div className="w-full h-32 bg-slate-200 rounded-xl overflow-hidden">
                        <img src={session.completionPhotoUrl} alt="Completion" className="w-full h-full object-cover" />
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* Sticky Action Footer */}
      {session.status !== 'Cancelled' && session.status !== 'Completed' && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex flex-col gap-2 z-40 max-w-3xl mx-auto">
            {session.status === 'In Progress' ? (
               <Button variant="danger" onClick={() => setShowCompletionModal(true)}>
                  <StopCircle className="w-5 h-5" /> End Session
               </Button>
            ) : (
               <>
                  <Button 
                     onClick={() => setShowVerificationModal(true)}
                     disabled={!isToday(session.startDate)}
                     className={!isToday(session.startDate) ? "opacity-50" : ""}
                  >
                     <PlayCircle className="w-5 h-5" /> Start Session
                  </Button>
                  {!isToday(session.startDate) && (
                     <div className="flex items-center gap-2 justify-center text-orange-500 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Scheduled for {new Date(session.startDate).toLocaleDateString()}
                     </div>
                  )}
               </>
            )}
         </div>
      )}

      {/* Modals */}
      <SessionVerificationModal 
        isOpen={showVerificationModal}
        session={session}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={handleSessionStarted}
      />

      <SessionCompletionModal 
        isOpen={showCompletionModal}
        session={session}
        onClose={() => setShowCompletionModal(false)}
        onSuccess={handleSessionCompleted}
      />
    </div>
  );
};