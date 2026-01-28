import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, MapPin, Loader2, Navigation, AlertTriangle, CheckCircle2, ScanFace, RefreshCw } from 'lucide-react';
import { Button } from './FormElements';
import { TrainingSession } from '../types';

interface SessionVerificationModalProps {
  isOpen: boolean;
  session: TrainingSession;
  onClose: () => void;
  onSuccess: (data: { selfieUrl: string; venuePhotoUrl: string; location: { lat: number, lng: number } }) => void;
}

type Step = 'LIVENESS_INIT' | 'LIVENESS_ACTION' | 'VERIFYING' | 'SELFIE_SUCCESS' | 'VENUE_CAMERA' | 'LOCATION_CHECK' | 'WARNING' | 'SUCCESS' | 'ERROR';

const LIVENESS_ACTIONS = [
  "Blink your eyes twice",
  "Turn your head slightly to the left",
  "Turn your head slightly to the right",
  "Smile for the camera",
  "Nod your head"
];

// Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const SessionVerificationModal: React.FC<SessionVerificationModalProps> = ({ 
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
  
  // Data
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [venueData, setVenueData] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelfieData(null);
      setVenueData(null);
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
      
      // Flow logic based on camera mode
      if (facingMode === 'user') {
        setStep('LIVENESS_INIT');
        timeoutRef.current = setTimeout(() => {
            setStep('LIVENESS_ACTION');
            setLivenessAction(LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)]);
            simulateLivenessCheck();
        }, 2000);
      } else {
        setStep('VENUE_CAMERA');
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

  const captureSelfie = () => {
    const photo = takePicture();
    if (photo) {
        setSelfieData(photo);
        setStep('SELFIE_SUCCESS');
        // Auto transition to Venue Camera
        setTimeout(() => {
            startCamera('environment');
        }, 1500);
    }
  };

  const captureVenue = () => {
    const photo = takePicture();
    if (photo) {
        setVenueData(photo);
        // Stop camera before location check
        if (stream) stream.getTracks().forEach(t => t.stop());
        setStream(null);
        setStep('LOCATION_CHECK');
        checkLocation(photo);
    }
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

  const checkLocation = async (currentVenuePhoto: string) => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      setUserCoords(coords);

      // Bypass for mock/online sessions
      if (session.locationCoords.lat === 0 && session.locationCoords.lng === 0) {
        finalizeSuccess(currentVenuePhoto, coords);
        return;
      }

      const dist = calculateDistance(coords.lat, coords.lng, session.locationCoords.lat, session.locationCoords.lng);
      setDistance(Math.round(dist));

      if (dist > 200) {
        setStep('WARNING');
      } else {
        finalizeSuccess(currentVenuePhoto, coords);
      }
    } catch (err) {
      setStep('ERROR');
      setErrorMsg("Failed to retrieve location.");
    }
  };

  const finalizeSuccess = (vPhoto: string, coords: {lat: number, lng: number}) => {
    setStep('SUCCESS');
    setTimeout(() => {
      onSuccess({ 
        selfieUrl: selfieData!, 
        venuePhotoUrl: vPhoto, 
        location: coords 
      });
    }, 1500);
  };

  const handleForceProceed = () => {
    if (selfieData && venueData && userCoords) {
      finalizeSuccess(venueData, userCoords);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[500px]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900 z-50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Start Session
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-black flex flex-col w-full">
          
          {/* Liveness & Selfie Steps */}
          {(['LIVENESS_INIT', 'LIVENESS_ACTION', 'VERIFYING', 'SELFIE_SUCCESS'].includes(step)) && (
             <div className="flex-1 relative w-full h-full">
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
                      <p className="text-slate-400 text-sm mt-1">Switching to rear camera...</p>
                   </div>
                ) : (
                    isVideoReady && (
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
                    )
                )}
             </div>
          )}

          {/* Venue Camera Step */}
          {step === 'VENUE_CAMERA' && (
             <div className="flex-1 relative w-full h-full">
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
                    <button onClick={captureVenue} disabled={!isVideoReady} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 transition-transform">
                      <div className="w-12 h-12 rounded-full bg-white"></div>
                    </button>
                </div>
                <div className="absolute top-4 left-0 right-0 text-center z-20">
                     <p className="text-white bg-black/50 inline-block px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                       Capture Venue Photo
                     </p>
                </div>
             </div>
          )}

          {/* Post-Capture Steps */}
          {step === 'LOCATION_CHECK' && (
             <div className="bg-white w-full h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-slate-500 font-medium">Verifying GPS Location...</p>
             </div>
          )}

          {step === 'WARNING' && (
             <div className="bg-white w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center animate-bounce">
                  <AlertTriangle className="w-10 h-10 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Location Mismatch</h4>
                  <p className="text-slate-600 text-sm">You are <strong>{distance}m</strong> away from the venue.</p>
                </div>
                <div className="w-full space-y-3">
                  <Button variant="danger" onClick={handleForceProceed}>Start Anyway</Button>
                  <Button variant="outline" onClick={onClose}>Cancel</Button>
                </div>
             </div>
          )}

          {step === 'SUCCESS' && (
             <div className="bg-white w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-50">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Session Started!</h4>
                <p className="text-slate-500 text-sm">Identity, Location & Venue Verified.</p>
             </div>
          )}

          {step === 'ERROR' && (
             <div className="bg-white w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <p className="text-slate-700">{errorMsg}</p>
                <Button onClick={() => startCamera('user')} variant="outline">Try Again</Button>
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