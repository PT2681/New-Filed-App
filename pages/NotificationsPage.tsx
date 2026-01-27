import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCheck, Briefcase, GraduationCap, 
  DollarSign, Bell, Clock 
} from 'lucide-react';
import { Button } from '../components/FormElements';
import { Notification, NotificationType, RoutePath } from '../types';
import { MOCK_NOTIFICATIONS } from '../constants';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications(MOCK_NOTIFICATIONS);
      localStorage.setItem('notifications', JSON.stringify(MOCK_NOTIFICATIONS));
    }
  }, []);

  const saveNotifications = (updated: Notification[]) => {
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    const updated = notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    );
    saveNotifications(updated);

    // Navigate if route exists
    if (notification.route) {
      navigate(notification.route);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'PROJECT_ASSIGNED': return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'TRAINING_ASSIGNED': return <GraduationCap className="w-5 h-5 text-teal-600" />;
      case 'CLAIM_PAID': return <DollarSign className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'PROJECT_ASSIGNED': return 'bg-blue-100';
      case 'TRAINING_ASSIGNED': return 'bg-teal-100';
      case 'CLAIM_PAID': return 'bg-green-100';
      default: return 'bg-slate-100';
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-full flex flex-col space-y-4 pt-2 pb-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(RoutePath.HOME)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-primary hover:text-indigo-700 flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer ${
                notif.read 
                  ? 'bg-white border-slate-100' 
                  : 'bg-indigo-50/50 border-indigo-100 shadow-sm'
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBgColor(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold text-sm mb-1 ${notif.read ? 'text-slate-800' : 'text-slate-900'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                      {formatTimeAgo(notif.timestamp)}
                      {!notif.read && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${notif.read ? 'text-slate-500' : 'text-slate-700'}`}>
                    {notif.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No Notifications</h3>
            <p className="text-sm text-slate-500 mt-1">
              You're all caught up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};