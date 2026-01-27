import React, { useState, useRef } from 'react';
import { X, Calculator, Plus, Trash2, Receipt, Camera, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button, Input } from './FormElements';
import { Tour } from '../types';

interface ExpenseClaimModalProps {
  isOpen: boolean;
  tour: Tour;
  onClose: () => void;
  onSuccess: (totalAmount: number, breakdown: any) => void;
}

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  description: string;
  receiptUrl: string | null;
}

type Step = 'TRAVEL_CALC' | 'ADD_EXPENSES' | 'SUMMARY';

// Rates Configuration (Currency: ₹)
const RATES = {
  Bike: 8, // ₹8 per KM
  Car: 15, // ₹15 per KM
};

export const ExpenseClaimModal: React.FC<ExpenseClaimModalProps> = ({ 
  isOpen, tour, onClose, onSuccess 
}) => {
  const [step, setStep] = useState<Step>('TRAVEL_CALC');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  
  // Form State for new expense
  const [newExpCategory, setNewExpCategory] = useState("Food");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpPhoto, setNewExpPhoto] = useState<string | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Calculation Logic
  const distance = tour.distanceCovered || 0;
  const mode = tour.transportMode || 'Bike';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rate = (RATES as any)[mode] || 0;
  // If pool passenger, no travel allowance usually, but let's stick to mode logic or 0 if undefined
  const travelAmount = tour.poolRole === 'Passenger' ? 0 : (distance * rate);
  
  const totalReceipts = expenses.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = travelAmount + totalReceipts;

  const handleAddExpense = () => {
    if (!newExpAmount) return;
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      category: newExpCategory,
      amount: parseFloat(newExpAmount),
      description: newExpDesc,
      receiptUrl: newExpPhoto
    };
    setExpenses([newItem, ...expenses]);
    
    // Reset form
    setNewExpAmount("");
    setNewExpDesc("");
    setNewExpPhoto(null);
    setIsAddingExpense(false);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // Camera Logic for Receipts
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) { console.error(e); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg');
        setNewExpPhoto(data);
        
        // Stop Stream
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        setIsCameraOpen(false);
      }
    }
  };

  const handleSubmit = () => {
    onSuccess(grandTotal, {
      travel: { distance, rate, amount: travelAmount },
      expenses
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            {step !== 'TRAVEL_CALC' && (
              <button onClick={() => setStep(step === 'SUMMARY' ? 'ADD_EXPENSES' : 'TRAVEL_CALC')} className="p-1 -ml-2 rounded-full hover:bg-slate-100">
                <ArrowLeft className="w-5 h-5 text-slate-500" />
              </button>
            )}
            <h3 className="font-bold text-slate-900">Claim Expenses</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          
          {/* STEP 1: TRAVEL CALCULATION */}
          {step === 'TRAVEL_CALC' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Calculator className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-slate-900">Travel Allowance</h4>
                <p className="text-xs text-slate-500 mb-4">Calculated based on distance & mode</p>
                
                <div className="grid grid-cols-2 gap-4 text-left bg-slate-50 p-3 rounded-xl mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Distance</p>
                    <p className="font-semibold text-slate-800">{distance} KM</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Mode</p>
                    <p className="font-semibold text-slate-800">{mode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Rate</p>
                    <p className="font-semibold text-slate-800">{rate > 0 ? `₹${rate}/km` : 'N/A'}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 uppercase font-bold">Total</p>
                     <p className="font-bold text-primary">₹{travelAmount}</p>
                  </div>
                </div>

                {tour.poolRole === 'Passenger' && (
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                    Pool passengers are not eligible for travel allowance.
                  </p>
                )}
              </div>

              <Button onClick={() => setStep('ADD_EXPENSES')}>
                Add Other Expenses <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: ADD RECEIPT EXPENSES */}
          {step === 'ADD_EXPENSES' && (
            <div className="space-y-4 h-full flex flex-col">
              {!isAddingExpense && !isCameraOpen && (
                <>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">Additional Expenses</h4>
                    <span className="text-xs font-semibold text-slate-500">Total: ₹{totalReceipts}</span>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No extra expenses added.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {expenses.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              {item.receiptUrl ? (
                                <img src={item.receiptUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                  <Receipt className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-sm text-slate-900">{item.category}</p>
                                <p className="text-xs text-slate-500">{item.description || 'No details'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className="font-bold text-slate-900">₹{item.amount}</span>
                             <button onClick={() => removeExpense(item.id)} className="text-red-400 hover:text-red-600">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={() => setIsAddingExpense(true)}
                    className="w-full py-3 border-2 border-dashed border-primary/30 text-primary font-semibold rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add Expense
                  </button>

                  <div className="mt-auto pt-4">
                     <Button onClick={() => setStep('SUMMARY')}>
                       Review Claim <ChevronRight className="w-4 h-4" />
                     </Button>
                  </div>
                </>
              )}

              {/* Add Expense Form */}
              {isAddingExpense && !isCameraOpen && (
                <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 space-y-4 animate-in slide-in-from-bottom-10">
                   <h4 className="font-bold text-slate-900">New Expense</h4>
                   
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                     <div className="flex gap-2 mt-1 overflow-x-auto pb-2 no-scrollbar">
                       {['Food', 'Lodge', 'Toll', 'Parking', 'Misc'].map(cat => (
                         <button 
                           key={cat}
                           onClick={() => setNewExpCategory(cat)}
                           className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${newExpCategory === cat ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                         >
                           {cat}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="flex gap-3">
                     <div className="flex-1">
                        <Input 
                          label="Amount (₹)"
                          type="number" 
                          placeholder="0.00" 
                          value={newExpAmount}
                          onChange={(e) => setNewExpAmount(e.target.value)}
                          autoFocus
                        />
                     </div>
                     <div className="w-1/3">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Receipt</label>
                        <button 
                          onClick={startCamera}
                          className={`w-full h-[50px] rounded-xl border flex items-center justify-center ${newExpPhoto ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
                        >
                          {newExpPhoto ? <CheckCircle2 className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                        </button>
                     </div>
                   </div>

                   <Input 
                     label="Description (Optional)"
                     placeholder="e.g. Lunch at Highway Inn"
                     value={newExpDesc}
                     onChange={(e) => setNewExpDesc(e.target.value)}
                   />

                   <div className="flex gap-2 pt-2">
                     <Button variant="outline" onClick={() => setIsAddingExpense(false)}>Cancel</Button>
                     <Button onClick={handleAddExpense} disabled={!newExpAmount}>Add</Button>
                   </div>
                </div>
              )}

              {/* Camera View */}
              {isCameraOpen && (
                <div className="absolute inset-0 bg-black z-50 flex flex-col">
                   <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                   <canvas ref={canvasRef} className="hidden" />
                   <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur-sm absolute bottom-0 w-full">
                     <button onClick={() => setIsCameraOpen(false)} className="text-white p-2">Cancel</button>
                     <button 
                        onClick={capturePhoto} 
                        className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center"
                     >
                       <div className="w-12 h-12 bg-white rounded-full"></div>
                     </button>
                     <div className="w-10"></div>
                   </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SUMMARY */}
          {step === 'SUMMARY' && (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                 <p className="text-sm text-slate-500 font-medium">Total Claim Amount</p>
                 <h2 className="text-4xl font-bold text-slate-900 mt-2">₹{grandTotal.toFixed(2)}</h2>
               </div>

               <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-600">Travel Allowance</span>
                   <span className="font-semibold text-slate-900">₹{travelAmount}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-600">Additional Expenses ({expenses.length})</span>
                   <span className="font-semibold text-slate-900">₹{totalReceipts}</span>
                 </div>
                 <div className="h-px bg-slate-200 my-2"></div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="font-bold text-slate-700">Grand Total</span>
                   <span className="font-bold text-primary">₹{grandTotal}</span>
                 </div>
               </div>

               <div className="bg-blue-50 p-3 rounded-xl flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    By submitting, I certify that the expenses claimed are actual and incurred for business purposes.
                  </p>
               </div>

               <Button onClick={handleSubmit}>
                 Submit Claim
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};