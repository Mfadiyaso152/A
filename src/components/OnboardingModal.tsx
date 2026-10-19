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
    audioFeedback.initAudioContext();
    onComplete();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-2xl text-slate-800">
        {/* Header with Custom Logo */}
        <div className="flex items-center gap-3 mb-4">
          <BrandLogo size={44} />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Marker_detection</h2>
            <p className="text-xs text-slate-500">
              {isAr ? 'مساعد تتبع مسار الخط الأرضي بالكاميرا' : 'Floor Line Following Assistant'}
            </p>
          </div>
        </div>

        {/* Instructions & Features */}
        <div className="space-y-3 my-4 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <Smartphone className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 mb-0.5">
                {isAr ? 'توجيه الكاميرا نحو الأرض' : 'Point Camera Towards Floor'}
              </strong>
              <span className="text-slate-600 text-xs">
                {isAr
                  ? 'أمسك الهاتف بزاوية ميلان طبيعية (30° إلى 45°) موجهاً الكاميرا الخلفية نحو الأرض أمامك لرصد الخط بوضوح.'
                  : 'Hold the phone tilted forward at 30° to 45°, aiming the rear camera at the visible ground line ahead.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <Volume2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 mb-0.5">
                {isAr ? 'توجيهات صوتية واهتزازية فورية' : 'Real-time Audio & Haptic Cues'}
              </strong>
              <span className="text-slate-600 text-xs">
                {isAr
                  ? 'يصدر التطبيق توجيهات صوتية فورية («اتجه يسارًا»، «اتجه يمينًا»، «على المسار») واهتزازًا لمساعدتك على البقاء في المسار.'
                  : 'Receive timely voice cues ("Turn left", "Turn right", "On track") and haptic pulses to maintain line position.'}
              </span>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900">
            <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-950 mb-0.5">
                {isAr ? 'إخلاء مسؤولية وتنبيه أمان هام' : 'Important Safety Disclaimer'}
              </strong>
              <span className="text-xs leading-relaxed text-amber-900/90 font-normal">
                {isAr
                  ? 'هذا التطبيق مساعد تجريبي مخصص لتتبع الخطوط الواضحة فقط، ولا يرصد العوائق أو الحفر أو السلالم، ولا يغني إطلاقًا عن العصا البيضاء أو أدوات التنقل المعتادة.'
                  : 'This application is an experimental aid for visible line following only. It does NOT detect obstacles, drops, or stairs and never replaces standard mobility aids.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
          className="w-full mt-3 py-3.5 px-4 rounded-2xl bg-[#0D9488] text-white hover:bg-[#0f766e] font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Camera className="w-5 h-5" />
          <span>{isAr ? 'تفعيل الكاميرا وبدء الاستخدام' : 'Enable Camera & Start'}</span>
        </button>
      </div>
    </div>
  );
};
