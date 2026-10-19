import React from 'react';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, FileText, Code2, AlertTriangle } from 'lucide-react';

interface AboutModalProps {
  language: 'ar' | 'en';
}

export const AboutModal: React.FC<AboutModalProps> = ({ language }) => {
  const isAr = language === 'ar';

  const libraries = [
    { name: 'React', version: '19.0.1', license: 'MIT', purpose: isAr ? 'بناء واجهة المستخدم المتفاعلة' : 'UI component framework' },
    { name: 'Vite', version: '8.3.0', license: 'MIT', purpose: isAr ? 'محرك الحزم والتجميع فائق السرعة' : 'Frontend build tooling' },
    { name: 'vite-plugin-pwa', version: '^0.21.1', license: 'MIT', purpose: isAr ? 'دعم PWA والتخزين بدون اتصال' : 'PWA offline service worker' },
    { name: 'Tailwind CSS', version: '4.3.3', license: 'MIT', purpose: isAr ? 'تنسيق الواجهة بتصميم متجاوب' : 'Utility-first styling' },
    { name: 'Lucide React', version: '0.546.0', license: 'ISC', purpose: isAr ? 'أيقونات الوصول والحالات' : 'Vector icon set' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 md:pb-8 text-slate-200">
      {/* Header */}
      <div className="border-b border-[#1E2E48] pb-4 flex items-center gap-3">
        <BrandLogo size={40} />
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F4F7FC]">
            Marker_detection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr
              ? 'تطبيق ويب تقدمي (PWA) لتتبع المسارات الأرضية بالرؤية الحاسوبية المحلية'
              : 'Progressive Web App for local computer vision floor line tracking'}
          </p>
        </div>
      </div>

      {/* 1. Privacy & Local Processing Guarantee */}
      <div className="bg-[#131E30] border border-emerald-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>{isAr ? 'الخصوصية والمعالجة المحلية 100%' : '100% Local Processing & Privacy'}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {isAr
            ? 'تتم معالجة تدفق كاميرا الجوال وإطارات الفيديو محليًا بالكامل داخل متصفح جهازك باستخدام Canvas وHTML5 Web APIs. لا يتم رفع أو حفظ أو إرسال أي صور أو تسجيلات فيديو أو بيانات تعريفية إلى أي خادم خارجي أو طرف ثالث على الإطلاق.'
            : 'All camera streams and image frames are analyzed strictly on-device inside your browser using Canvas and Web APIs. Zero images, video streams, or telemetry are transmitted to any external server.'}
        </p>
      </div>

      {/* 2. Technical Limitations & Disclaimers */}
      <div className="bg-[#131E30] border border-[#1E2E48] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{isAr ? 'حدود التقنية والاستخدام' : 'Technical Limitations & Boundaries'}</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            {isAr
              ? 'التطبيق مصمم كأداة مساعدة تجريبية لتتبع خطوط واضحة ومتباينة فقط، ولا يعتمد على أجهزة استشعار عمق ثلاثية الأبعاد (LiDAR).'
              : 'Designed as an experimental visual aid for high-contrast lines; does not use 3D LiDAR sensors.'}
          </li>
          <li>
            {isAr
              ? 'لا يكتشف التطبيق العوائق المحيطة، أو الأشخاص، أو الحفر والسلالم، ولا يغني عن أدوات التنقل المعتادة كالعصا البيضاء.'
              : 'Does NOT detect obstacles, people, stairs, or drop-offs, and never substitutes for standard mobility tools.'}
          </li>
          <li>
            {isAr
              ? 'تتأثر دقة الكشف بجودة كاميرا الهاتف، والإضاءة المحيطة، وانعكاسات الأرضيات، وثبات حركة اليد أثناء المشي.'
              : 'Accuracy is subject to device camera quality, ambient lighting, surface glare, and steady walking gait.'}
          </li>
        </ul>
      </div>

      {/* 3. Open Source Libraries & Actual Licenses */}
      <div className="bg-[#131E30] border border-[#1E2E48] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-[#26D9C4] font-bold text-sm">
          <Code2 className="w-5 h-5 shrink-0" />
          <span>{isAr ? 'تراخيص المكتبات البرمجية المستخدمة فعليًا' : 'Active Software Libraries & Licenses'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3 text-start">{isAr ? 'المكتبة' : 'Package'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الإصدار' : 'Version'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الترخيص' : 'License'}</th>
                <th className="py-2 px-3 text-start">{isAr ? 'الدور والوظيفة' : 'Role & Purpose'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {libraries.map((lib) => (
                <tr key={lib.name} className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 font-semibold text-slate-200 font-sans">{lib.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{lib.version}</td>
                  <td className="py-2.5 px-3 text-[#26D9C4]">{lib.license}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans">{lib.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Development & Testing Record Template */}
      <div className="bg-[#131E30] border border-[#1E2E48] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-[#6588FF] font-bold text-sm">
          <FileText className="w-5 h-5 shrink-0" />
          <span>
            {isAr
              ? 'نموذج سجل التطوير والمساهمات البشرية والاختبارات'
              : 'Development Record & Human Verification Log Template'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {isAr
            ? 'سجل توثيقي فارغ لتدوين المساهمات البشرية وتجارب الاختبار الميداني بشفافية:'
            : 'Blank template for logging human contributions, testing notes, and AI collaboration:'}
        </p>

        <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800 font-mono text-xs text-slate-300 space-y-2 leading-relaxed whitespace-pre-wrap">
{`============================================================
سجل التطوير والاختبار الميداني — Marker_detection
Development & Testing Record (Log Sheet)
============================================================

1. معلومات الجلسة (Session Info):
   - التاريخ (Date): ____________________
   - المشرف/المختبر (Evaluator): ____________________
   - نوع الجهاز ونظامه (Device & OS): Android ____ / Chrome ____

2. بيئة الاختبار (Testing Environment):
   - نوع الأرضية (Floor Material): [ ] بلاط  [ ] فينيل  [ ] سجاد  [ ] أخرى: ____
   - نوع ولون الخط (Line Color/Type): ____________________
   - ظروف الإضاءة (Lighting Conditions): [ ] إضاءة نهارية  [ ] إضاءة اصطناعية  [ ] انعكاسات

3. نتائج الاختبار العملي (Observed Metrics):
   - زمن استجابة التنبيه الصوتي (Audio Latency): ______ ms
   - استقرار منطقة السماح (Deadzone Stability): [ ] ممتاز  [ ] متوسط  [ ] يحتاج ضبط
   - السلوك عند فقدان الخط (Line Lost Behavior): [ ] انطفأ التوجيه فورًا بعد المهلة
   - أداء تثبيت PWA بدون إنترنت (Offline PWA): [ ] نجح  [ ] لم ينجح

4. الملاحظات والتعديلات المقترحة (Human Notes & Observations):
   _________________________________________________________
   _________________________________________________________
============================================================`}
        </div>
      </div>
    </div>
  );
};
