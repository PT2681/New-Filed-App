import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Car, Bike, Bus, MapPin, User, Users, Video, Cloud, Sun, ToggleLeft, ToggleRight, ArrowRight, CheckCircle2, Scan } from 'lucide-react';
import { Button, Input } from './FormElements';
import { Tour, TransportMode, TravelType, PoolRole } from '../types';
import { MOCK_PROJECTS } from '../constants';

interface TourStartModalProps {
  isOpen: boolean;
  tour: Tour;
  onClose: () => void;
  onSuccess: (updatedTourData: Partial<Tour>) => void;
}

// Steps: MODE -> VIDEO (conditional) -> PLATE -> POOL -> PURPOSE -> LOCATION -> SELFIE
type Step = 'MODE' | 'VIDEO' | 'PLATE' | 'POOL' | 'PURPOSE' | 'LOCATION' | 'SELFIE';

export const TourStartModal: React.FC<TourStartModalProps> = ({ 
  isOpen, tour, onClose, onSuccess 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Flow State
  const [step, setStep] = useState<Step>('MODE');
  const [isBadWeather, setIsBadWeather] = useState(false); // Simulated
  
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

  // Camera State
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('MODE');
      setIsBadWeather(false); // Default to fine weather
      setTransportMode(null);
      setVideoFile(null);
      setPlatePhoto(null);
      setSelfiePhoto(null);
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
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: step === 'SELFIE' ? 'user' : 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error(err);
      alert("Camera access failed");
    }
  };

  const capturePhoto = (setter: (data: string) => void) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setter(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  // --- Handlers ---

  const handleModeSelect = (mode: TransportMode) => {
    setTransportMode(mode);
  };

  const handleNextFromMode = () => {
    if (!transportMode) return;
    
    // Logic: If fine weather & (Car/Bus) -> Video
    if (!isBadWeather && (transportMode === 'Car' || transportMode === 'Bus')) {
      setStep('VIDEO');
    } else {
      // Logic: If bad weather OR Bike -> Plate
      // Spec says "Without any 360 view video upload"
      // Then "Scan number plate"
      setStep('PLATE');
      startCamera(); // Pre-start for plate
    }
  };

  const handleNextFromVideo = () => {
    if (!videoFile) return;
    setStep('PLATE');
    startCamera();
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
    setStep('SELFIE');
    startCamera();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <h3 className="font-semibold text-slate-900">Start Trip</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          
          {/* Step 1: Transport Mode & Weather */}
          {step === 'MODE' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isBadWeather ? <Cloud className="text-slate-500 w-6 h-6" /> : <Sun className="text-orange-500 w-6 h-6" />}
                  <div>
                    <p className="font-semibold text-sm">Current Weather</p>
                    <p className="text-xs text-slate-500">{isBadWeather ? "Rainy/Bad" : "Sunny/Fine"}</p>
                  </div>
                </div>
                <button onClick={() => setIsBadWeather(!isBadWeather)} className="text-primary">
                  {isBadWeather ? <ToggleLeft className="w-8 h-8" /> : <ToggleRight className="w-8 h-8" />}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['Bike', 'Car', 'Bus'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleModeSelect(mode)}
                    disabled={!isBadWeather && mode === 'Bike' ? false : !isBadWeather && (mode === 'Car' || mode === 'Bus') ? false : false} 
                    // Spec: "If weather is fine then Bike shall be allowed" - doesn't explicitly ban others but says "If car/bus... 360 view".
                    // Implies all allowed, just different flows.
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

              <Button disabled={!transportMode} onClick={handleNextFromMode}>
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
            <div className="space-y-4 h-full flex flex-col">
               <div className="flex-1 relative bg-black rounded-xl overflow-hidden min-h-[300px]">
                 {platePhoto ? (
                   <img src={platePhoto} className="w-full h-full object-contain" />
                 ) : (
                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                 )}
                 <canvas ref={canvasRef} className="hidden" />
                 
                 {!platePhoto && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-64 h-32 border-2 border-white/50 rounded-lg"></div>
                     <p className="absolute bottom-8 text-white text-sm bg-black/50 px-3 py-1 rounded">Align Number Plate</p>
                   </div>
                 )}
               </div>

               {platePhoto ? (
                 <div className="flex gap-2">
                   <Button variant="outline" onClick={() => { setPlatePhoto(null); startCamera(); }}>Retake</Button>
                   <Button onClick={handleNextFromPlate}>Next</Button>
                 </div>
               ) : (
                 <Button onClick={() => capturePhoto(setPlatePhoto)}>
                   <Scan className="w-4 h-4" /> Capture Plate
                 </Button>
               )}
            </div>
          )}

          {/* Step 4: Pool Details */}
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

          {/* Step 5: Purpose */}
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

          {/* Step 6: Location */}
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

          {/* Step 7: Selfie */}
          {step === 'SELFIE' && (
            <div className="space-y-4 h-full flex flex-col">
               <h4 className="font-bold text-lg text-slate-900">Verify Identity</h4>
               
               <div className="flex-1 relative bg-black rounded-xl overflow-hidden min-h-[300px]">
                 {selfiePhoto ? (
                   <img src={selfiePhoto} className="w-full h-full object-cover" />
                 ) : (
                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                 )}
                 <canvas ref={canvasRef} className="hidden" />
               </div>

               {selfiePhoto ? (
                 <div className="flex gap-2">
                   <Button variant="outline" onClick={() => { setSelfiePhoto(null); startCamera(); }}>Retake</Button>
                   <Button onClick={handleFinalSubmit} variant="primary">Start Trip</Button>
                 </div>
               ) : (
                 <Button onClick={() => capturePhoto(setSelfiePhoto)}>
                   <Camera className="w-4 h-4" /> Take Selfie
                 </Button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};