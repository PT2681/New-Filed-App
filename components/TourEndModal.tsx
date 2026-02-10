
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, MapPin, Loader2, AlertTriangle, Building2, Undo2, Flag, ScanFace, CheckCircle2, Save, ArrowRight, Search, PlusCircle, Home, RefreshCw } from 'lucide-react';
import { Button, Input } from './FormElements';
import { Tour, TourPhase, Site } from '../types';
import { MOCK_SITES } from '../constants';

interface TourEndModalProps {
  isOpen: boolean;
  tour: Tour;
  phase: TourPhase; // Current phase BEFORE action
  onClose: () => void;
  onSuccess: (data: { 
    selfieUrl: string, 
    location: any, 
    newSite?: Site,
    nextAction?: 'RETURN' | 'NEXT_SITE',
    nextSiteDetails?: { name: string, coordinates: { lat: number, lng: number } | null }
  }) => void;
}

type Step = 'DESTINATION_CHOICE' | 'SELECT_SITE' | 'LOCATION' | 'DEFINE_SITE' | 'LIVENESS_INIT' | 'LIVENESS_ACTION' | 'VERIFYING' | 'CAPTURED' | 'ERROR';

const LIVENESS_ACTIONS = [
  "Blink your eyes twice",
  "Turn your head slightly to the left",
  "Turn your head slightly to the right",
  "Smile for the camera",
  "Nod your head"
];

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
  const [errorMsg, setErrorMsg] = useState("");

  // New Site Data (Arrival)
  const [siteName, setSiteName] = useState("");
  const [siteCategory, setSiteCategory] = useState("Client Site");
  const [isNewSiteFlow, setIsNewSiteFlow] = useState(false);

  // Next Destination Data (Departure)
  const [nextAction, setNextAction] = useState<'RETURN' | 'NEXT_SITE'>('RETURN');
  const [siteSearch, setSiteSearch] = useState("");
  const [knownSites, setKnownSites] = useState<Site[]>([]);
  const [selectedNextSite, setSelectedNextSite] = useState<{name: string, coordinates: {lat: number, lng: number} | null} | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (phase === 'ON_SITE') {
        setStep('DESTINATION_CHOICE');
        const storedSites = localStorage.getItem('known_sites');
        const sites = storedSites ? JSON.parse(storedSites) : MOCK_SITES;
        setKnownSites(sites);
      } else {
        setStep('LOCATION');
        checkLocation();
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, phase]);

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
    if (phase === 'ON_SITE') return "Departure Verification";
    return "End Trip";
  };

  const handleReturnToBase = () => {
    setNextAction('RETURN');
    setStep('LOCATION');
    checkLocation();
  };

  const handleGoToNextSite = () => {
    setNextAction('NEXT_SITE');
    setStep('SELECT_SITE');
  };

  const handleNextSiteSelect = (site: Site) => {
    setSelectedNextSite({ name: site.name, coordinates: site.coordinates });
    setStep('LOCATION');
    checkLocation();
  };

  const handleUnknownNextSite = () => {
    setSelectedNextSite({ name: "Unknown Location (Define on Arrival)", coordinates: null });
    setStep('LOCATION');
    checkLocation();
  };

  const checkLocation = async () => {
    try {
       const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const current = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(current);

      if (phase === 'OUTWARD' && (!tour.toCoordinates || !tour.toCoordinates.lat)) {
        setIsNewSiteFlow(true);
        setStep('DEFINE_SITE');
        return;
      }

      if (phase === 'ON_SITE') {
        setTimeout(() => startCamera(), 1000);
        return;
      }

      const targetLat = phase === 'RETURN' ? current.lat : (tour.toCoordinates?.lat || current.lat);
      const targetLng = phase === 'RETURN' ? current.lng : (tour.toCoordinates?.lng || current.lng);

      const dist = calculateDistance(current.lat, current.lng, targetLat, targetLng);
      setDistance(Math.round(dist));

      setTimeout(() => {
          startCamera();
      }, 1000);

    } catch (e: any) {
      console.error("Location Error:", e);
      if (e.code === 1) {
        setErrorMsg("Location access denied. Please enable GPS in browser settings.");
      } else if (e.code === 2 || e.code === 3) {
        setErrorMsg("Unable to retrieve location. Please check GPS signal.");
      } else {
        setErrorMsg("Location verification failed.");
      }
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

      timeoutRef.current = setTimeout(() => {
          setStep('LIVENESS_ACTION');
          setLivenessAction(LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)]);
          simulateLivenessCheck();
      }, 2000);

    } catch (e: any) { 
      console.error("Camera Error:", e);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setErrorMsg("Camera access denied. Please allow camera permissions.");
      } else {
        setErrorMsg("Unable to access camera.");
      }
      setStep('ERROR'); 
    }
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
            
            const storedSites = localStorage.getItem('known_sites');
            const currentSites = storedSites ? JSON.parse(storedSites) : MOCK_SITES;
            const updatedSites = [newSite, ...currentSites];
            localStorage.setItem('known_sites', JSON.stringify(updatedSites));
          }

          onSuccess({ 
            selfieUrl: selfie, 
            location: coords,
            newSite,
            nextAction: phase === 'ON_SITE' ? nextAction : undefined,
            nextSiteDetails: selectedNextSite || undefined
          });
      }
  };

  const filteredSites = knownSites.filter(s => 
    s.name.toLowerCase().includes(siteSearch.toLowerCase()) || 
    s.category.toLowerCase().includes(siteSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
       <div className="w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[500px]">
          
          <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/20 rounded-full text-white hover:bg-black/40">
             <X className="w-5 h-5" />
          </button>

          {step === 'DESTINATION_CHOICE' && (
            <div className="absolute inset-0 bg-white flex flex-col p-6 space-y-6 animate-in slide-in-from-right">
               <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900">Departing Site</h3>
                  <p className="text-sm text-slate-500 mt-1">Where are you heading next?</p>
               </div>

               <div className="space-y-4">
                  <button 
                    onClick={handleReturnToBase}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-primary hover:bg-indigo-50 flex items-center gap-4 transition-all group"
                  >
                     <div className="bg-slate-100 p-3 rounded-full group-hover:bg-white text-slate-600 group-hover:text-primary">
                        <Home className="w-6 h-6" />
                     </div>
                     <div className="text-left flex-1">
                        <h4 className="font-bold text-slate-900">Return to Origin</h4>
                        <p className="text-xs text-slate-500">Back to {tour.originalStartLocation || tour.fromLocation || 'Headquarters'}</p>
                     </div>
                     <CheckCircle2 className="w-5 h-5 text-slate-200 group-hover:text-primary" />
                  </button>

                  <div className="flex items-center gap-3">
                     <div className="h-px bg-slate-200 flex-1"></div>
                     <span className="text-xs text-slate-400 font-bold">OR</span>
                     <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  <button 
                    onClick={handleGoToNextSite}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-primary hover:bg-indigo-50 flex items-center gap-4 transition-all group"
                  >
                     <div className="bg-slate-100 p-3 rounded-full group-hover:bg-white text-slate-600 group-hover:text-primary">
                        <MapPin className="w-6 h-6" />
                     </div>
                     <div className="text-left flex-1">
                        <h4 className="font-bold text-slate-900">Go to Next Site</h4>
                        <p className="text-xs text-slate-500">Continue tour to another location</p>
                     </div>
                     <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-primary" />
                  </button>
               </div>
            </div>
          )}

          {step === 'SELECT_SITE' && (
             <div className="absolute inset-0 bg-white flex flex-col p-6 space-y-4 animate-in slide-in-from-right">
                <div>
                   <h3 className="font-bold text-lg text-slate-900">Select Next Destination</h3>
                   <p className="text-sm text-slate-500">Search for the next site in your tour.</p>
                </div>
                
                <div className="relative">
                    <Input 
                      placeholder="Search Sites..."
                      icon={Search}
                      value={siteSearch}
                      onChange={(e) => setSiteSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                   {filteredSites.map(site => (
                      <button
                        key={site.id}
                        onClick={() => handleNextSiteSelect(site)}
                        className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl hover:bg-indigo-50 flex items-center justify-between transition-colors"
                      >
                         <div>
                            <p className="font-bold text-sm text-slate-900">{site.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{site.category}</p>
                         </div>
                         <ArrowRight className="w-4 h-4 text-slate-300" />
                      </button>
                   ))}

                   {filteredSites.length === 0 && (
                      <p className="text-center text-sm text-slate-400 py-4">No matching sites found.</p>
                   )}
                </div>

                <button
                    onClick={handleUnknownNextSite}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-primary bg-indigo-50 text-primary flex items-center gap-3 justify-center mt-auto"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">Unknown / New Location</span>
                </button>
                
                <Button variant="outline" onClick={() => setStep('DESTINATION_CHOICE')}>Back</Button>
             </div>
          )}

          {step === 'LOCATION' && (
             <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <h3 className="font-bold text-lg">{getActionTitle()}</h3>
                <p className="text-sm text-slate-500">Verifying GPS Location...</p>
             </div>
          )}

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

                 {isVideoReady && (
                   <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className={`w-64 h-64 rounded-full border-2 transition-all ${step === 'VERIFYING' ? 'border-primary shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'border-white/30'}`}></div>
                           {step === 'VERIFYING' && (
                               <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_15px_#6366f1] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                           )}
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
                 <AlertTriangle className="w-12 h-12 text-red-500" />
                 <div>
                    <h4 className="font-bold text-slate-900">Verification Failed</h4>
                    <p className="text-sm text-slate-500 mt-1">{errorMsg}</p>
                 </div>
                 <div className="flex gap-2 w-full">
                     <Button onClick={() => { 
                         if (errorMsg.includes("Location")) checkLocation();
                         else startCamera();
                      }} variant="primary" className="flex-1">
                        <RefreshCw className="w-4 h-4" /> Retry
                     </Button>
                     <Button onClick={onClose} variant="outline" className="flex-1">Close</Button>
                 </div>
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
