import React from 'react';
import { DetectionState } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowLeft,
  ArrowRight,
  XCircle,
  VideoOff,
  Compass,
} from 'lucide-react';

interface StateIndicatorProps {
  state: DetectionState;
  language: 'ar' | 'en';
  deviation: number;
}

export const StateIndicator: React.FC<StateIndicatorProps> = ({ state, language, deviation }) => {
  const isAr = language === 'ar';

  // Config mapping for each state
  const config = {
    idle: {
      color: 'text-slate-300 border-slate-700 bg-slate-800/60',
      icon: Compass,
      labelAr: 'جاهز للبدء',
      labelEn: 'Ready',
      detailAr: 'اضغط على زر البدء لتفعيل تتبع الخط',
      detailEn: 'Press Start to initiate line tracking',
      accent: 'border-slate-600',
    },
    searching: {
      color: 'text-amber-400 border-amber-500/40 bg-amber-950/30',
      icon: Search,
      labelAr: 'جاري البحث عن الخط',
      labelEn: 'Searching for line',
      detailAr: 'وجّه الكاميرا نحو خط واضح على الأرض',
      detailEn: 'Aim camera towards a visible line on the floor',
      accent: 'border-amber-500',
    },
    detected: {
      color: 'text-amber-300 border-amber-400/50 bg-amber-950/40',
      icon: AlertTriangle,
      labelAr: 'تم رصد خط (تثبيت الثقة...)',
      labelEn: 'Line detected (verifying...)',
      detailAr: 'حافظ على استقرار الكاميرا',
      detailEn: 'Keep phone steady to confirm trajectory',
      accent: 'border-amber-400',
    },
    locked: {
      color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
      icon: CheckCircle2,
      labelAr: 'على المسار (مسار مثبت)',
      labelEn: 'On track (Line locked)',
      detailAr: 'تابع السير بخط مستقيم للأمام',
      detailEn: 'Continue straight forward along the path',
      accent: 'border-emerald-500',
    },
    turn_left: {
      color: 'text-sky-300 border-sky-400/50 bg-sky-950/40',
      icon: ArrowLeft,
      labelAr: 'انحراف يمين — اتجه قليلًا يسارًا',
      labelEn: 'Deviated right — Turn left',
      detailAr: `الخط موجود لليسار بنسبة ${Math.round(Math.abs(deviation) * 100)}%`,
      detailEn: `Line is ${Math.round(Math.abs(deviation) * 100)}% to your left`,
      accent: 'border-sky-400',
    },
    turn_right: {
      color: 'text-sky-300 border-sky-400/50 bg-sky-950/40',
      icon: ArrowRight,
      labelAr: 'انحراف يسار — اتجه قليلًا يمينًا',
      labelEn: 'Deviated left — Turn right',
      detailAr: `الخط موجود لليمين بنسبة ${Math.round(Math.abs(deviation) * 100)}%`,
      detailEn: `Line is ${Math.round(Math.abs(deviation) * 100)}% to your right`,
      accent: 'border-sky-400',
    },
    lost: {
      color: 'text-rose-400 border-rose-500/50 bg-rose-950/40',
      icon: XCircle,
      labelAr: 'فقدان الخط',
      labelEn: 'Line lost',
      detailAr: 'توقف مؤقتًا وأعد توجيه الكاميرا للأرض',
      detailEn: 'Pause and re-align camera towards the ground',
      accent: 'border-rose-500',
    },
    camera_error: {
      color: 'text-red-400 border-red-500/50 bg-red-950/40',
      icon: VideoOff,
      labelAr: 'تعذر الوصول للكاميرا',
      labelEn: 'Camera inaccessible',
      detailAr: 'يرجى التحقق من صلاحيات الكاميرا في المتصفح',
      detailEn: 'Please verify camera permissions in browser',
      accent: 'border-red-500',
    },
  }[state];

  const IconComponent = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${config.color} transition-all duration-200 shadow-sm`}
    >
      <div className="shrink-0 p-1.5 rounded-lg bg-black/20">
        <IconComponent className="w-5 h-5 animate-in fade-in" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold tracking-wide truncate">
          {isAr ? config.labelAr : config.labelEn}
        </div>
        <div className="text-xs opacity-85 truncate">
          {isAr ? config.detailAr : config.detailEn}
        </div>
      </div>
    </div>
  );
};
