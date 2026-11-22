import React from 'react';
import { Bell, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDynamicDemoText, tx } from '../i18n/helpers';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, language } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          {tx(language, 'Notifications & Alerts', 'அறிவிப்புகள் & எச்சரிக்கைகள்')}
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          {tx(
            language,
            'Real-time updates about food safety checks, allocations, and deliveries.',
            'உணவுப் பாதுகாப்பு ஆய்வுகள், ஒதுக்கீடுகள் மற்றும் விநியோகங்கள் குறித்த உடனடி அறிவிப்புகள்.'
          )}
        </p>
      </div>

      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#64748B]">
            {tx(language, 'You have no notifications right now.', 'தற்போது புதிய அறிவிப்புகள் எதுவும் இல்லை.')}
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
                    <div className="text-sm font-bold text-[#123B35]">
                      {formatDynamicDemoText(notif.title, language)}
                    </div>
                    <p className="mt-0.5 text-xs text-[#64748B] leading-relaxed">
                      {formatDynamicDemoText(notif.message, language)}
                    </p>
                    <div className="mt-1.5 font-mono text-[11px] text-[#64748B]">
                      {new Date(notif.created_at).toLocaleString()}
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
                    {tx(language, 'Mark read', 'படித்ததாகக் குறி')}
                  </button>
                ) : (
                  <span className="text-xs text-[#64748B] shrink-0">
                    {tx(language, 'Read', 'படிக்கப்பட்டது')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
