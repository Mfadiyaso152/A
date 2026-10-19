import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  language: 'ar' | 'en';
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ language }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  const isAr = language === 'ar';

  return (
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-6 start-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-sm border border-amber-400"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {isAr
          ? 'وضع عدم الاتصال — يعمل تتبع الخط محليًا بالكامل بدون إنترنت.'
          : 'Offline Mode — Line tracking operates 100% locally.'}
      </span>
    </div>
  );
};
