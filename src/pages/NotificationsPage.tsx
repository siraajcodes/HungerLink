import React from 'react';
import { Bell, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          Notifications &amp; Realtime Alerts
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Persistent notifications synchronised via Supabase Realtime channels across Web and
          Android clients.
        </p>
      </div>

      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#64748B]">
            You have no operational notifications at this time.
          </div>
        ) : (
          <ul className="divide-y divide-[#123B35]/8">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`p-5 flex items-start justify-between gap-4 ${
                  notif.read_at ? 'bg-white' : 'bg-[#FFF9EF]/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Bell className="w-4 h-4 text-[#123B35] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-[#123B35]">{notif.title}</div>
                    <p className="mt-0.5 text-xs text-[#64748B] leading-relaxed">{notif.message}</p>
                    <div className="mt-1.5 font-mono text-[11px] text-[#64748B]">
                      {notif.notification_type} · {new Date(notif.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                {!notif.read_at ? (
                  <button
                    type="button"
                    onClick={() => void markNotificationRead(notif.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#123B35]/20 text-xs font-semibold text-[#123B35] hover:bg-white shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark read
                  </button>
                ) : (
                  <span className="text-xs text-[#64748B] shrink-0">Read</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
