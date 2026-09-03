import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, X, Trophy, Calendar, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationDropdown = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'BOOKING':
        return <Calendar className="w-4 h-4 text-brand-600" />;
      case 'MATCH':
      case 'TOURNAMENT':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 fade-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-bold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400">
            No notifications yet. You're all caught up!
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                !n.is_read ? 'bg-brand-50/40' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs shrink-0 self-start">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.formatted_time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                {n.link && (
                  <Link
                    to={n.link}
                    onClick={onClose}
                    className="inline-block mt-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 underline"
                  >
                    View Details →
                  </Link>
                )}
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-brand-600 self-center shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
