import React, { useState } from 'react';
import { X, Wallet, Send, AlertCircle, Briefcase } from 'lucide-react';
import { Button, Input } from './FormElements';
import { Tour } from '../types';

interface AdvanceRequestModalProps {
  isOpen: boolean;
  tour: Tour;
  onClose: () => void;
  onSuccess: (amount: number, reason: string) => void;
}

export const AdvanceRequestModal: React.FC<AdvanceRequestModalProps> = ({ 
  isOpen, tour, onClose, onSuccess 
}) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reason) return;

    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      onSuccess(parseFloat(amount), reason);
      setIsLoading(false);
      setAmount('');
      setReason('');
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-500" />
            Request Advance
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div className="bg-indigo-50 rounded-xl p-3 flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-indigo-900 uppercase">Project Context</p>
              <p className="text-sm font-semibold text-indigo-900">{tour.projectName}</p>
              <p className="text-xs text-indigo-700">{tour.taskName} • {tour.toLocation}</p>
            </div>
          </div>

          <Input 
             label="Amount Required (₹)"
             type="number"
             placeholder="e.g. 5000"
             value={amount}
             onChange={(e) => setAmount(e.target.value)}
             autoFocus
             required
          />

          <div className="space-y-1.5">
             <label className="text-sm font-medium text-slate-700 ml-1">Reason for Advance</label>
             <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 min-h-[100px] resize-none text-sm"
                placeholder="e.g. Travel tickets, Accommodation booking..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
             />
          </div>

          <div className="flex gap-2 items-start bg-amber-50 p-2.5 rounded-xl">
             <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
             <p className="text-xs text-amber-800 leading-relaxed">
               Requests are subject to manager approval. Amount will be credited to your linked bank account upon approval.
             </p>
          </div>

          <div className="pt-2">
             <Button type="submit" isLoading={isLoading} disabled={!amount || !reason}>
               <Send className="w-4 h-4" /> Send Request
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
};