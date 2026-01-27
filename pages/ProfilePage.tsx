import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Calendar, Car, Search, Cloud, 
  Mail, Phone, CalendarDays, Briefcase, Fuel, 
  FileText, Bike
} from 'lucide-react';
import { Button, Input } from '../components/FormElements';
import { RoutePath, AttendanceLog } from '../types';

// Mock Data Configuration
const USER_PROFILE = {
  fullName: "Alex Morgan",
  dob: "1992-08-15",
  zonalOffice: "North Zone - Sector 4",
  phone: "+1 (555) 012-3456",
  email: "alex.morgan@company.com",
  dateOfJoining: "2021-03-10",
  avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop"
};

const VEHICLE_DETAILS = {
  type: "Bike",
  fuelType: "Petrol",
  regNumber: "KA-05-JK-1234",
  imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
};

const MOCK_ATTENDANCE_LOGS: AttendanceLog[] = [
  { date: "2023-10-25", start: "09:00", end: "18:00", weather: "Sunny", status: "Present" },
  { date: "2023-10-24", start: "09:15", end: "18:30", weather: "Cloudy", status: "Present" },
  { date: "2023-10-23", start: "-", end: "-", weather: "-", status: "Leave" },
  { date: "2023-10-22", start: "-", end: "-", weather: "-", status: "Holiday" },
  { date: "2023-10-21", start: "08:45", end: "17:45", weather: "Rainy", status: "Present" },
  { date: "2023-10-20", start: "09:00", end: "18:00", weather: "Clear", status: "Present" },
  { date: "2023-10-19", start: "09:30", end: "18:30", weather: "Sunny", status: "Present" },
];

type TabType = 'profile' | 'attendance' | 'vehicle';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [dateSearch, setDateSearch] = useState('');
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(MOCK_ATTENDANCE_LOGS);

  // Load real attendance history from local storage and merge with mock data
  useEffect(() => {
    const savedHistory = localStorage.getItem('attendance_history');
    if (savedHistory) {
      const parsedHistory: AttendanceLog[] = JSON.parse(savedHistory);
      // Combine real history with mock data, filtering out any duplicate dates if needed
      // For simplicity, we just place real history on top
      setAttendanceLogs([...parsedHistory, ...MOCK_ATTENDANCE_LOGS]);
    }
  }, [activeTab]); // Refresh when tab changes

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate(RoutePath.LOGIN, { replace: true });
  };

  const calculateHours = (start: string, end: string) => {
    if (start === '-' || end === '-') return '-';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(endH)) return '-';

    // Simple calc assuming same day
    let durationMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (durationMins < 0) durationMins += 24 * 60; // Handle overnight if needed
    
    const hours = Math.floor(durationMins / 60);
    const minutes = durationMins % 60;
    return `${hours}h ${minutes}m`;
  };

  const filteredLogs = attendanceLogs.filter(log => 
    log.date.includes(dateSearch)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-50 shadow-lg mb-4">
                <img src={USER_PROFILE.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{USER_PROFILE.fullName}</h2>
              <p className="text-slate-500 text-sm font-medium">{USER_PROFILE.zonalOffice}</p>
            </div>

            {/* Details List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><CalendarDays className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400">Date of Birth</p>
                  <p className="text-sm font-medium text-slate-900">{USER_PROFILE.dob}</p>
                </div>
              </div>
              <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                <div className="bg-green-50 p-2 rounded-lg text-green-600"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400">Phone Number</p>
                  <p className="text-sm font-medium text-slate-900">{USER_PROFILE.phone}</p>
                </div>
              </div>
              <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400">Email ID</p>
                  <p className="text-sm font-medium text-slate-900 break-all">{USER_PROFILE.email}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Briefcase className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400">Date of Joining</p>
                  <p className="text-sm font-medium text-slate-900">{USER_PROFILE.dateOfJoining}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 pb-2">
              <Button variant="danger" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <Input 
                placeholder="Search by date (YYYY-MM-DD)..." 
                icon={Search}
                value={dateSearch}
                onChange={(e) => setDateSearch(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 whitespace-nowrap">Time In/Out</th>
                      <th className="px-4 py-3 whitespace-nowrap">Weather</th>
                      <th className="px-4 py-3 whitespace-nowrap">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log, index) => {
                      const isHoliday = log.status === 'Holiday';
                      const isLeave = log.status === 'Leave';
                      const rowClass = isHoliday ? 'bg-orange-50' : isLeave ? 'bg-red-50' : '';
                      
                      return (
                        <tr key={index} className={`hover:bg-slate-50/50 transition-colors ${rowClass}`}>
                          <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                            {log.date}
                            {(isHoliday || isLeave) && (
                              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${isHoliday ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                {log.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {isHoliday || isLeave ? '-' : (
                              <div className="flex flex-col">
                                <span>{log.start}</span>
                                <span className="text-xs text-slate-400">to {log.end}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                             {log.weather !== '-' && (
                               <div className="flex items-center gap-1">
                                 <Cloud className="w-3 h-3 text-slate-400" />
                                 {log.weather}
                               </div>
                             )}
                             {log.weather === '-' && '-'}
                          </td>
                          <td className="px-4 py-3 font-medium text-primary whitespace-nowrap">
                            {calculateHours(log.start, log.end)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No records found</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <div className="h-48 overflow-hidden bg-slate-100 relative">
                <img 
                  src={VEHICLE_DETAILS.imageUrl} 
                  alt="Vehicle" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-white font-bold text-lg">{VEHICLE_DETAILS.regNumber}</h3>
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Bike className="w-4 h-4 text-primary" />
                    <span className="text-xs text-slate-500">Vehicle Type</span>
                  </div>
                  <p className="font-semibold text-slate-900">{VEHICLE_DETAILS.type}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Fuel className="w-4 h-4 text-primary" />
                    <span className="text-xs text-slate-500">Fuel Type</span>
                  </div>
                  <p className="font-semibold text-slate-900">{VEHICLE_DETAILS.fuelType}</p>
                </div>
              </div>

               <div className="px-4 pb-4">
                 <div className="p-3 bg-indigo-50 rounded-xl flex items-start gap-3">
                   <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
                   <div>
                     <p className="text-sm font-bold text-indigo-900">Registration Details</p>
                     <p className="text-xs text-indigo-700 mt-1">
                       Verified and active. Next renewal due in 2024.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col pt-2 pb-6">
      {/* Tabs */}
      <div className="bg-surface p-1 rounded-xl shadow-sm border border-slate-200 flex mb-6 mx-1">
        {(['profile', 'attendance', 'vehicle'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="w-full">
        {renderTabContent()}
      </div>
    </div>
  );
};