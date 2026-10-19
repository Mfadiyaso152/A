import React from 'react';
import {
  Smartphone,
  Sun,
  Compass,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface GuideModalProps {
  language: 'ar' | 'en';
}

export const GuideModal: React.FC<GuideModalProps> = ({ language }) => {
  const isAr = language === 'ar';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24 md:pb-8 text-slate-800">
      {/* Title */}
      <div className="border-b border-slate-200/90 pb-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          {isAr ? 'دليل الاستخدام وضبط الإعدادات' : 'User Guide & Best Practices'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isAr
            ? 'إرشادات عملية لضبط الكاميرا، معايرة الألوان، وفهم التوجيهات المكانية'
            : 'Practical steps for camera tilt, color calibration, and spatial guidance'}
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Camera Tilt & Distance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#0D9488] font-bold text-sm">
            <Smartphone className="w-5 h-5 shrink-0" />
            <span>{isAr ? '1. زاوية توجيه الهاتف نحو الأرض' : '1. Phone Angle & Camera Tilt'}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {isAr
              ? 'احمل الهاتف بارتفاع الصدر أو الخصر، واجعله مائلًا للأمام بزاوية تتراوح بين 30° إلى 45° نحو الأرض. تمنح هذه الزاوية الكاميرا مدى رؤية 1 إلى 2 متر أمام قدميك، مما يتيح للنظام وقتًا كافيًا لتحليل الخط وإصدار التنبيه قبل وصولك إليه.'
              : 'Hold phone at chest or waist level tilted forward 30° to 45° towards the floor. This provides a 1-2 meter lookahead window ahead of your steps.'}
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            {isAr
              ? '💡 نصيحة: تجنب توجيه الهاتف بشكل عمودي تمامًا نحو قدميك حتى لا تنعدم زاوية الاستشعار الأمامية.'
              : '💡 Tip: Avoid pointing phone completely vertical straight down.'}
          </div>
        </div>

        {/* 2. Color Calibration */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#0D9488] font-bold text-sm">
            <Compass className="w-5 h-5 shrink-0" />
            <span>{isAr ? '2. معايرة لون الخط باللمس' : '2. Calibrating Line Color'}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {isAr
              ? 'عند تفعيل التتبع المباشر، اضغط على زر «معايرة اللون» ثم المس مسار الخط الظاهر على شاشة الكاميرا. يقوم التطبيق تلقائيًا بحساب إحداثيات اللون بنظام HSV وضبط نطاقات التسامح المناسبة لإضاءة المكان.'
              : 'During live tracking, tap "Pick Color" and touch the line in the camera view to instantly sample its HSV color.'}
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            {isAr
              ? 'إذا كان الخط أسود أو أبيض، اختر من الإعدادات نمط «خط داكن على فاتح» أو «خط فاتح على داكن».'
              : 'For black or white tape, select "Dark Line" or "Light Line" in settings.'}
          </div>
        </div>

        {/* 3. Heading Direction vs Camera Offset */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-blue-600 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{isAr ? '3. موقع الخط مقابل اتجاه التصحيح' : '3. Line Position vs Steering'}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {isAr
              ? 'يفصل التطبيق بدقة بين مكان الخط في الكاميرا وحركة المستخدم المطلوبة:'
              : 'The app clearly distinguishes between line offset and steering action:'}
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
            <li>
              <strong>{isAr ? 'الخط على يمين الكاميرا:' : 'Line on right:'}</strong>{' '}
              {isAr ? 'أنت منحرف لليسار -> التوجيه «اتجه قليلًا يمينًا».' : 'Steer right.'}
            </li>
            <li>
              <strong>{isAr ? 'الخط على يسار الكاميرا:' : 'Line on left:'}</strong>{' '}
              {isAr ? 'أنت منحرف لليمين -> التوجيه «اتجه قليلًا يسارًا».' : 'Steer left.'}
            </li>
            <li>
              <strong>{isAr ? 'الخط داخل منطقة السماح:' : 'Line in center corridor:'}</strong>{' '}
              {isAr ? 'أنت في المسار الصحيح تمامًا («على المسار»).' : 'On track.'}
            </li>
          </ul>
        </div>

        {/* 4. Lighting & Floor Reflection */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-600 font-bold text-sm">
            <Sun className="w-5 h-5 shrink-0" />
            <span>{isAr ? '4. الإضاءة وانعكاسات الأرضيات' : '4. Lighting & Floor Glare'}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {isAr
              ? 'الأرضيات اللامعة المصقولة كالسيراميك قد تعكس أضواء السقف. في هذه الحالة، فعّل خيار «العتبة التكيفية» (Adaptive Threshold) و«تحسين التباين» من الإعدادات لمقاومة الانعكاسات.'
              : 'Glossy ceramic floors reflect ceiling lights. Enable Adaptive Threshold and Auto Contrast in Settings to counter glare.'}
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
            {isAr
              ? '⚠️ تنبيه: تجنب السير في غرف شديدة الظلام أو تحت ظلال حادة تتقاطع مع الخط.'
              : '⚠️ Avoid pitch-black corridors or harsh shadows cast across the path.'}
          </div>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#0D9488]" />
          <span>{isAr ? 'حل المشكلات الشائعة' : 'Troubleshooting Common Issues'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-800 block">{isAr ? 'الكاميرا لا تعمل' : 'Camera Fails'}</strong>
            <p className="text-slate-600 leading-relaxed font-normal">
              {isAr
                ? 'تأكد من فتح التطبيق عبر اتصال آمن (HTTPS) والموافقة على إذن الكاميرا عند طلبه، وإغلاق أي تطبيق آخر يستخدم الكاميرا.'
                : 'Ensure HTTPS connection, grant browser permissions, and close other apps using camera.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-800 block">{isAr ? 'لا يوجد صوت' : 'No Audio'}</strong>
            <p className="text-slate-600 leading-relaxed font-normal">
              {isAr
                ? 'تحظر بعض المتصفحات الصوت التلقائي دون تفاعل المستخدم. اضغط على زر تفعيل الكاميرا أو اختبر الصوت من شاشة الإعدادات.'
                : 'Browsers block autoplay audio. Tap on screen or test audio in Settings to unlock Web Audio.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-800 block">{isAr ? 'التثبيت كتطبيق PWA' : 'PWA Offline'}</strong>
            <p className="text-slate-600 leading-relaxed font-normal">
              {isAr
                ? 'في متصفح Chrome على أندرويد اضغط على زر التثبيت في الشريط العلوي لتثبيت التطبيق وتشغيله في وضع الشاشة الكاملة وبدون إنترنت.'
                : 'In Chrome on Android, tap Install in the top bar to run as a full-screen offline app.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
