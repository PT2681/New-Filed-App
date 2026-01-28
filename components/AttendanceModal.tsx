import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, MapPin, Loader2, ScanFace, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from './FormElements';

interface AttendanceModalProps {
  isOpen: boolean;
  mode: 'IN' | 'OUT';
  onClose: () => void;
  onSuccess: (data: { photoUrl: string; location: string; weather: string; coordinates: { lat: number; lng: number } }) => void;
}

type Step = 'PERMISSION' | 'CAMERA_INIT' | 'LIVENESS' | 'VERIFYING' | 'SUCCESS' | 'ERROR';

const LIVENESS_ACTIONS = [
  "Blink your eyes twice",
  "Turn your head slightly to the left",
  "Turn your head slightly to the right",
  "Smile for the camera",
  "Nod your head"
];

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, mode, onClose, onSuccess }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [step, setStep] = useState<Step>('PERMISSION');
  const [currentAction, setCurrentAction] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Initialize/Cleanup when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFacingMode('user'); // Default to front camera
      startProcess('user');
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // Attach stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      // Critical for mobile browsers:
      videoRef.current.setAttribute('playsinline', 'true'); 
      videoRef.current.play().catch(e => console.warn("Auto-play failed:", e));
    }
  }, [stream]);

  const stopCamera = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStep('PERMISSION');
    setIsVideoReady(false);
  };

  const startProcess = async (targetMode: 'user' | 'environment' = facingMode) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setStep('CAMERA_INIT');
    setErrorMsg("");
    setIsVideoReady(false);
    
    try {
      // Simplified constraints to avoid "OverconstrainedError" which can sometimes cause issues on specific devices
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: targetMode },
        audio: false 
      });
      
      setStream(mediaStream); 

      // Wait a bit before starting liveness check to give user time to position themselves
      timeoutRef.current = setTimeout(() => {
        setStep('LIVENESS');
        setCurrentAction(LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)]);
        simulateLivenessCheck();
      }, 2000);

    } catch (err: any) {
      console.error("Camera Error:", err);
      setStep('ERROR');
      if (err.name === 'NotAllowedError') {
        setErrorMsg("Permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setErrorMsg("No camera device found.");
      } else if (err.name === 'NotReadableError') {
        setErrorMsg("Camera is currently in use by another app.");
      } else {
        setErrorMsg(`Camera error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startProcess(newMode);
  };

  const handleVideoPlaying = () => {
    setIsVideoReady(true);
  };

  const simulateLivenessCheck = () => {
    // Simulate user performing action and system verifying
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      if (progress >= 100) {
        clearInterval(interval);
        setStep('VERIFYING');
        processVerification();
      }
    }, 30); // ~3 seconds total
  };

  const processVerification = async () => {
    try {
      // 1. Capture Photo
      let photoUrl = "";
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Ensure valid dimensions
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              photoUrl = canvas.toDataURL('image/jpeg', 0.8);
            }
        }
      }

      // 2. Get Geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      // 3. Mock Reverse Geocode & Weather
      const mockLocations = ["Sector 4, Tech Park", "Downtown Avenue", "Industrial Zone B", "Main Street, North"];
      const mockWeathers = ["Sunny, 28°C", "Cloudy, 24°C", "Rainy, 22°C", "Clear, 30°C"];
      
      const location = mockLocations[Math.floor(Math.random() * mockLocations.length)];
      const weather = mockWeathers[Math.floor(Math.random() * mockWeathers.length)];

      setTimeout(() => {
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess({
            photoUrl,
            location,
            weather,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
        }, 1000);
      }, 1500); 

    } catch (err) {
      console.error(err);
      setStep('ERROR');
      setErrorMsg("Failed to retrieve location. Please enable GPS.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 z-50 bg-slate-900">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-primary" />
            {mode === 'IN' ? 'Punch In Verification' : 'Punch Out Verification'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-black flex flex-col min-h-[400px]">
          
          {step === 'ERROR' ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 z-40 bg-slate-900">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-white font-medium text-sm px-4">{errorMsg}</p>
              <Button variant="outline" onClick={() => startProcess()} className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
            </div>
          ) : step === 'SUCCESS' ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 z-40 bg-slate-900 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto border-2 border-green-500">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h4 className="text-xl font-bold text-white">Verified!</h4>
              <p className="text-slate-400 text-sm">Attendance logged successfully.</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex-1">
              
              {/* Video Element - Absolute to fill container */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                onPlaying={handleVideoPlaying}
                onLoadedMetadata={() => videoRef.current?.play()}
                className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} 
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Loading Overlay - Visible only when video is NOT ready */}
              {!isVideoReady && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900">
                   <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                   <p className="text-slate-400 text-sm">Accessing Camera...</p>
                </div>
              )}

              {/* Camera Switch Button - Visible only when video IS ready */}
              {isVideoReady && step !== 'VERIFYING' && (
                <button 
                  onClick={toggleCamera}
                  className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-all active:scale-95 border border-white/10"
                  title="Switch Camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}

              {/* Liveness/Tech Overlay - Visible only when video IS ready */}
              {isVideoReady && (step === 'LIVENESS' || step === 'VERIFYING') && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="w-64 h-64 border-2 border-primary/50 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-pulse"></div>
                  <div className="w-60 h-60 border border-white/20 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                  
                  {/* Scanning Line */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-primary/80 shadow-[0_0_15px_#6366f1] animate-[scan_2s_ease-in-out_infinite]"></div>
                  
                  {/* Tech Corners */}
                  <div className="absolute top-[20%] left-[15%] w-8 h-8 border-t-2 border-l-2 border-primary/60"></div>
                  <div className="absolute top-[20%] right-[15%] w-8 h-8 border-t-2 border-r-2 border-primary/60"></div>
                  <div className="absolute bottom-[20%] left-[15%] w-8 h-8 border-b-2 border-l-2 border-primary/60"></div>
                  <div className="absolute bottom-[20%] right-[15%] w-8 h-8 border-b-2 border-r-2 border-primary/60"></div>
                </div>
              )}

              {/* Instructions Overlay */}
              <div className="absolute bottom-8 left-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 z-20 text-center transition-all duration-300">
                {step === 'CAMERA_INIT' && (
                   <p className="text-slate-300 font-medium text-sm animate-pulse">Starting camera...</p>
                )}
                {step === 'LIVENESS' && (
                  <div className="space-y-1 animate-in slide-in-from-bottom-2">
                    <p className="text-primary font-bold uppercase tracking-wider text-xs">Liveness Check</p>
                    <p className="text-white font-medium text-lg">{currentAction}</p>
                  </div>
                )}
                {step === 'VERIFYING' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold uppercase tracking-wider text-xs mb-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Verifying
                    </div>
                    <p className="text-white font-medium text-sm">Matching 3D Face Mesh...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translate(-50%, -120px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { transform: translate(-50%, 120px); }
        }
      `}</style>
    </div>
  );
};