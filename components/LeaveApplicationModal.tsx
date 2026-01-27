import React, { useState } from 'react';
import { X, CalendarDays, FileText, Send } from 'lucide-react';
import { Button, Input } from './FormElements';
import { LeaveRequest, LeaveType } from '../types';

interface LeaveApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leave: LeaveRequest) => void;
}

export const LeaveApplicationModal: React.FC<LeaveApplicationModalProps> = ({ 
  isOpen, onClose, onSuccess 
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<LeaveType>('Casual');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newLeave: LeaveRequest = {
        id: `L-${Date.now()}`,
        type,
        startDate,
        endDate,
        reason,
        status: 'Pending',
        appliedOn: new Date().toISOString()
      };
      
      onSuccess(newLeave);
      setIsLoading(false);
      resetForm();
    }, 1000);
  };

  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setType('Casual');
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-rose-500" />
            Apply Leave
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 ml-1">Leave Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['Casual', 'Sick', 'Earned', 'Emergency'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t as LeaveType)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    type === t 
                      ? 'bg-rose-50 border-rose-200 text-rose-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 ml-1">From</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 ml-1">To</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required
                />
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 ml-1">Reason</label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 min-h-[100px] resize-none text-sm"
              placeholder="Please explain why you need leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={isLoading} className="bg-rose-600 hover:bg-rose-700 shadow-rose-200">
               <Send className="w-4 h-4" /> Submit Application
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};