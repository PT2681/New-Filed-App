import React, { useRef, useState, useEffect } from 'react';
import { X, MapPin, Loader2, AlertTriangle, Building2, Undo2, Flag } from 'lucide-react';
import { Button } from './FormElements';
import { Tour, TourPhase } from '../types';

interface TourEndModalProps {
  isOpen: boolean;
  tour: Tour;
  phase: TourPhase; // Current phase BEFORE action
  onClose: () => void;
  onSuccess: (data: { selfieUrl: string, location: any }) => void;
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [step, setStep] = useState<'LOCATION' | 'SELFIE' | 'ERROR'>('LOCATION');
  const [distance, setDistance] = useState(0);
  const [coords, setCoords] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selfie, setSelfie] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('LOCATION');
      checkLocation();
    }
  }, [isOpen]);

  const getActionTitle = () => {
    if (phase === 'OUTWARD') return "Verify Arrival";
    if (phase === 'ON_SITE') return "Start Return Journey";
    return "End Trip";
  };

  const getActionIcon = () => {
    if (phase === 'OUTWARD') return <Building2 className="w-10 h-10 animate-bounce text-primary mx-auto" />;
    if (phase === 'ON_SITE') return <Undo2 className="w-10 h-10 animate-bounce text-primary mx-auto" />;
    return <Flag className="w-10 h-10 animate-bounce text-primary mx-auto" />;
  };

  const checkLocation = async () => {
    try {
       const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const current = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(current);

      // Verify Location based on phase
      // OUTWARD -> Check against toLocation
      // ON_SITE -> Check against toLocation (starting return from site)
      // RETURN -> Check against fromLocation (back at base) - For now we assume base is where they started, roughly.
      
      // Mock validation logic for demo
      if (tour.toCoordinates.lat === 0) {
        setStep('SELFIE');
        startCamera();
        return;
      }

      const targetLat = phase === 'RETURN' ? current.lat : tour.toCoordinates.lat;
      const targetLng = phase === 'RETURN' ? current.lng : tour.toCoordinates.lng;

      const dist = calculateDistance(current.lat, current.lng, targetLat, targetLng);
      setDistance(Math.round(dist));

      // 20km radius for demo purposes (Wide radius for easy testing)
      if (dist <= 20000) { 
         setTimeout(() => {
             setStep('SELFIE');
             startCamera();
         }, 1000);
      } else {
         // Proceed with warning for demo
         setTimeout(() => {
             setStep('SELFIE');
             startCamera();
         }, 1000);
      }

    } catch (e) {
      setStep('ERROR');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
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
            setSelfie(data);
            streamStop();
            onSuccess({ selfieUrl: data, location: coords });
        }
    }
  };

  const streamStop = () => {
    if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
       <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden p-6 relative min-h-[400px] flex flex-col items-center justify-center text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-2"><X className="w-5 h-5" /></button>
          
          {step === 'LOCATION' && (
             <div className="space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <h3 className="font-bold text-lg">{getActionTitle()}</h3>
                <p className="text-sm text-slate-500">Verifying GPS Location...</p>
             </div>
          )}

          {step === 'SELFIE' && (
              <div className="w-full h-full space-y-4">
                 {getActionIcon()}
                 <h3 className="font-bold text-lg">{getActionTitle()}</h3>
                 <p className="text-xs text-slate-500 -mt-2 mb-2">Take a photo to confirm timestamp</p>
                 <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] shadow-lg">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                 </div>
                 <Button onClick={capturePhoto}>Capture & Proceed</Button>
              </div>
          )}

           {step === 'ERROR' && (
              <div className="space-y-4">
                 <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                 <p>Location Error. Please try again.</p>
                 <Button onClick={onClose} variant="outline">Close</Button>
              </div>
          )}
       </div>
    </div>
  );
};