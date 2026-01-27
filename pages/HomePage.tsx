import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Cloud, Clock, CheckCircle2, AlertCircle, 
  Calendar, GraduationCap, Map
} from 'lucide-react';
import { FeatureCard } from '../components/FeatureCard';
import { Button } from '../components/FormElements';
import { AttendanceModal } from '../components/AttendanceModal';
import { FEATURES, MOCK_TRAINING_SESSIONS, MOCK_TOURS } from '../constants';
import { Feature, AttendanceState, AttendanceLog, RoutePath, TrainingSession, Tour } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceState>({
    status: 'OUT',
    punchInTime: null,
    punchOutTime: null,
    location: null,
    weather: null,
    photoUrl: null
  });
  
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dashboard Data State
  const [nextTraining, setNextTraining] = useState<TrainingSession | null>(null);
  const [nextTour, setNextTour] = useState<Tour | null>(null);

  // Load state on mount
  useEffect(() => {
    // Attendance
    const saved = localStorage.getItem('attendance_state');
    if (saved) {
      setAttendance(JSON.parse(saved));
    }

    // Load Next Tasks
    const loadNextTasks = () => {
      // Training
      const savedTraining = localStorage.getItem('training_sessions');
      const trainingList: TrainingSession[] = savedTraining ? JSON.parse(savedTraining) : MOCK_TRAINING_SESSIONS;
      const upcomingTraining = trainingList
        .filter(t => (t.status === 'Due' || t.status === 'In Progress'))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
      setNextTraining(upcomingTraining || null);

      // Tours
      const savedTours = localStorage.getItem('tours_data');
      const tourList: Tour[] = savedTours ? JSON.parse(savedTours) : MOCK_TOURS;
      const upcomingTour = tourList
        .filter(t => (t.status === 'Upcoming' || t.status === 'In Progress'))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
      setNextTour(upcomingTour || null);
    };
    loadNextTasks();

    // Clock timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAttendanceSuccess = (data: { photoUrl: string; location: string; weather: string }) => {
    const now = new Date();
    // Use 24-hour format for consistency with calculation logic in ProfilePage
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateString = now.toISOString().split('T')[0];
    
    let newState: AttendanceState;
    
    // Get existing history or initialize
    const history: AttendanceLog[] = JSON.parse(localStorage.getItem('attendance_history') || '[]');

    if (attendance.status === 'OUT') {
      // Punching In
      newState = {
        ...attendance,
        status: 'IN',
        punchInTime: timeString,
        punchOutTime: null,
        location: data.location,
        weather: data.weather,
        photoUrl: data.photoUrl
      };

      // Add new log entry
      const newLog: AttendanceLog = {
        date: dateString,
        start: timeString,
        end: '-',
        weather: data.weather.split(',')[0], // Simplify weather string
        status: 'Present'
      };
      history.unshift(newLog);

    } else {
      // Punching Out
      newState = {
        ...attendance,
        status: 'OUT',
        punchOutTime: timeString,
        location: data.location,
        weather: data.weather,
        photoUrl: data.photoUrl
      };

      // Update the latest entry for today that hasn't been closed
      const openLogIndex = history.findIndex(l => l.date === dateString && l.end === '-');
      if (openLogIndex !== -1) {
        history[openLogIndex].end = timeString;
      } else {
        // Fallback: create a new entry if none found (shouldn't happen in normal flow)
        const newLog: AttendanceLog = {
          date: dateString,
          start: attendance.punchInTime || '-', 
          end: timeString,
          weather: data.weather.split(',')[0],
          status: 'Present'
        };
        history.unshift(newLog);
      }
    }

    setAttendance(newState);
    localStorage.setItem('attendance_state', JSON.stringify(newState));
    localStorage.setItem('attendance_history', JSON.stringify(history));
    setShowPunchModal(false);
  };

  const handleFeatureClick = (feature: Feature) => {
    if (feature.id === 'projects') {
      navigate(RoutePath.PROJECTS);
    } else if (feature.id === 'training') {
      navigate(RoutePath.TRAINING);
    } else if (feature.id === 'tours') {
      navigate(RoutePath.TOURS);
    } else if (feature.id === 'hr') {
      navigate(RoutePath.HR);
    } else {
      alert(`Coming Soon: ${feature.title}\n\nThis feature is part of the planned roadmap.`);
    }
  };

  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome & Date Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hello, Alex 👋</h2>
          <p className="text-slate-500 text-sm">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100 text-xs font-semibold text-slate-600 flex items-center gap-2">
          <Clock className="w-3 h-3 text-primary" />
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Attendance Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${attendance.status === 'IN' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            My Attendance
            {attendance.status === 'IN' ? (
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200">ON DUTY</span>
            ) : (
               <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full border border-slate-200">OFF DUTY</span>
            )}
          </h3>
          {attendance.status === 'IN' && (
             <div className="text-xs text-slate-400 font-medium">
               In since {attendance.punchInTime}
             </div>
          )}
        </div>

        {attendance.status === 'IN' ? (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
               {attendance.photoUrl && (
                 <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-indigo-50 shadow-sm flex-shrink-0">
                   <img src={attendance.photoUrl} alt="Punch In" className="w-full h-full object-cover" />
                 </div>
               )}
               <div className="space-y-2 flex-1">
                 <div className="flex items-start gap-2 text-sm text-slate-600">
                   <MapPin className="w-4 h-4 text-primary mt-0.5" />
                   <span className="line-clamp-2">{attendance.location}</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                   <Cloud className="w-4 h-4 text-primary" />
                   <span>{attendance.weather}</span>
                 </div>
               </div>
            </div>
            
            <Button 
              variant="danger" 
              onClick={() => setShowPunchModal(true)}
              className="mt-2"
            >
              Punch Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-50/50 rounded-xl p-3 flex gap-3 items-center">
              <div className="bg-white p-2 rounded-full shadow-sm text-indigo-500">
                 <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-sm text-indigo-900 leading-tight">
                You are currently off duty. Punch in to mark your attendance and start tasks.
              </p>
            </div>
             <Button 
              variant="primary" 
              onClick={() => setShowPunchModal(true)}
              className="w-full"
            >
              Punch In
            </Button>
            {attendance.punchOutTime && (
               <p className="text-center text-xs text-slate-400">
                 Last punch out at {attendance.punchOutTime}
               </p>
            )}
          </div>
        )}
      </div>

      {/* Features Grid - MOVED UP */}
      <section>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onClick={() => handleFeatureClick(feature)}
            />
          ))}
        </div>
      </section>

      {/* Up Next Section - MOVED DOWN */}
      {(nextTraining || nextTour) && (
        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <h3 className="text-lg font-bold text-slate-800">Up Next</h3>
          </div>
          
          <div className="space-y-3">
            {/* Next Tour Card */}
            {nextTour && (
              <div 
                onClick={() => navigate(RoutePath.TOURS)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.99] transition-transform cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
                      <Map className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Upcoming Visit</span>
                  </div>
                  {nextTour.status === 'In Progress' && (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                      ONGOING
                    </span>
                  )}
                </div>
                
                <h4 className="font-bold text-slate-900 leading-tight mb-1">{nextTour.projectName}</h4>
                <p className="text-xs text-slate-500 mb-3">{nextTour.taskName}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                     <Clock className="w-3.5 h-3.5 text-slate-400" />
                     <span>{new Date(nextTour.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 max-w-[50%]">
                     <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                     <span className="truncate">{nextTour.toLocation}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Next Training Card */}
            {nextTraining && (
              <div 
                onClick={() => navigate(RoutePath.TRAINING)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.99] transition-transform cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-100 rounded-lg text-teal-600">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Training</span>
                  </div>
                  {nextTraining.status === 'Due' && isToday(nextTraining.startDate) && (
                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      DUE TODAY
                    </span>
                  )}
                </div>
                
                <h4 className="font-bold text-slate-900 leading-tight mb-1">{nextTraining.topic}</h4>
                <p className="text-xs text-slate-500 mb-3 line-clamp-1">{nextTraining.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                     <Calendar className="w-3.5 h-3.5 text-slate-400" />
                     <span>{new Date(nextTraining.startDate).toLocaleDateString([], {day: 'numeric', month: 'short'})}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                     <Clock className="w-3.5 h-3.5 text-slate-400" />
                     <span>{new Date(nextTraining.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Attendance Modal */}
      <AttendanceModal 
        isOpen={showPunchModal}
        mode={attendance.status === 'OUT' ? 'IN' : 'OUT'}
        onClose={() => setShowPunchModal(false)}
        onSuccess={handleAttendanceSuccess}
      />
    </div>
  );
};