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

  const config = {
    idle: {
      color: 'text-slate-800 border-slate-300 bg-slate-100',
      iconBg: 'bg-slate-200 text-slate-700',
      icon: Compass,
      labelAr: 'جاهز للبدء',
      labelEn: 'Ready',
      detailAr: 'اضغط على زر البدء لتفعيل تتبع الخط',
      detailEn: 'Press Start to initiate line tracking',
    },
    searching: {
      color: 'text-amber-900 border-amber-300 bg-amber-50',
      iconBg: 'bg-amber-100 text-amber-700',
      icon: Search,
      labelAr: 'جاري البحث عن الخط',
      labelEn: 'Searching for line',
      detailAr: 'وجّه الكاميرا نحو خط واضح على الأرض',
      detailEn: 'Aim camera towards a visible line on the floor',
    },
    detected: {
      color: 'text-amber-900 border-amber-300 bg-amber-50',
      iconBg: 'bg-amber-100 text-amber-700',
      icon: AlertTriangle,
      labelAr: 'تم رصد خط (تثبيت الثقة...)',
      labelEn: 'Line detected (verifying...)',
      detailAr: 'حافظ على استقرار الكاميرا',
      detailEn: 'Keep phone steady to confirm trajectory',
    },
    locked: {
      color: 'text-emerald-900 border-emerald-300 bg-emerald-50',
      iconBg: 'bg-emerald-100 text-emerald-700',
      icon: CheckCircle2,
      labelAr: 'على المسار (مسار مثبت)',
      labelEn: 'On track (Line locked)',
      detailAr: 'تابع السير بخط مستقيم للأمام',
      detailEn: 'Continue straight forward along the path',
    },
    turn_left: {
      color: 'text-sky-900 border-sky-300 bg-sky-50',
      iconBg: 'bg-sky-100 text-sky-700',
      icon: ArrowLeft,
      labelAr: 'انحراف يمين — اتجه قليلًا يسارًا',
      labelEn: 'Deviated right — Turn left',
      detailAr: `الخط موجود لليسار بنسبة ${Math.round(Math.abs(deviation) * 100)}%`,
      detailEn: `Line is ${Math.round(Math.abs(deviation) * 100)}% to your left`,
    },
    turn_right: {
      color: 'text-sky-900 border-sky-300 bg-sky-50',
      iconBg: 'bg-sky-100 text-sky-700',
      icon: ArrowRight,
      labelAr: 'انحراف يسار — اتجه قليلًا يمينًا',
      labelEn: 'Deviated left — Turn right',
      detailAr: `الخط موجود لليمين بنسبة ${Math.round(Math.abs(deviation) * 100)}%`,
      detailEn: `Line is ${Math.round(Math.abs(deviation) * 100)}% to your right`,
    },
    lost: {
      color: 'text-rose-900 border-rose-300 bg-rose-50',
      iconBg: 'bg-rose-100 text-rose-700',
      icon: XCircle,
      labelAr: 'فقدان الخط',
      labelEn: 'Line lost',
      detailAr: 'توقف مؤقتًا وأعد توجيه الكاميرا للأرض',
      detailEn: 'Pause and re-align camera towards the ground',
    },
    camera_error: {
      color: 'text-red-900 border-red-300 bg-red-50',
      iconBg: 'bg-red-100 text-red-700',
      icon: VideoOff,
      labelAr: 'تعذر الوصول للكاميرا',
      labelEn: 'Camera inaccessible',
      detailAr: 'يرجى التحقق من صلاحيات الكاميرا في المتصفح',
      detailEn: 'Please verify camera permissions in browser',
    },
  }[state];

  const IconComponent = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${config.color} transition-all duration-200 shadow-xs`}
    >
      <div className={`shrink-0 p-2 rounded-xl ${config.iconBg}`}>
        <IconComponent className="w-5 h-5 animate-in fade-in" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold tracking-tight truncate">
          {isAr ? config.labelAr : config.labelEn}
        </div>
        <div className="text-xs opacity-90 truncate font-medium">
          {isAr ? config.detailAr : config.detailEn}
        </div>
      </div>
    </div>
  );
};
