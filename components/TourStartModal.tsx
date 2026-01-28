import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, Car, Bike, Bus, MapPin, User, Users, Video, Cloud, Sun, ToggleLeft, ToggleRight, ArrowRight, CheckCircle2, Scan, Loader2, ScanFace, CloudRain, RefreshCw } from 'lucide-react';
import { Button, Input } from './FormElements';
import { Tour, TransportMode, TravelType, PoolRole } from '../types';
import { MOCK_PROJECTS } from '../constants';

interface TourStartModalProps {
  isOpen: boolean;
  tour: Tour;
  onClose: () => void;
  onSuccess: (updatedTourData: Partial<Tour>) => void;
}

// Steps: MODE -> VIDEO (conditional) -> PLATE -> POOL -> PURPOSE -> LOCATION -> SELFIE (Liveness Flow)
type Step = 'MODE' | 'VIDEO' | 'PLATE' | 'POOL' | 'PURPOSE' | 'LOCATION' | 'SELFIE_INIT' | 'LIVENESS' | 'VERIFYING' | 'CAPTURED';

const LIVENESS_ACTIONS = [
  "Blink your eyes twice",
  "Turn your head slightly to the left",
  "Turn your head slightly to the right",
  "Smile for the camera",
  "Nod your head"
];

export const TourStartModal: React.FC<TourStartModalProps> = ({ 
  isOpen, tour, onClose, onSuccess 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Flow State
  const [step, setStep] = useState<Step>('MODE');
  const [isBadWeather, setIsBadWeather] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  
  // Data State
  const [transportMode, setTransportMode] = useState<TransportMode | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [platePhoto, setPlatePhoto] = useState<string | null>(null);
  const [travelType, setTravelType] = useState<TravelType>('Individual');
  const [poolRole, setPoolRole] = useState<PoolRole>('Driver');
  const [selectedProjectId, setSelectedProjectId] = useState(tour.projectId || "");
  const [taskName, setTaskName] = useState(tour.taskName || "");
  const [customPurpose, setCustomPurpose] = useState("");
  const [mapLocation, setMapLocation] = useState(tour.toLocation || "");
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

  // Liveness State
  const [livenessAction, setLivenessAction] = useState("");

  // Camera State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('MODE');
      setTransportMode(null);
      setVideoFile(null);
      setPlatePhoto(null);
      setSelfiePhoto(null);
      detectWeather();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const detectWeather = () => {
    setIsWeatherLoading(true);
    // Simulate API call to weather service
    setTimeout(() => {
        // Mock logic: 20% chance of rain for demo
        const badWeather = Math.random() > 0.8;
        setIsBadWeather(badWeather);
        setIsWeatherLoading(false);
    }, 800);
  };

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

      // If starting selfie flow, trigger liveness after delay
      if (facingMode === 'user') {
        timeoutRef.current = setTimeout(() => {
            setStep('LIVENESS');
            setLivenessAction(LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)]);
            simulateLivenessCheck();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      alert("Camera access failed.");
    }
  };

  // Liveness Simulation
  const simulateLivenessCheck = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      if (progress >= 100) {
        clearInterval(interval);
        setStep('VERIFYING');
        setTimeout(() => capturePhoto((data) => {
            setSelfiePhoto(data);
            setStep('CAPTURED');
        }), 1500);
      }
    }, 30);
  };

  // Callback ref to attach stream immediately
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.setAttribute('playsinline', 'true');
      node.play().catch(console.warn);
    }
  }, [stream]);

  const capturePhoto = (setter: (data: string) => void) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setter(canvas.toDataURL('image/jpeg', 0.8));
            // Don't stop camera here for Selfie flow until finalized, but fine for Plate
            if (step === 'PLATE') stopCamera(); 
        }
      }
    }
  };

  // --- Handlers ---

  const handleModeSelect = (mode: TransportMode) => {
    setTransportMode(mode);
  };

  const handleNextFromMode = () => {
    if (!transportMode) return;
    if (!isBadWeather && (transportMode === 'Car' || transportMode === 'Bus')) {
      setStep('VIDEO');
    } else {
      setStep('PLATE');
      startCamera('environment');
    }
  };

  const handleNextFromVideo = () => {
    if (!videoFile) return;
    setStep('PLATE');
    startCamera('environment');
  };

  const handleNextFromPlate = () => {
    if (!platePhoto) return;
    setStep('POOL');
  };

  const handleNextFromPool = () => {
    setStep('PURPOSE');
  };

  const handleNextFromPurpose = () => {
    setStep('LOCATION');
  };

  const handleNextFromLocation = () => {
    setStep('SELFIE_INIT');
    startCamera('user');
  };

  const handleRetakeSelfie = () => {
    setSelfiePhoto(null);
    setStep('SELFIE_INIT');
    startCamera('user');
  };

  const handleFinalSubmit = () => {
    if (!selfiePhoto) return;
    
    onSuccess({
      transportMode: transportMode!,
      travelType,
      poolRole: travelType === 'Pool' ? poolRole : undefined,
      projectId: selectedProjectId,
      taskName,
      taskDescription: customPurpose,
      toLocation: mapLocation,
      vehiclePlateUrl: platePhoto!,
      startSelfieUrl: selfiePhoto,
      surroundingVideoUrl: videoFile ? URL.createObjectURL(videoFile) : undefined,
      weatherData: isBadWeather ? 'Bad' : 'Fine',
      status: 'In Progress',
      actualStartDate: new Date().toISOString()
    });
  };

  // Check if current step is part of the Liveness flow
  const isLivenessStep = ['SELFIE_INIT', 'LIVENESS', 'VERIFYING', 'CAPTURED'].includes(step);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header - Only visible if NOT in Liveness flow or if in Captured state */}
        {(!isLivenessStep || step === 'CAPTURED') && (
          <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white z-50">
            <h3 className="font-semibold text-slate-900">Start Trip</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        {/* Added min-h-[500px] to ensure camera has space to render if absolute, but using flex logic now */}
        <div className="flex-1 relative bg-slate-50 flex flex-col min-h-[500px]">
          
          {/* Scrollable Content for Form Steps */}
          {!isLivenessStep && (
            <div className="flex-1 overflow-y-auto p-4">
              
              {/* Step 1: Transport Mode & Weather */}
              {step === 'MODE' && (
                <div className="space-y-6">
                  {/* Weather Status Card - Now Auto-Detected */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors duration-500 ${isBadWeather ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                    {isWeatherLoading ? (
                        <div className="flex items-center gap-3 w-full">
                           <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                           <div>
                              <p className="font-semibold text-sm text-slate-600">Checking Weather...</p>
                              <p className="text-xs text-slate-400">Syncing with local station</p>
                           </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${isBadWeather ? 'bg-blue-100' : 'bg-orange-100'}`}>
                                {isBadWeather ? <CloudRain className="text-blue-500 w-6 h-6" /> : <Sun className="text-orange-500 w-6 h-6" />}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-slate-900">Current Weather</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                   {isBadWeather ? "Rainy/Bad Conditions" : "Sunny/Good Conditions"}
                                   <span className="bg-white/50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-black/5 uppercase tracking-wide">
                                     Auto-Detected
                                   </span>
                                </p>
                              </div>
                            </div>
                            <button 
                                onClick={detectWeather} 
                                className="p-2 rounded-full hover:bg-black/5 text-slate-400 active:rotate-180 transition-all"
                                title="Refresh Weather"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </>
                    )}
                  </div>

                  <div>
                     <h4 className="font-bold text-lg text-slate-900 mb-4">Select Transport Mode</h4>
                     <div className="grid grid-cols-3 gap-3">
                        {(['Bike', 'Car', 'Bus'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleModeSelect(mode)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            transportMode === mode 
                                ? 'border-primary bg-indigo-50 text-primary' 
                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                            }`}
                        >
                            {mode === 'Bike' && <Bike className="w-6 h-6" />}
                            {mode === 'Car' && <Car className="w-6 h-6" />}
                            {mode === 'Bus' && <Bus className="w-6 h-6" />}
                            <span className="text-xs font-bold">{mode}</span>
                        </button>
                        ))}
                     </div>
                  </div>

                  <Button disabled={!transportMode || isWeatherLoading} onClick={handleNextFromMode}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Step 2: Video (Conditional) */}
              {step === 'VIDEO' && (
                <div className="space-y-6 text-center pt-8">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">360° View Required</h4>
                    <p className="text-sm text-slate-500 mt-2">
                      Since the weather is fine and you selected {transportMode}, please upload a 360° view of the surroundings.
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-100">
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="hidden" 
                      id="video-upload" 
                    />
                    <label htmlFor="video-upload" className="block cursor-pointer">
                        {videoFile ? (
                          <span className="text-green-600 font-semibold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Video Selected
                          </span>
                        ) : (
                          <span className="text-primary font-medium">Click to Record/Upload</span>
                        )}
                    </label>
                  </div>

                  <Button disabled={!videoFile} onClick={handleNextFromVideo}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Step 3: Plate Scan */}
              {step === 'PLATE' && (
                <div className="space-y-4 h-full flex flex-col min-h-[400px]">
                  <div className="flex-1 relative bg-black rounded-xl overflow-hidden">
                    {platePhoto ? (
                      <img src={platePhoto} className="w-full h-full object-contain" />
                    ) : (
                        <>
                          <video 
                                ref={setVideoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                onPlaying={() => setIsVideoReady(true)}
                                className="absolute inset-0 w-full h-full object-cover" 
                            />
                          {!isVideoReady && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {!platePhoto && isVideoReady && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="w-64 h-32 border-2 border-white/50 rounded-lg"></div>
                        <p className="absolute bottom-8 text-white text-sm bg-black/50 px-3 py-1 rounded">Align Number Plate</p>
                      </div>
                    )}
                  </div>

                  {platePhoto ? (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { setPlatePhoto(null); startCamera('environment'); }}>Retake</Button>
                      <Button onClick={handleNextFromPlate}>Next</Button>
                    </div>
                  ) : (
                    <Button onClick={() => capturePhoto(setPlatePhoto)} disabled={!isVideoReady}>
                      <Scan className="w-4 h-4" /> Capture Plate
                    </Button>
                  )}
                </div>
              )}

              {/* Step 4-6: Data Entry (Pool, Purpose, Location) */}
              {step === 'POOL' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-4">Travel Type</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setTravelType('Individual')}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${travelType === 'Individual' ? 'border-primary bg-indigo-50 text-primary' : 'bg-white'}`}
                      >
                        <User className="w-6 h-6" />
                        <span className="text-sm font-semibold">Individual</span>
                      </button>
                      <button
                        onClick={() => setTravelType('Pool')}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${travelType === 'Pool' ? 'border-primary bg-indigo-50 text-primary' : 'bg-white'}`}
                      >
                        <Users className="w-6 h-6" />
                        <span className="text-sm font-semibold">Pool</span>
                      </button>
                    </div>
                  </div>

                  {travelType === 'Pool' && (
                    <div className="animate-in slide-in-from-top-2">
                      <h4 className="font-bold text-sm text-slate-900 mb-2">Are you driving?</h4>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setPoolRole('Driver')}
                          className={`flex-1 py-3 rounded-lg border text-sm font-medium ${poolRole === 'Driver' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600'}`}
                        >
                          Driving
                        </button>
                        <button
                          onClick={() => setPoolRole('Passenger')}
                          className={`flex-1 py-3 rounded-lg border text-sm font-medium ${poolRole === 'Passenger' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600'}`}
                        >
                          Sitting
                        </button>
                      </div>
                      {poolRole === 'Passenger' && (
                        <p className="text-xs text-orange-500 mt-2">Note: Only drivers can claim travel expenses.</p>
                      )}
                    </div>
                  )}

                  <Button onClick={handleNextFromPool}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {step === 'PURPOSE' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-slate-900">Purpose</h4>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Select Project</label>
                    <select 
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Select Project --</option>
                      {MOCK_PROJECTS.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Task Type</label>
                    <select 
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Select Task --</option>
                      <option value="Taking Training">Taking Training</option>
                      <option value="Giving Training">Giving Training</option>
                      <option value="Site Visit">Site Visit</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Input 
                    label="Description / Other Purpose"
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    placeholder="Enter details..."
                  />
                  <Button disabled={!selectedProjectId || !taskName} onClick={handleNextFromPurpose}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {step === 'LOCATION' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-slate-900">Destination</h4>
                  <Input 
                    label="Search Location"
                    icon={MapPin}
                    value={mapLocation}
                    onChange={(e) => setMapLocation(e.target.value)}
                    placeholder="Enter destination..."
                  />
                  <div className="h-48 bg-slate-200 rounded-xl flex items-center justify-center border border-slate-300">
                    <p className="text-slate-500 text-sm flex items-center gap-2">
                      <MapPin className="w-5 h-5" /> Map Preview (Mock)
                    </p>
                  </div>
                  <Button disabled={!mapLocation} onClick={handleNextFromLocation}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Liveness Check & Selfie (Replaces Old Selfie Step) */}
          {/* Now using flex-1 relative instead of absolute inset-0 to prevent collapsing height */}
          {isLivenessStep && (
            <div className="flex-1 relative bg-black flex flex-col w-full">
               {step === 'CAPTURED' ? (
                 // Captured State
                 <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-6 space-y-6">
                    <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                       <img src={selfiePhoto!} className="w-full h-full object-cover scale-x-[-1]" alt="Verified Selfie" />
                    </div>
                    <div className="text-center">
                       <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                         <CheckCircle2 className="w-8 h-8 text-green-500" /> Identity Verified
                       </h3>
                       <p className="text-slate-400 text-sm">You are ready to start your tour.</p>
                    </div>
                    <div className="flex gap-3 w-full max-w-xs">
                       <Button variant="outline" onClick={handleRetakeSelfie} className="border-slate-700 text-white hover:bg-slate-800">Retake</Button>
                       <Button onClick={handleFinalSubmit}>Start Trip</Button>
                    </div>
                 </div>
               ) : (
                 // Camera / Liveness State
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

                    {!isVideoReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                    )}

                    {/* Overlays */}
                    {isVideoReady && (
                      <div className="absolute inset-0 pointer-events-none">
                         {/* Header Overlay */}
                         <div className="absolute top-4 left-0 right-0 text-center z-20">
                            <div className="bg-black/40 backdrop-blur-md inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10">
                               <ScanFace className="w-4 h-4 text-primary" />
                               <span className="text-white text-xs font-bold uppercase tracking-wider">Identity Verification</span>
                            </div>
                         </div>

                         {/* Face Frame */}
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                             <div className={`w-64 h-64 rounded-full border-2 transition-colors duration-300 ${step === 'VERIFYING' ? 'border-primary shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'border-white/30'}`}></div>
                             {step === 'VERIFYING' && (
                               <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_15px_#6366f1] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                             )}
                         </div>

                         {/* Instructions */}
                         <div className="absolute bottom-10 left-4 right-4 text-center">
                            <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                               {step === 'SELFIE_INIT' && <p className="text-white font-medium">Position your face in the circle</p>}
                               {step === 'LIVENESS' && (
                                  <div className="space-y-1 animate-in slide-in-from-bottom-2">
                                     <p className="text-primary font-bold uppercase text-[10px] tracking-widest">Action Required</p>
                                     <p className="text-xl font-bold text-white">{livenessAction}</p>
                                  </div>
                               )}
                               {step === 'VERIFYING' && (
                                  <div className="flex items-center justify-center gap-2 text-white">
                                     <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                     <span className="font-medium">Verifying Liveness...</span>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                    )}

                    {/* Close Button (if stuck) */}
                    <button 
                      onClick={() => { stopCamera(); setStep('LOCATION'); }}
                      className="absolute top-4 right-4 z-50 p-2 bg-black/20 rounded-full text-white hover:bg-black/40"
                    >
                       <X className="w-5 h-5" />
                    </button>
                 </div>
               )}
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