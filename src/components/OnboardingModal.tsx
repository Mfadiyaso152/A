import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Camera, Volume2, AlertOctagon, Smartphone, ShieldCheck } from 'lucide-react';
import { audioFeedback } from '../services/audio_feedback';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  language: 'ar' | 'en';
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  language,
}) => {
  if (!isOpen) return null;
  const isAr = language === 'ar';

  const handleStart = () => {
    // Prime audio context on user gesture
    audioFeedback.initAudioContext();
    onComplete();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#131E30] border border-[#1E2E48] p-5 sm:p-7 shadow-2xl text-[#F4F7FC]">
        {/* Header with Custom Logo */}
        <div className="flex items-center gap-3 mb-4">
          <BrandLogo size={44} />
          <div>
            <h2 className="text-xl font-bold tracking-tight">Marker_detection</h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'مساعد تتبع مسار الخط الأرضي بالكاميرا' : 'Floor Line Following Assistant'}
            </p>
          </div>
        </div>

        {/* Instructions & Features */}
        <div className="space-y-3.5 my-4 text-xs sm:text-sm text-slate-300">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0B1220]/70 border border-[#1E2E48]">
            <Smartphone className="w-5 h-5 text-[#26D9C4] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[#F4F7FC] mb-0.5">
                {isAr ? 'توجيه الكاميرا نحو الأرض' : 'Point Camera Towards Floor'}
              </strong>
              <span>
                {isAr
                  ? 'أمسك الهاتف بزاوية ميلان طبيعية (30° إلى 45°) موجهاً الكاميرا الخلفية نحو الأرض أمامك لرصد الخط بوضوح.'
                  : 'Hold the phone tilted forward at 30° to 45°, aiming the rear camera at the visible ground line ahead.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0B1220]/70 border border-[#1E2E48]">
            <Volume2 className="w-5 h-5 text-[#6588FF] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[#F4F7FC] mb-0.5">
                {isAr ? 'توجيهات صوتية واهتزازية فورية' : 'Real-time Audio & Haptic Cues'}
              </strong>
              <span>
                {isAr
                  ? 'يصدر التطبيق توجيهات صوتية فورية («اتجه يسارًا»، «اتجه يمينًا»، «على المسار») واهتزازًا لمساعدتك على البقاء في المسار.'
                  : 'Receive timely voice cues ("Turn left", "Turn right", "On track") and haptic pulses to maintain line position.'}
              </span>
            </div>
          </div>

          {/* Safety Disclaimer (Mandatory) */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200">
            <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 mb-0.5">
                {isAr ? 'إخلاء مسؤولية وتنبيه أمان هام' : 'Important Safety Disclaimer'}
              </strong>
              <span className="text-xs leading-relaxed text-amber-200/90">
                {isAr
                  ? 'هذا التطبيق مساعد تجريبي مخصص لتتبع الخطوط الواضحة فقط، ولا يرصد العوائق أو الحفر أو السلالم، ولا يغني إطلاقًا عن العصا البيضاء أو أدوات التنقل المعتادة.'
                  : 'This application is an experimental aid for visible line following only. It does NOT detect obstacles, drops, or stairs and never replaces standard mobility aids.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isAr
                ? 'تتم معالجة الفيديو محليًا بالكامل داخل جهازك دون رفع أي بيانات أو إطارات لأي خادم.'
                : 'All video analysis runs 100% locally on your device without sending any frames to a server.'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStart}
          className="w-full mt-4 py-3.5 px-4 rounded-xl bg-[#26D9C4] text-[#0B1220] hover:bg-[#20b8a6] font-bold text-sm shadow-lg shadow-[#26D9C4]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Camera className="w-5 h-5" />
          <span>{isAr ? 'تفعيل الكاميرا وبدء الاستخدام' : 'Enable Camera & Start'}</span>
        </button>
      </div>
    </div>
  );
};
