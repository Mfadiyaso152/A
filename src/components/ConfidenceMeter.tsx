import React from 'react';
import { LinePosition } from '../types';

interface ConfidenceMeterProps {
  position: LinePosition;
  minConfidence: number;
  language: 'ar' | 'en';
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  position,
  minConfidence,
  language,
}) => {
  const isAr = language === 'ar';
  const confPercent = Math.round(position.confidence * 100);
  const isSufficient = position.confidence >= minConfidence;

  // Determine meter color
  let barColor = 'bg-rose-500';
  if (position.confidence >= 0.7) {
    barColor = 'bg-emerald-400';
  } else if (isSufficient) {
    barColor = 'bg-[#26D9C4]';
  } else if (position.confidence > 0.15) {
    barColor = 'bg-amber-400';
  }

  return (
    <div className="w-full bg-[#131E30] border border-[#1E2E48] rounded-xl p-3 text-xs">
      <div className="flex items-center justify-between text-slate-300 mb-1.5 font-medium">
        <span>{isAr ? 'الثقة التقديرية (تحليل فعلي)' : 'Estimated Confidence'}</span>
        <span className="font-mono tabular-nums text-sm font-semibold text-[#F4F7FC]">
          {confPercent}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative h-2.5 bg-[#0B1220] rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full ${barColor} transition-all duration-200 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, confPercent))}%` }}
        />
        {/* Min confidence threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-[1.5px] bg-white/70"
          style={{ left: `${minConfidence * 100}%` }}
          title={isAr ? `الحد الأدنى: ${Math.round(minConfidence * 100)}%` : `Min: ${Math.round(minConfidence * 100)}%`}
        />
      </div>

      {/* Real Computer Vision Metrics Breakdown */}
      <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px] text-slate-400 text-center font-mono tabular-nums">
        <div className="bg-[#0B1220]/60 rounded-md p-1 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'خطوط المسح' : 'Scanlines'}</div>
          <div className="text-slate-200 font-medium">
            {position.scanMatches}/{position.totalScanLines}
          </div>
        </div>
        <div className="bg-[#0B1220]/60 rounded-md p-1 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'عرض الخط' : 'Avg Width'}</div>
          <div className="text-slate-200 font-medium">
            {position.avgWidth ? `${position.avgWidth}px` : '--'}
          </div>
        </div>
        <div className="bg-[#0B1220]/60 rounded-md p-1 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'زمن المعالجة' : 'Latency'}</div>
          <div className="text-slate-200 font-medium">{position.processingTimeMs}ms</div>
        </div>
      </div>
    </div>
  );
};
