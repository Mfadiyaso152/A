import React from 'react';
import { DetectionState } from '../types';

interface DeviationGaugeProps {
  deviation: number; // -1.0 (left) to +1.0 (right)
  deadZone: number; // e.g. 0.14
  state: DetectionState;
  language: 'ar' | 'en';
}

export const DeviationGauge: React.FC<DeviationGaugeProps> = ({
  deviation,
  deadZone,
  state,
  language,
}) => {
  const isAr = language === 'ar';
  const clampedDev = Math.max(-1, Math.min(1, deviation));
  const markerPercent = ((clampedDev + 1) / 2) * 100;
  const deadLeftPercent = ((1 - deadZone) / 2) * 100;
  const deadWidthPercent = deadZone * 100;

  const isLocked = state === 'locked';
  const isLost = state === 'lost' || state === 'idle' || state === 'camera_error';

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs text-xs">
      <div className="flex items-center justify-between text-slate-600 mb-2 font-medium">
        <span className="font-semibold text-slate-700">{isAr ? 'يسار' : 'Left'}</span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
          <span>{isAr ? 'منطقة السماح' : 'Tolerance Band'}:</span>
          <span className="text-[#0D9488] font-bold">±{Math.round(deadZone * 100)}%</span>
        </span>
        <span className="font-semibold text-slate-700">{isAr ? 'يمين' : 'Right'}</span>
      </div>

      {/* Main Track Bar */}
      <div className="relative h-7 bg-slate-100 rounded-xl border border-slate-300/80 overflow-hidden flex items-center shadow-inner">
        {/* Deadzone region centered in bar */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-200/50 border-x border-emerald-500/50"
          style={{
            left: `${deadLeftPercent}%`,
            width: `${deadWidthPercent}%`,
          }}
          title={isAr ? 'منطقة المسار المقبول' : 'Acceptable Track Corridor'}
        />

        {/* Center line tick */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] -translate-x-1/2 bg-slate-400 z-0" />

        {/* Outer tick marks at -50% and +50% */}
        <div className="absolute left-1/4 top-1.5 bottom-1.5 w-[1px] bg-slate-300" />
        <div className="absolute left-3/4 top-1.5 bottom-1.5 w-[1px] bg-slate-300" />

        {/* Dynamic Deviation Pointer / Needle */}
        {!isLost && (
          <div
            className="absolute top-0 bottom-0 w-3 -translate-x-1/2 transition-all duration-150 flex items-center justify-center z-10"
            style={{ left: `${markerPercent}%` }}
          >
            <div
              className={`w-3 h-5 rounded-[4px] shadow-sm border ${
                isLocked
                  ? 'bg-emerald-600 border-white'
                  : 'bg-[#0D9488] border-white'
              }`}
            />
          </div>
        )}

        {isLost && (
          <div className="w-full text-center text-[11px] text-slate-400 font-medium">
            {isAr ? 'لا يوجد انحراف محدد' : 'No deviation locked'}
          </div>
        )}
      </div>

      {/* Numerical Deviation & Guidance Subtitle */}
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <div className="text-slate-500">
          {isAr ? 'قيمة الانحراف:' : 'Offset:'}{' '}
          <span className="font-mono tabular-nums text-slate-800 font-bold">
            {isLost ? '--' : `${(clampedDev * 100).toFixed(0)}%`}
          </span>
        </div>
        <div className="font-semibold text-slate-700">
          {state === 'turn_left' && (isAr ? '← التوجيه: اتجه يسارًا' : '← Steer Left')}
          {state === 'turn_right' && (isAr ? 'التوجيه: اتجه يمينًا →' : 'Steer Right →')}
          {state === 'locked' && (isAr ? '✓ المسار مستقيم ومثبت' : '✓ Centered on track')}
          {state === 'searching' && (isAr ? 'جارٍ البحث عن المسار' : 'Scanning')}
          {state === 'lost' && (isAr ? 'المسار مفقود' : 'Lost')}
        </div>
      </div>
    </div>
  );
};
