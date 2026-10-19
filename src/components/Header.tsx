import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Download, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type ActiveTab = 'tracker' | 'settings' | 'guide';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  language: 'ar' | 'en';
  audioEnabled: boolean;
  onToggleAudio: () => void;
  vibrationSupported: boolean;
  vibrationEnabled: boolean;
  onToggleVibration: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  language,
  audioEnabled,
  onToggleAudio,
  vibrationSupported,
  vibrationEnabled,
  onToggleVibration,
}) => {
  const isAr = language === 'ar';
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  const tabs: Array<{ id: ActiveTab; labelAr: string; labelEn: string }> = [
    { id: 'tracker', labelAr: 'التتبع المباشر', labelEn: 'Tracker' },
    { id: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings' },
    { id: 'guide', labelAr: 'دليل الاستخدام', labelEn: 'Guide' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 py-2.5 transition-colors shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Wordmark & SVG Logo */}
        <button
          onClick={() => onTabChange('tracker')}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0 text-start min-h-[44px]"
          aria-label="Marker_detection Home"
        >
          <BrandLogo size={36} />
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">
              Marker_detection
            </span>
          </div>
        </button>

        {/* Zone 2: Clean single-line navigation tabs (Tracker, Settings, Guide) */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 min-h-[36px] ${
                  isActive
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Action controls & PWA Install */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Audio Quick Mute */}
          <button
            onClick={onToggleAudio}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
              audioEnabled
                ? 'bg-emerald-50 text-[#0D9488] border-[#0D9488]/40 hover:bg-emerald-100/60'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
            title={audioEnabled ? (isAr ? 'كتم الصوت' : 'Mute Audio') : (isAr ? 'تشغيل الصوت' : 'Unmute Audio')}
            aria-label={audioEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {audioEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>

          {/* Vibration Quick Toggle (if supported) */}
          {vibrationSupported && (
            <button
              onClick={onToggleVibration}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                vibrationEnabled
                  ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100/60'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
              }`}
              title={vibrationEnabled ? (isAr ? 'تعطيل الاهتزاز' : 'Disable Vibration') : (isAr ? 'تفعيل الاهتزاز' : 'Enable Vibration')}
              aria-label="Toggle Vibration"
            >
              <Smartphone className="w-4.5 h-4.5" />
            </button>
          )}

          {/* In-App PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D9488] text-white hover:bg-[#0f766e] text-xs font-semibold shadow-xs transition-transform active:scale-95 whitespace-nowrap min-h-[40px]"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
            </button>
          )}

          {/* iOS Safari Guide Button */}
          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 text-[#0D9488]" />
              <span className="text-[11px]">{isAr ? 'تثبيت PWA' : 'Install'}</span>
            </button>
          )}
        </div>
      </div>

      {/* iOS Safari Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 shadow-xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {isAr ? 'تثبيت Marker_detection على iPhone / iPad' : 'Install Marker_detection on iOS'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {isAr ? (
                <>
                  1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط Safari أسفل الشاشة.
                  <br />
                  2. مرّر للأسفل واضغط على <strong>إضافة إلى الصفحة الرئيسية (Add to Home Screen)</strong>.
                  <br />
                  3. سيعمل التطبيق كشاشة كاملة وبدون اتصال.
                </>
              ) : (
                <>
                  1. Tap the <strong>Share</strong> button in Safari toolbar.
                  <br />
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  <br />
                  3. The app will launch standalone and offline.
                </>
              )}
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0D9488] text-white font-semibold text-xs hover:bg-[#0f766e]"
            >
              {isAr ? 'حسنًا، فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
