
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, MapPin, Loader2, AlertTriangle, Building2, Undo2, Flag, ScanFace, CheckCircle2, Save } from 'lucide-react';
import { Button, Input } from './FormElements';
import { Tour, TourPhase, Site } from '../types';
import { MOCK_SITES } from '../constants';

interface TourEndModalProps {
  isOpen: boolean;
  tour: Tour;
  phase: TourPhase; // Current phase BEFORE action
  onClose: () => void;
  onSuccess: (data: { selfieUrl: string, location: any, newSite?: Site }) => void;
}

type Step = 'LOCATION' | 'DEFINE_SITE' | 'LIVENESS_INIT' | 'LIVENESS_ACTION' | 'VERIFYING' | 'CAPTURED' | 'ERROR';

const LIVENESS_ACTIONS = [
  "Blink your eyes twice",
  "Turn your head slightly to the left",
  "Turn your head slightly to the right",
  "Smile for the camera",
  "Nod your head"
];

// Reuse logic from SessionVerification for distance (simplified here)
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

export const TourEndModal: React.FC<TourEndModalProps> = ({ 
  isOpen, tour, phase, onClose, onSuccess 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [step, setStep] = useState<Step>('LOCATION');
  const [distance, setDistance] = useState(0);
  const [coords, setCoords] = useState<any>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [livenessAction, setLivenessAction] = useState("");

  // New Site Data
  const [siteName, setSiteName] = useState("");
  const [siteCategory, setSiteCategory] = useState("Client Site");
  const [isNewSiteFlow, setIsNewSiteFlow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('LOCATION');
      checkLocation();
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

  const getActionTitle = () => {
    if (phase === 'OUTWARD') return "Verify Arrival";
    if (phase === 'ON_SITE') return "Start Return Journey";
    return "End Trip";
  };

  const checkLocation = async () => {
    try {
       const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const current = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(current);

      // Check if we need to define site
      // Condition: Outward journey ends AND (no coordinates OR user flagged as unknown/new)
      if (phase === 'OUTWARD' && (!tour.toCoordinates || !tour.toCoordinates.lat)) {
        setIsNewSiteFlow(true);
        setStep('DEFINE_SITE');
        return;
      }

      const targetLat = phase === 'RETURN' ? current.lat : (tour.toCoordinates?.lat || current.lat);
      const targetLng = phase === 'RETURN' ? current.lng : (tour.toCoordinates?.lng || current.lng);

      const dist = calculateDistance(current.lat, current.lng, targetLat, targetLng);
      setDistance(Math.round(dist));

      // Proceed regardless of distance for demo
      setTimeout(() => {
          startCamera();
      }, 1000);

    } catch (e) {
      setStep('ERROR');
    }
  };

  const startCamera = async () => {
    setStep('LIVENESS_INIT');
    try {
      if (stream) stream.getTracks().forEach(t => t.stop());
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
      });
      setStream(mediaStream);

      // Start Liveness sequence
      timeoutRef.current = setTimeout(() => {
          setStep('LIVENESS_ACTION');
          setLivenessAction(LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)]);
          simulateLivenessCheck();
      }, 2000);

    } catch (e) { console.error(e); setStep('ERROR'); }
  };

  const simulateLivenessCheck = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      if (progress >= 100) {
        clearInterval(interval);
        setStep('VERIFYING');
        setTimeout(() => capturePhoto(), 1500);
      }
    }, 30);
  };

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.setAttribute('playsinline', 'true');
      node.play().catch(console.warn);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const data = canvas.toDataURL('image/jpeg');
                setSelfie(data);
                setStep('CAPTURED');
            }
        }
    }
  };

  const handleDefineSiteNext = () => {
    if (siteName) {
      startCamera();
    }
  };

  const handleFinalSubmit = () => {
      if (selfie && coords) {
          let newSite: Site | undefined = undefined;
          
          if (isNewSiteFlow && siteName) {
            newSite = {
              id: `S-${Date.now()}`,
              name: siteName,
              category: siteCategory,
              coordinates: coords
            };
            
            // Persist new site to storage for future use
            const storedSites = localStorage.getItem('known_sites');
            const currentSites = storedSites ? JSON.parse(storedSites) : MOCK_SITES;
            const updatedSites = [newSite, ...currentSites];
            localStorage.setItem('known_sites', JSON.stringify(updatedSites));
          }

          onSuccess({ 
            selfieUrl: selfie, 
            location: coords,
            newSite 
          });
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
       <div className="w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[500px]">
          
          {/* Close Button - Visible unless capturing */}
          <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/20 rounded-full text-white hover:bg-black/40">
             <X className="w-5 h-5" />
          </button>

          {/* Location Loading */}
          {step === 'LOCATION' && (
             <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <h3 className="font-bold text-lg">{getActionTitle()}</h3>
                <p className="text-sm text-slate-500">Verifying GPS Location...</p>
             </div>
          )}

          {/* New Site Definition Step */}
          {step === 'DEFINE_SITE' && (
            <div className="absolute inset-0 bg-white flex flex-col p-6 space-y-4">
               <div className="text-center mb-2">
                 <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <MapPin className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-bold text-xl text-slate-900">New Location Detected</h3>
                 <p className="text-sm text-slate-500 mt-1">
                   You are arriving at a new site. Please save details for future visits.
                 </p>
               </div>
               
               <div className="space-y-4 flex-1">
                 <Input 
                   label="Site Name"
                   placeholder="e.g. Sector 45 Tower A"
                   value={siteName}
                   onChange={(e) => setSiteName(e.target.value)}
                   autoFocus
                 />
                 
                 <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-700 ml-1">Category</label>
                   <div className="grid grid-cols-2 gap-2">
                     {['Client Site', 'Office', 'Warehouse', 'Field'].map(cat => (
                       <button
                         key={cat}
                         onClick={() => setSiteCategory(cat)}
                         className={`py-2 px-2 text-xs font-semibold rounded-lg border ${
                           siteCategory === cat 
                             ? 'bg-primary text-white border-primary' 
                             : 'bg-white text-slate-600 border-slate-200'
                         }`}
                       >
                         {cat}
                       </button>
                     ))}
                   </div>
                 </div>
               </div>

               <Button disabled={!siteName} onClick={handleDefineSiteNext}>
                 Save & Verify Arrival
               </Button>
            </div>
          )}

          {/* Camera / Liveness Flow - Using flex-1 layout instead of absolute inset-0 overlay */}
          {(step === 'LIVENESS_INIT' || step === 'LIVENESS_ACTION' || step === 'VERIFYING') && (
              <div className="flex-1 relative bg-black w-full">
                 <video 
                     ref={setVideoRef} 
                     autoPlay 
                     playsInline 
                     muted 
                     onPlaying={() => setIsVideoReady(true)}
                     className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
                 />
                 <canvas ref={canvasRef} className="hidden" />

                 {/* Overlays */}
                 {isVideoReady && (
                   <div className="absolute inset-0 pointer-events-none">
                      {/* Face Circle */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className={`w-64 h-64 rounded-full border-2 transition-all ${step === 'VERIFYING' ? 'border-primary shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'border-white/30'}`}></div>
                           {step === 'VERIFYING' && (
                               <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_15px_#6366f1] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                           )}
                      </div>

                      {/* Instructions */}
                      <div className="absolute bottom-10 left-4 right-4 text-center">
                          <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                              {step === 'LIVENESS_INIT' && <p className="text-white font-medium">Position your face in the circle</p>}
                              {step === 'LIVENESS_ACTION' && (
                                  <div className="space-y-1 animate-in slide-in-from-bottom-2">
                                      <p className="text-primary font-bold uppercase text-[10px] tracking-widest">Liveness Check</p>
                                      <p className="text-xl font-bold text-white">{livenessAction}</p>
                                  </div>
                              )}
                              {step === 'VERIFYING' && (
                                  <div className="flex items-center justify-center gap-2 text-white">
                                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                      <span className="font-medium">Verifying Identity...</span>
                                  </div>
                              )}
                          </div>
                      </div>
                   </div>
                 )}
              </div>
          )}

          {/* Captured Success */}
          {step === 'CAPTURED' && selfie && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in zoom-in-95">
                 <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                     <img src={selfie} className="w-full h-full object-cover scale-x-[-1]" alt="Verified" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500" /> Verified
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {isNewSiteFlow 
                        ? "Site Saved. Identity Confirmed." 
                        : "Location and Identity Confirmed."}
                    </p>
                 </div>
                 <Button onClick={handleFinalSubmit}>
                   {isNewSiteFlow ? "Confirm New Site" : "Confirm & Proceed"}
                 </Button>
              </div>
          )}

          {step === 'ERROR' && (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center space-y-4">
                 <AlertTriangle className="w-10 h-10 text-red-500" />
                 <p className="text-slate-700">Unable to verify location or camera.</p>
                 <Button onClick={onClose} variant="outline">Close</Button>
              </div>
          )}
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
