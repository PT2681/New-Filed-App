import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './FormElements';
import { TrainingSession } from '../types';

interface SessionCompletionModalProps {
  isOpen: boolean;
  session: TrainingSession;
  onClose: () => void;
  onSuccess: (data: { photoUrl: string; remarks: string }) => void;
}

type Step = 'CAMERA' | 'FORM' | 'ERROR';

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({ 
  isOpen, session, onClose, onSuccess 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>('CAMERA');
  const [errorMsg, setErrorMsg] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setRemarks("");
      setPhotoData(null);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    setStep('CAMERA');
    setErrorMsg("");
    try {
      // Relaxed constraints for mobile compatibility
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error(err);
      setStep('ERROR');
      setErrorMsg("Camera access denied or unavailable.");
    }
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
        const data = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoData(data);
        stopCamera();
        setStep('FORM');
      }
    }
  };

  const handleSubmit = () => {
    if (photoData) {
      onSuccess({ photoUrl: photoData, remarks });
    }
  };

  const handleRetake = () => {
    setPhotoData(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            End Session
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-slate-900 flex flex-col items-center justify-center min-h-[400px]">
          
          {step === 'ERROR' && (
            <div className="text-center p-6 space-y-4 bg-white w-full h-full flex flex-col justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-slate-800 font-medium">{errorMsg}</p>
              <Button variant="outline" onClick={startCamera}>Try Again</Button>
            </div>
          )}

          {step === 'CAMERA' && (
            <div className="relative w-full h-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                <button 
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-white"></div>
                </button>
              </div>
              <div className="absolute top-4 left-0 right-0 text-center z-20">
                 <p className="text-white bg-black/50 inline-block px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                   Take a photo to end session
                 </p>
              </div>
            </div>
          )}

          {step === 'FORM' && photoData && (
             <div className="bg-white w-full h-full flex flex-col p-4 overflow-y-auto">
                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100 mb-4 shrink-0">
                  <img src={photoData} alt="Session End" className="w-full h-full object-cover" />
                  <button 
                    onClick={handleRetake}
                    className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Write about the session: List of Topics Covered and other details
                  </label>
                  <textarea
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    placeholder="E.g., Covered safety protocols, demonstrated PPE usage..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  ></textarea>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                   <Button onClick={handleSubmit} disabled={!remarks.trim()}>
                     Submit & End Session
                   </Button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};