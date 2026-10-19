import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Download, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type ActiveTab = 'tracker' | 'settings' | 'guide' | 'lab' | 'about';

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
    { id: 'lab', labelAr: 'مختبر الاختبار', labelEn: 'Test Lab' },
    { id: 'about', labelAr: 'عن التطبيق', labelEn: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur-md border-b border-[#1E2E48] px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Wordmark & SVG Logo */}
        <button
          onClick={() => onTabChange('tracker')}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0 text-start min-h-[44px]"
          aria-label="Marker_detection Home"
        >
          <BrandLogo size={34} />
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-[#F4F7FC] whitespace-nowrap">
              Marker_detection
            </span>
          </div>
        </button>

        {/* Zone 2: Clean single-line navigation tabs */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-[#131E30] rounded-xl border border-[#1E2E48]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 min-h-[36px] ${
                  isActive
                    ? 'bg-[#26D9C4] text-[#0B1220] font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
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
                ? 'bg-[#131E30] text-[#26D9C4] border-[#26D9C4]/40 hover:bg-[#1A2840]'
                : 'bg-[#131E30]/70 text-slate-500 border-slate-800 hover:text-slate-300'
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
                  ? 'bg-[#131E30] text-[#6588FF] border-[#6588FF]/40 hover:bg-[#1A2840]'
                  : 'bg-[#131E30]/70 text-slate-500 border-slate-800 hover:text-slate-300'
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#26D9C4] text-[#0B1220] hover:bg-[#20b8a6] text-xs font-semibold shadow-sm transition-transform active:scale-95 whitespace-nowrap min-h-[40px]"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
            </button>
          )}

          {/* iOS Safari Guide Button */}
          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-[#131E30] text-slate-300 hover:text-white text-xs font-medium min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 text-[#26D9C4]" />
              <span className="text-[11px]">{isAr ? 'تثبيت PWA' : 'Install'}</span>
            </button>
          )}
        </div>
      </div>

      {/* iOS Safari Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#131E30] border border-[#1E2E48] p-5 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-[#F4F7FC] mb-2">
              {isAr ? 'تثبيت Marker_detection على iPhone / iPad' : 'Install Marker_detection on iOS'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
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
              className="w-full py-2.5 rounded-xl bg-[#26D9C4] text-[#0B1220] font-semibold text-xs"
            >
              {isAr ? 'حسنًا، فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
