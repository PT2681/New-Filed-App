import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Calendar, Clock, 
  AlertCircle, CheckCircle2, XCircle, HeartHandshake
} from 'lucide-react';
import { LeaveApplicationModal } from '../components/LeaveApplicationModal';
import { RoutePath, LeaveRequest, Notification } from '../types';
import { MOCK_LEAVES, MOCK_NOTIFICATIONS } from '../constants';

export const HRPage: React.FC = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // Balances (Mock)
  const balances = {
    Casual: { used: 4, total: 12 },
    Sick: { used: 2, total: 10 },
    Earned: { used: 5, total: 15 }
  };

  useEffect(() => {
    const saved = localStorage.getItem('leave_requests');
    if (saved) {
      setLeaves(JSON.parse(saved));
    } else {
      setLeaves(MOCK_LEAVES);
      localStorage.setItem('leave_requests', JSON.stringify(MOCK_LEAVES));
    }
  }, []);

  const handleApplySuccess = (newLeave: LeaveRequest) => {
    const updatedLeaves = [newLeave, ...leaves];
    setLeaves(updatedLeaves);
    localStorage.setItem('leave_requests', JSON.stringify(updatedLeaves));
    setIsModalOpen(false);

    // Simulate Admin Approval Notification Trigger
    // In a real app, backend would push this. Here we simulate receiving one.
    setTimeout(() => {
       const savedNotifs = localStorage.getItem('notifications');
       const existingNotifs: Notification[] = savedNotifs ? JSON.parse(savedNotifs) : MOCK_NOTIFICATIONS;
       
       const newNotification: Notification = {
          id: `n-${Date.now()}`,
          type: 'LEAVE_UPDATE',
          title: 'Leave Application Received',
          message: `Your leave request for ${newLeave.reason} has been received and is under review.`,
          timestamp: new Date().toISOString(),
          read: false,
          route: RoutePath.HR
       };
       
       localStorage.setItem('notifications', JSON.stringify([newNotification, ...existingNotifs]));
    }, 2000);
  };

  const filteredLeaves = filter === 'All' ? leaves : leaves.filter(l => l.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-full flex flex-col space-y-6 pt-2 pb-20 animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(RoutePath.HOME)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">HR Section</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-200 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Balance Cards */}
      <section className="grid grid-cols-3 gap-3">
        {Object.entries(balances).map(([type, stats]) => (
          <div key={type} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
             <div className={`p-2 rounded-full mb-2 ${
               type === 'Casual' ? 'bg-orange-100 text-orange-600' :
               type === 'Sick' ? 'bg-rose-100 text-rose-600' :
               'bg-blue-100 text-blue-600'
             }`}>
                <HeartHandshake className="w-4 h-4" />
             </div>
             <span className="text-xs font-bold text-slate-500 uppercase">{type}</span>
             <div className="mt-1">
               <span className="text-lg font-bold text-slate-900">{stats.total - stats.used}</span>
               <span className="text-[10px] text-slate-400">/{stats.total}</span>
             </div>
          </div>
        ))}
      </section>

      {/* History Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Leave History</h2>
          <select 
            className="text-xs bg-slate-100 border-none rounded-lg py-1 px-2 text-slate-600 outline-none focus:ring-0"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredLeaves.length > 0 ? (
            filteredLeaves.map(leave => (
              <div key={leave.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                {/* Status Stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  leave.status === 'Approved' ? 'bg-green-500' : 
                  leave.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'
                }`}></div>

                <div className="flex justify-between items-start mb-2 pl-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Applied: {new Date(leave.appliedOn).toLocaleDateString()}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{leave.reason}</h3>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${getStatusColor(leave.status)}`}>
                    {getStatusIcon(leave.status)}
                    {leave.status}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 ml-2 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Type</span>
                      <span className="text-sm font-semibold text-slate-700">{leave.type}</span>
                   </div>
                   <div className="h-6 w-px bg-slate-200"></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Dates</span>
                      <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(leave.startDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} - {new Date(leave.endDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}
                      </div>
                   </div>
                </div>

                {leave.status === 'Rejected' && leave.rejectionReason && (
                   <div className="mt-3 ml-2 flex gap-2 items-start bg-red-50 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 leading-tight">
                        <strong>HR Note:</strong> {leave.rejectionReason}
                      </p>
                   </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
               <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
               <p className="text-sm text-slate-500">No leave records found.</p>
            </div>
          )}
        </div>
      </section>

      <LeaveApplicationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
};