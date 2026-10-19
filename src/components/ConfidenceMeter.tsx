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

  let barColor = 'bg-rose-500';
  if (position.confidence >= 0.7) {
    barColor = 'bg-emerald-500';
  } else if (isSufficient) {
    barColor = 'bg-[#0D9488]';
  } else if (position.confidence > 0.15) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs text-xs">
      <div className="flex items-center justify-between text-slate-700 mb-2 font-medium">
        <span className="font-semibold">{isAr ? 'الثقة التقديرية (تحليل فعلي)' : 'Estimated Confidence'}</span>
        <span className="font-mono tabular-nums text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
          {confPercent}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-300 shadow-inner">
        <div
          className={`h-full ${barColor} transition-all duration-200 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, confPercent))}%` }}
        />
        {/* Min confidence threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-slate-600"
          style={{ left: `${minConfidence * 100}%` }}
          title={isAr ? `الحد الأدنى: ${Math.round(minConfidence * 100)}%` : `Min: ${Math.round(minConfidence * 100)}%`}
        />
      </div>

      {/* Real Computer Vision Metrics Breakdown */}
      <div className="mt-3 grid grid-cols-3 gap-2.5 text-xs text-slate-600 text-center font-mono tabular-nums">
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
          <div className="text-[11px] text-slate-500 font-sans font-medium">{isAr ? 'خطوط المسح' : 'Scanlines'}</div>
          <div className="text-slate-900 font-bold mt-0.5">
            {position.scanMatches}/{position.totalScanLines}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
          <div className="text-[11px] text-slate-500 font-sans font-medium">{isAr ? 'عرض الخط' : 'Avg Width'}</div>
          <div className="text-slate-900 font-bold mt-0.5">
            {position.avgWidth ? `${position.avgWidth}px` : '--'}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
          <div className="text-[11px] text-slate-500 font-sans font-medium">{isAr ? 'زمن المعالجة' : 'Latency'}</div>
          <div className="text-slate-900 font-bold mt-0.5">{position.processingTimeMs}ms</div>
        </div>
      </div>
    </div>
  );
};
