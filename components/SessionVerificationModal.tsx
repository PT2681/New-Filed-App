import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, MapPin, Loader2, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from './FormElements';
import { TrainingSession } from '../types';

interface SessionVerificationModalProps {
  isOpen: boolean;
  session: TrainingSession;
  onClose: () => void;
  onSuccess: (data: { photoUrl: string; location: { lat: number, lng: number } }) => void;
}

type Step = 'CAMERA' | 'LOCATION_CHECK' | 'WARNING' | 'SUCCESS' | 'ERROR';

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

export const SessionVerificationModal: React.FC<SessionVerificationModalProps> = ({ 
  isOpen, session, onClose, onSuccess 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>('CAMERA');
  const [errorMsg, setErrorMsg] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
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
    setStep('CAMERA');
    setPhotoData(null);
  };

  const startCamera = async () => {
    setStep('CAMERA');
    setErrorMsg("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error(err);
      setStep('ERROR');
      setErrorMsg("Camera access denied.");
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
        stopCamera(); // Stop camera after capture
        setStep('LOCATION_CHECK');
        checkLocation();
      }
    }
  };

  const checkLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setUserCoords(coords);

      // In real app, verify against session.locationCoords
      // For this demo, let's assume session coords are target.
      // If session coords are (0,0) [Online], skip check
      if (session.locationCoords.lat === 0 && session.locationCoords.lng === 0) {
        finalizeSuccess(data => onSuccess(data), photoData!, coords);
        return;
      }

      const dist = calculateDistance(
        coords.lat, coords.lng,
        session.locationCoords.lat, session.locationCoords.lng
      );
      setDistance(Math.round(dist));

      // 200m Radius Check
      if (dist > 200) {
        setStep('WARNING');
      } else {
        finalizeSuccess(data => onSuccess(data), photoData!, coords);
      }

    } catch (err) {
      console.error(err);
      setStep('ERROR');
      setErrorMsg("Failed to retrieve location.");
    }
  };

  const finalizeSuccess = (callback: any, photo: string, coords: {lat: number, lng: number}) => {
    setStep('SUCCESS');
    setTimeout(() => {
      callback({ photoUrl: photo, location: coords });
    }, 1500);
  };

  const handleForceProceed = () => {
    if (photoData && userCoords) {
      finalizeSuccess(data => onSuccess(data), photoData, userCoords);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Start Session
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
                   Take a photo of the venue
                 </p>
              </div>
            </div>
          )}

          {step === 'LOCATION_CHECK' && (
             <div className="bg-white w-full h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-slate-500 font-medium">Verifying Location...</p>
             </div>
          )}

          {step === 'WARNING' && (
             <div className="bg-white w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center animate-bounce">
                  <AlertTriangle className="w-10 h-10 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Location Mismatch</h4>
                  <p className="text-slate-600 text-sm">
                    You are <strong className="text-slate-900">{distance} meters</strong> away from the designated training location ({session.locationName}).
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    Allowed radius: 200m
                  </p>
                </div>
                <div className="w-full space-y-3">
                  <Button variant="danger" onClick={handleForceProceed}>
                    Start Anyway
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
             </div>
          )}

          {step === 'SUCCESS' && (
             <div className="bg-white w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-50">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Session Started!</h4>
                <p className="text-slate-500 text-sm">Attendance and location recorded.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};