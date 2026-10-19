import React, { useState, useEffect } from 'react';
import { SettingsModel, DEFAULT_SETTINGS } from './types';
import { Header, ActiveTab } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { CameraTracker } from './components/CameraTracker';
import { SettingsModal } from './components/SettingsModal';
import { GuideModal } from './components/GuideModal';
import { OnboardingModal } from './components/OnboardingModal';
import { OfflineBanner } from './components/OfflineBanner';
import { audioFeedback } from './services/audio_feedback';

const SETTINGS_STORAGE_KEY = 'marker_detection_settings_v2';
const ONBOARDING_STORAGE_KEY = 'marker_detection_onboarded_v2';

export default function App() {
  const [settings, setSettings] = useState<SettingsModel>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('tracker');

  const handleUpdateSettings = (newSettings: Partial<SettingsModel>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore
    }
  };

  const handleCompleteOnboarding = () => {
    setIsOnboardingOpen(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings.language]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#0D9488]/20 selection:text-[#0D9488] overflow-x-hidden">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        language={settings.language}
        audioEnabled={settings.audioFeedbackEnabled}
        onToggleAudio={() =>
          handleUpdateSettings({
            audioFeedbackEnabled: !settings.audioFeedbackEnabled,
          })
        }
        vibrationSupported={audioFeedback.isVibrationSupported()}
        vibrationEnabled={settings.vibrationEnabled}
        onToggleVibration={() =>
          handleUpdateSettings({
            vibrationEnabled: !settings.vibrationEnabled,
          })
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'tracker' && (
          <CameraTracker
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenSettings={() => setActiveTab('settings')}
            language={settings.language}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetDefaults={handleResetDefaults}
            language={settings.language}
          />
        )}

        {activeTab === 'guide' && <GuideModal language={settings.language} />}
      </main>

      {/* Mobile Bottom Navigation Bar (3 Clean Tabs) */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        language={settings.language}
      />

      {/* Non-intrusive Offline Connectivity Notification */}
      <OfflineBanner language={settings.language} />

      {/* Onboarding Dialog on first use */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
        language={settings.language}
      />
    </div>
  );
}
