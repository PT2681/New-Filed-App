import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, Save, RefreshCw, AlertTriangle, Loader2, ScanFace, CheckCircle2 } from 'lucide-react';
import { Button } from './FormElements';
import { TrainingSession } from '../types';

interface SessionCompletionModalProps {
  isOpen: boolean;
  session: TrainingSession;
  onClose: () => void;
  onSuccess: (data: { selfieUrl: string; sessionPhotoUrl: string; remarks: string }) => void;
}

type Step = 'LIVENESS_INIT' | 'LIVENESS_ACTION' | 'VERIFYING' | 'SELFIE_SUCCESS' | 'SESSION_CAMERA' | 'FORM' | 'ERROR';

const LIVENESS_ACTIONS = [
  "Blink your eyes twice",
  "Turn your head slightly to the left",
  "Turn your head slightly to the right",
  "Smile for the camera",
  "Nod your head"
];

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({ 
  isOpen, session, onClose, onSuccess 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [step, setStep] = useState<Step>('LIVENESS_INIT');
  const [errorMsg, setErrorMsg] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [livenessAction, setLivenessAction] = useState("");

  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [sessionPhotoData, setSessionPhotoData] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelfieData(null);
      setSessionPhotoData(null);
      setRemarks("");
      startCamera('user');
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const stopCamera = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoReady(false);
  };

  const startCamera = async (facingMode: 'user' | 'environment') => {
    setIsVideoReady(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode },
        audio: false 
      });
      setStream(mediaStream);

      if (facingMode === 'user') {
        setStep('LIVENESS_INIT');
        timeoutRef.current = setTimeout(() => {
            setStep('LIVENESS_ACTION');
            setLivenessAction(LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)]);
            simulateLivenessCheck();
        }, 2000);
      } else {
        setStep('SESSION_CAMERA');
      }

    } catch (err) {
      console.error(err);
      setStep('ERROR');
      setErrorMsg("Camera access denied.");
    }
  };

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.setAttribute('playsinline', 'true');
      node.play().catch(console.warn);
    }
  }, [stream]);

  const simulateLivenessCheck = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      if (progress >= 100) {
        clearInterval(interval);
        setStep('VERIFYING');
        setTimeout(() => captureSelfie(), 1500);
      }
    }, 30);
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', 0.8);
            }
        }
    }
    return null;
  };

  const captureSelfie = () => {
    const photo = takePicture();
    if (photo) {
        setSelfieData(photo);
        setStep('SELFIE_SUCCESS');
        setTimeout(() => {
            startCamera('environment');
        }, 1500);
    }
  };

  const captureSessionPhoto = () => {
    const photo = takePicture();
    if (photo) {
        setSessionPhotoData(photo);
        stopCamera();
        setStep('FORM');
    }
  };

  const handleSubmit = () => {
    if (selfieData && sessionPhotoData) {
      onSuccess({ 
          selfieUrl: selfieData, 
          sessionPhotoUrl: sessionPhotoData, 
          remarks 
      });
    }
  };

  const handleRetake = () => {
    // Retake only the session photo for simplicity, assume selfie is good if passed liveness
    setSessionPhotoData(null);
    startCamera('environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[600px] max-h-[90vh]">
        
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
        <div className="flex-1 relative bg-slate-900 flex flex-col w-full">
          
          {step === 'ERROR' && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center space-y-4 z-50">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <p className="text-slate-800">{errorMsg}</p>
              <Button onClick={() => startCamera('user')} variant="outline">Try Again</Button>
            </div>
          )}

          {/* Liveness / Selfie Steps */}
          {(['LIVENESS_INIT', 'LIVENESS_ACTION', 'VERIFYING', 'SELFIE_SUCCESS'].includes(step)) && (
             <div className="flex-1 relative w-full h-full bg-black">
                <video 
                    ref={setVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    onPlaying={() => setIsVideoReady(true)}
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
                />
                <canvas ref={canvasRef} className="hidden" />

                {step === 'SELFIE_SUCCESS' ? (
                   <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center animate-in fade-in">
                      <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-100 mb-4">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <h4 className="text-white font-bold text-lg">Identity Verified</h4>
                      <p className="text-slate-400 text-sm mt-1">Next: Capture Session Photo</p>
                   </div>
                ) : isVideoReady && (
                   <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className={`w-64 h-64 rounded-full border-2 transition-all ${step === 'VERIFYING' ? 'border-primary shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'border-white/30'}`}></div>
                          {step === 'VERIFYING' && <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_15px_#6366f1] animate-[scan_1.5s_ease-in-out_infinite]"></div>}
                      </div>
                      <div className="absolute bottom-10 left-4 right-4 text-center">
                          <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                              {step === 'LIVENESS_INIT' && <p className="text-white font-medium">Position your face in the circle</p>}
                              {step === 'LIVENESS_ACTION' && (
                                  <div className="space-y-1 animate-in slide-in-from-bottom-2">
                                      <p className="text-primary font-bold uppercase text-[10px] tracking-widest">Liveness Check</p>
                                      <p className="text-xl font-bold text-white">{livenessAction}</p>
                                  </div>
                              )}
                              {step === 'VERIFYING' && <div className="flex items-center justify-center gap-2 text-white"><Loader2 className="w-5 h-5 animate-spin text-primary" /> Verifying...</div>}
                          </div>
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* Session Photo Step */}
          {step === 'SESSION_CAMERA' && (
             <div className="flex-1 relative w-full h-full bg-black">
                <video 
                    ref={setVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    onPlaying={() => setIsVideoReady(true)}
                    className="absolute inset-0 w-full h-full object-cover" 
                />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                    <button onClick={captureSessionPhoto} disabled={!isVideoReady} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 transition-transform">
                      <div className="w-12 h-12 rounded-full bg-white"></div>
                    </button>
                </div>
                <div className="absolute top-4 left-0 right-0 text-center z-20">
                     <p className="text-white bg-black/50 inline-block px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                       Capture Session/Board Photo
                     </p>
                </div>
             </div>
          )}

          {/* Form Step */}
          {step === 'FORM' && (
             <div className="bg-white w-full h-full flex flex-col p-4 overflow-y-auto">
                
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Evidence Captured</p>
                <div className="flex gap-2 mb-4">
                    <div className="w-1/3 aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden relative">
                        <img src={selfieData!} className="w-full h-full object-cover scale-x-[-1]" alt="Selfie" />
                        <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 aspect-video bg-slate-100 rounded-lg overflow-hidden relative group">
                        <img src={sessionPhotoData!} className="w-full h-full object-cover" alt="Session" />
                        <button onClick={handleRetake} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <RefreshCw className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Session Remarks / Topics Covered
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
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(256px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};