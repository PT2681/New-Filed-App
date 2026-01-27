import React from 'react';
import { Home, User, PlusCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoutePath } from '../types';

interface BottomNavProps {
  onStartTour: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onStartTour }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-slate-200 h-16 pb-safe z-50 flex justify-around items-center px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      {/* Home */}
      <button
        onClick={() => navigate(RoutePath.HOME)}
        className={`flex flex-col items-center justify-center w-20 h-full py-1 space-y-1 transition-colors ${
          isActive(RoutePath.HOME) ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Home
          className={`w-6 h-6 transition-transform ${
            isActive(RoutePath.HOME) ? 'scale-110' : ''
          }`}
          strokeWidth={isActive(RoutePath.HOME) ? 2.5 : 2}
        />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      {/* CTA: Start Tour - Replaces Settings */}
      <div className="relative -top-6">
        <button
          onClick={onStartTour}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-indigo-200 active:scale-95 transition-all hover:bg-indigo-600 border-4 border-slate-50"
        >
          <PlusCircle className="w-8 h-8" />
        </button>
        <span className="absolute -bottom-5 w-full text-center text-[10px] font-medium text-slate-500 whitespace-nowrap">Start Trip</span>
      </div>

      {/* Profile */}
      <button
        onClick={() => navigate(RoutePath.PROFILE)}
        className={`flex flex-col items-center justify-center w-20 h-full py-1 space-y-1 transition-colors ${
          isActive(RoutePath.PROFILE) ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <User
          className={`w-6 h-6 transition-transform ${
            isActive(RoutePath.PROFILE) ? 'scale-110' : ''
          }`}
          strokeWidth={isActive(RoutePath.PROFILE) ? 2.5 : 2}
        />
        <span className="text-[10px] font-medium">Profile</span>
      </button>

    </nav>
  );
};