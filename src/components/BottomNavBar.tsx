import React from 'react';
import { ActiveTab } from './Header';
import { Camera, Settings, BookOpen, FlaskConical, Info } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  language: 'ar' | 'en';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  language,
}) => {
  const isAr = language === 'ar';

  const items = [
    { id: 'tracker' as ActiveTab, icon: Camera, labelAr: 'التتبع', labelEn: 'Tracker' },
    { id: 'settings' as ActiveTab, icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings' },
    { id: 'guide' as ActiveTab, icon: BookOpen, labelAr: 'الدليل', labelEn: 'Guide' },
    { id: 'lab' as ActiveTab, icon: FlaskConical, labelAr: 'المختبر', labelEn: 'Test Lab' },
    { id: 'about' as ActiveTab, icon: Info, labelAr: 'عن التطبيق', labelEn: 'About' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1220]/95 backdrop-blur-lg border-t border-[#1E2E48] pb-safe">
      <div className="grid grid-cols-5 items-center h-16">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors"
              aria-label={isAr ? item.labelAr : item.labelEn}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-[#26D9C4]/15 text-[#26D9C4]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                  isActive ? 'text-[#26D9C4]' : 'text-slate-400'
                }`}
              >
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
