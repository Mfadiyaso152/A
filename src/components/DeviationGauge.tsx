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
  // Clamp deviation for visual display between -1.0 and 1.0
  const clampedDev = Math.max(-1, Math.min(1, deviation));
  // Convert -1..1 to 0..100%
  const markerPercent = ((clampedDev + 1) / 2) * 100;
  // Deadzone bounds in percentage
  const deadLeftPercent = ((1 - deadZone) / 2) * 100;
  const deadRightPercent = ((1 + deadZone) / 2) * 100;
  const deadWidthPercent = deadZone * 100;

  const isLocked = state === 'locked';
  const isLost = state === 'lost' || state === 'idle' || state === 'camera_error';

  return (
    <div className="w-full bg-[#131E30] border border-[#1E2E48] rounded-xl p-3 text-xs">
      <div className="flex items-center justify-between text-slate-400 mb-2 font-medium">
        <span>{isAr ? 'يسار' : 'Left'}</span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-slate-300">
          <span>{isAr ? 'منطقة السماح' : 'Tolerance Band'}:</span>
          <span className="text-[#26D9C4]">±{Math.round(deadZone * 100)}%</span>
        </span>
        <span>{isAr ? 'يمين' : 'Right'}</span>
      </div>

      {/* Main Track Bar */}
      <div className="relative h-6 bg-[#0B1220] rounded-lg border border-slate-800/80 overflow-hidden flex items-center">
        {/* Deadzone region centered in bar */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-500/15 border-x border-emerald-500/30"
          style={{
            left: `${deadLeftPercent}%`,
            width: `${deadWidthPercent}%`,
          }}
          title={isAr ? 'منطقة المسار المقبول' : 'Acceptable Track Corridor'}
        />

        {/* Center line tick */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] -translate-x-1/2 bg-slate-600/80 z-0" />

        {/* Outer tick marks at -50% and +50% */}
        <div className="absolute left-1/4 top-1.5 bottom-1.5 w-[1px] bg-slate-800" />
        <div className="absolute left-3/4 top-1.5 bottom-1.5 w-[1px] bg-slate-800" />

        {/* Dynamic Deviation Pointer / Needle */}
        {!isLost && (
          <div
            className="absolute top-0 bottom-0 w-2.5 -translate-x-1/2 transition-all duration-150 flex items-center justify-center z-10"
            style={{ left: `${markerPercent}%` }}
          >
            <div
              className={`w-2.5 h-4.5 rounded-[3px] shadow-md border ${
                isLocked
                  ? 'bg-emerald-400 border-white shadow-emerald-500/40'
                  : 'bg-[#26D9C4] border-white shadow-cyan-500/40'
              }`}
            />
          </div>
        )}

        {isLost && (
          <div className="w-full text-center text-[11px] text-slate-500 font-medium">
            {isAr ? 'لا يوجد انحراف محدد' : 'No deviation locked'}
          </div>
        )}
      </div>

      {/* Numerical Deviation & Guidance Subtitle */}
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <div className="text-slate-400">
          {isAr ? 'قيمة الانحراف:' : 'Offset:'}{' '}
          <span className="font-mono tabular-nums text-slate-200">
            {isLost ? '--' : `${(clampedDev * 100).toFixed(0)}%`}
          </span>
        </div>
        <div className="font-medium text-slate-300">
          {state === 'turn_left' && (isAr ? '← التوجيه: اتجه يسارًا' : '← Steer Left')}
          {state === 'turn_right' && (isAr ? 'التوجيه: اتجه يمينًا →' : 'Steer Right →')}
          {state === 'locked' && (isAr ? '✓ المسار مستقيم' : '✓ Centered')}
          {state === 'searching' && (isAr ? 'جارٍ البحث' : 'Scanning')}
          {state === 'lost' && (isAr ? 'مفقود' : 'Lost')}
        </div>
      </div>
    </div>
  );
};
