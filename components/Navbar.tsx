import React, { useEffect, useState, useRef } from 'react';
import { Menu, Bell, X, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_NAME, MOCK_NOTIFICATIONS, FEATURES } from '../constants';
import { RoutePath, Notification } from '../types';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Basic way to check notification state across app without Context/Redux for this blueprint
    const checkNotifications = () => {
      const saved = localStorage.getItem('notifications');
      let notifications: Notification[] = saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
      
      // If we are on first load and no local storage, save mock
      if (!saved) {
        localStorage.setItem('notifications', JSON.stringify(notifications));
      }
      
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    };

    checkNotifications();
    
    // Refresh interval to catch updates (e.g. if updated in NotificationsPage)
    const interval = setInterval(checkNotifications, 2000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleFeatureClick = (id: string) => {
    if (id === 'projects') navigate(RoutePath.PROJECTS);
    if (id === 'training') navigate(RoutePath.TRAINING);
    if (id === 'tours') navigate(RoutePath.TOURS);
    if (id === 'hr') navigate(RoutePath.HR);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <h1 
            onClick={() => navigate(RoutePath.HOME)}
            className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent cursor-pointer"
          >
            {APP_NAME}
          </h1>
        </div>
        <button 
          onClick={() => navigate(RoutePath.NOTIFICATIONS)}
          className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors relative"
        >
          <Bell className="w-6 h-6 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      </header>

      {/* Slide-out Drawer Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Drawer Panel */}
          <div 
            ref={menuRef}
            className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-slate-800">Menu</h2>
                <p className="text-xs text-slate-500">Quick Actions</p>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feature List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {FEATURES.map((feature) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const Icon = (Icons as any)[feature.iconName] || Icons.Circle;
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all active:scale-95 group"
                  >
                    <div className={`p-2.5 rounded-lg ${feature.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-slate-800 text-sm">{feature.title}</h3>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{feature.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">{APP_NAME}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Version 1.0.0</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};