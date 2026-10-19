import React, { useEffect, useState } from 'react';
import { SettingsModel, DetectionMode } from '../types';
import { rgbToHex, hexToRgb, createTargetColorFromRgb } from '../utils/color_helpers';
import { audioFeedback } from '../services/audio_feedback';
import {
  RotateCcw,
  Volume2,
  Camera,
  Sliders,
  Sparkles,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface SettingsModalProps {
  settings: SettingsModel;
  onUpdateSettings: (newSettings: Partial<SettingsModel>) => void;
  onResetDefaults: () => void;
  language: 'ar' | 'en';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
  language,
}) => {
  const isAr = language === 'ar';
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    async function loadCameras() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === 'videoinput');
          setAvailableCameras(videoDevices);
        }
      } catch {
        // ignore
      }
    }
    loadCameras();
  }, []);

  const handleColorChange = (hex: string) => {
    const rgb = hexToRgb(hex);
    const target = createTargetColorFromRgb(rgb.r, rgb.g, rgb.b);
    onUpdateSettings({ targetColor: target });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-slate-200/90 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {isAr ? 'إعدادات الكشف والتوجيه' : 'Detection & Guidance Settings'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'تخصيص معايير الرؤية الحاسوبية، زوايا التتبع، والتحكم الصوتي والاهتزازي'
              : 'Customize computer vision thresholds, line tracking, and audio/haptics'}
          </p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 text-xs font-semibold transition-colors min-h-[40px] border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              {isAr ? 'تأكيد استعادة الإعدادات' : 'Confirm Settings Reset'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {isAr
                ? 'هل تريد بالتأكيد إعادة جميع معايير الكشف والصوت إلى قيمها الافتراضية؟'
                : 'Are you sure you want to restore all detection and guidance settings to defaults?'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onResetDefaults();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {isAr ? 'استعادة' : 'Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. General & Hardware */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#0D9488] flex items-center gap-2">
          <Camera className="w-4 h-4" />
          <span>{isAr ? '1. اللغة واختيار الكاميرا' : '1. Language & Camera'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              {isAr ? 'لغة الواجهة والتوجيه الصوتي' : 'Interface & Voice Language'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateSettings({ language: 'ar' })}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors min-h-[44px] ${
                  settings.language === 'ar'
                    ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors min-h-[44px] ${
                  settings.language === 'en'
                    ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              {isAr ? 'الكاميرا النشطة' : 'Active Camera'}
            </label>
            <select
              value={settings.selectedCameraId}
              onChange={(e) => onUpdateSettings({ selectedCameraId: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#0D9488] min-h-[44px]"
            >
              <option value="">
                {isAr ? 'تلقائي (الكاميرا الخلفية المفضلة)' : 'Auto (Rear Camera Default)'}
              </option>
              {availableCameras.map((cam, idx) => (
                <option key={cam.deviceId || idx} value={cam.deviceId}>
                  {cam.label || `${isAr ? 'كاميرا' : 'Camera'} ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 2. Line Color & Segmentation Mode */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#0D9488] flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? '2. نمط الخط واللون المستهدف' : '2. Line Type & Target Color'}</span>
        </h3>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5 text-xs">
            {isAr ? 'نمط كشف الخط' : 'Detection Mode'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'color' as DetectionMode, labelAr: 'خط ملون (HSV)', labelEn: 'Color (HSV)' },
              { id: 'dark_line' as DetectionMode, labelAr: 'خط داكن على فاتح', labelEn: 'Dark Line' },
              { id: 'light_line' as DetectionMode, labelAr: 'خط فاتح على داكن', labelEn: 'Light Line' },
              { id: 'canny_edges' as DetectionMode, labelAr: 'كشف الحواف (Canny)', labelEn: 'Canny Edges' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onUpdateSettings({ detectionMode: m.id })}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-colors min-h-[44px] ${
                  settings.detectionMode === m.id
                    ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isAr ? m.labelAr : m.labelEn}
              </button>
            ))}
          </div>
        </div>

        {settings.detectionMode === 'color' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isAr ? 'اللون المستهدف للخط' : 'Target Line Color'}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  HSV: {settings.targetColor.h}°, {settings.targetColor.s}%, {settings.targetColor.v}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={rgbToHex(settings.targetColor.r, settings.targetColor.g, settings.targetColor.b)}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <div
                  className="w-10 h-10 rounded-xl border border-slate-300 shadow-xs"
                  style={{
                    backgroundColor: rgbToHex(
                      settings.targetColor.r,
                      settings.targetColor.g,
                      settings.targetColor.b
                    ),
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">{isAr ? 'ألوان شائعة:' : 'Presets:'}</span>
              {[
                { name: isAr ? 'فيروزي' : 'Cyan', hex: '#26D9C4' },
                { name: isAr ? 'أصفر تحذيري' : 'Yellow', hex: '#FACC15' },
                { name: isAr ? 'أبيض ناصع' : 'White', hex: '#FFFFFF' },
                { name: isAr ? 'أزرق إرشادي' : 'Blue', hex: '#3B82F6' },
                { name: isAr ? 'أحمر مسار' : 'Red', hex: '#EF4444' },
              ].map((p) => (
                <button
                  key={p.hex}
                  onClick={() => handleColorChange(p.hex)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 border border-slate-200 shadow-xs"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: p.hex }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <div className="flex justify-between text-[11px] text-slate-700 font-medium mb-1">
                  <span>{isAr ? 'سماح درجة اللون (Hue)' : 'Hue Tolerance'}</span>
                  <span className="font-mono text-[#0D9488] font-bold">±{settings.colorToleranceHue}°</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={settings.colorToleranceHue}
                  onChange={(e) => onUpdateSettings({ colorToleranceHue: Number(e.target.value) })}
                  className="w-full accent-[#0D9488]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-700 font-medium mb-1">
                  <span>{isAr ? 'سماح الإشباع (Sat)' : 'Saturation Tolerance'}</span>
                  <span className="font-mono text-[#0D9488] font-bold">±{settings.colorToleranceSat}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={settings.colorToleranceSat}
                  onChange={(e) => onUpdateSettings({ colorToleranceSat: Number(e.target.value) })}
                  className="w-full accent-[#0D9488]"
                />
              </div>
            </div>
          </div>
        )}

        {(settings.detectionMode === 'dark_line' || settings.detectionMode === 'light_line') && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between text-xs text-slate-700 font-medium">
              <span>{isAr ? 'عتبة الإضاءة (Luminance)' : 'Luminance Threshold'}</span>
              <span className="font-mono text-[#0D9488] font-bold">{settings.luminanceThreshold} / 255</span>
            </div>
            <input
              type="range"
              min="20"
              max="240"
              value={settings.luminanceThreshold}
              onChange={(e) => onUpdateSettings({ luminanceThreshold: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings.useAdaptiveThreshold}
                onChange={(e) => onUpdateSettings({ useAdaptiveThreshold: e.target.checked })}
                className="w-4 h-4 rounded accent-[#0D9488]"
              />
              <span className="text-xs text-slate-700 font-medium">
                {isAr ? 'تفعيل العتبة التكيفية (للإضاءة غير المتجانسة)' : 'Enable Adaptive Thresholding'}
              </span>
            </label>
          </div>
        )}

        {settings.detectionMode === 'canny_edges' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                  <span>{isAr ? 'عتبة كاني الدنيا (T1)' : 'Canny Threshold 1'}</span>
                  <span className="font-mono text-[#0D9488] font-bold">{settings.cannyThreshold1}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={settings.cannyThreshold1}
                  onChange={(e) => onUpdateSettings({ cannyThreshold1: Number(e.target.value) })}
                  className="w-full accent-[#0D9488]"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                  <span>{isAr ? 'عتبة كاني العليا (T2)' : 'Canny Threshold 2'}</span>
                  <span className="font-mono text-[#0D9488] font-bold">{settings.cannyThreshold2}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="220"
                  value={settings.cannyThreshold2}
                  onChange={(e) => onUpdateSettings({ cannyThreshold2: Number(e.target.value) })}
                  className="w-full accent-[#0D9488]"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Computer Vision Geometry & Scanlines */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#0D9488] flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          <span>{isAr ? '3. معايير المسح والهندسة' : '3. Geometry & Scanlines'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex justify-between text-slate-700 mb-1 font-semibold">
              <span>{isAr ? 'منطقة السماح بالمنتصف (Deadzone)' : 'Center Deadzone Corridor'}</span>
              <span className="font-mono text-[#0D9488] font-bold">±{Math.round(settings.deadZone * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.06"
              max="0.30"
              step="0.01"
              value={settings.deadZone}
              onChange={(e) => onUpdateSettings({ deadZone: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-1 font-semibold">
              <span>{isAr ? 'عدد خطوط المسح الأفقي' : 'Scanlines Count'}</span>
              <span className="font-mono text-[#0D9488] font-bold">{settings.scanLinesCount}</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={settings.scanLinesCount}
              onChange={(e) => onUpdateSettings({ scanLinesCount: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-1 font-semibold">
              <span>{isAr ? 'نطاق منطقة الاهتمام (ROI)' : 'ROI Bottom Coverage'}</span>
              <span className="font-mono text-[#0D9488] font-bold">{settings.roiBottomPercent}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="75"
              step="5"
              value={settings.roiBottomPercent}
              onChange={(e) => onUpdateSettings({ roiBottomPercent: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-1 font-semibold">
              <span>{isAr ? 'أقل عرض مقبول للخط (بكسل)' : 'Min Line Width'}</span>
              <span className="font-mono text-[#0D9488] font-bold">{settings.minLineWidth}px</span>
            </div>
            <input
              type="range"
              min="4"
              max="30"
              step="1"
              value={settings.minLineWidth}
              onChange={(e) => onUpdateSettings({ minLineWidth: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              {isAr ? 'حجم نافذة Gaussian Blur' : 'Gaussian Blur Kernel'}
            </label>
            <div className="flex gap-2">
              {[3, 5, 7].map((k) => (
                <button
                  key={k}
                  onClick={() => onUpdateSettings({ gaussianBlurSize: k as 3 | 5 | 7 })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold ${
                    settings.gaussianBlurSize === k
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {k}x{k}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="contrastToggle"
              checked={settings.contrastEnhancement}
              onChange={(e) => onUpdateSettings({ contrastEnhancement: e.target.checked })}
              className="w-4 h-4 rounded accent-[#0D9488]"
            />
            <label htmlFor="contrastToggle" className="text-slate-700 font-semibold cursor-pointer">
              {isAr ? 'تحسين التباين التلقائي (Histogram Stretch)' : 'Auto Contrast Stretch'}
            </label>
          </div>
        </div>
      </section>

      {/* 4. Performance & Loss Delay */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#0D9488] flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>{isAr ? '4. الدقة ومعدل الإطارات والاستقرار' : '4. Resolution, FPS & Stability'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              {isAr ? 'دقة تحليل الصورة' : 'Analysis Resolution'}
            </label>
            <select
              value={settings.captureResolution}
              onChange={(e) =>
                onUpdateSettings({
                  captureResolution: e.target.value as '320x240' | '480x360' | '640x480',
                })
              }
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#0D9488] min-h-[44px]"
            >
              <option value="320x240">320x240 ({isAr ? 'سريع جداً / اقتصادي' : 'Fast / Battery Saver'})</option>
              <option value="480x360">480x360 ({isAr ? 'متوازن موصى به' : 'Balanced Recommended'})</option>
              <option value="640x480">640x480 ({isAr ? 'دقة عالية' : 'High Resolution'})</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-1 font-semibold">
              <span>{isAr ? 'معدل المعالجة المستهدف' : 'Target FPS'}</span>
              <span className="font-mono text-[#0D9488] font-bold">{settings.targetFps} FPS</span>
            </div>
            <input
              type="range"
              min="10"
              max="30"
              step="5"
              value={settings.targetFps}
              onChange={(e) => onUpdateSettings({ targetFps: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-1 font-semibold">
              <span>{isAr ? 'الحد الأدنى للثقة' : 'Min Confidence Threshold'}</span>
              <span className="font-mono text-[#0D9488] font-bold">{Math.round(settings.minConfidence * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.80"
              step="0.05"
              value={settings.minConfidence}
              onChange={(e) => onUpdateSettings({ minConfidence: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-1 font-semibold">
              <span>{isAr ? 'مهلة إعلان فقدان الخط' : 'Line Loss Delay'}</span>
              <span className="font-mono text-[#0D9488] font-bold">{settings.lossTimeoutFrames} {isAr ? 'إطارات' : 'frames'}</span>
            </div>
            <input
              type="range"
              min="3"
              max="18"
              step="1"
              value={settings.lossTimeoutFrames}
              onChange={(e) => onUpdateSettings({ lossTimeoutFrames: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />
          </div>
        </div>
      </section>

      {/* 5. Speech & Audio */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#0D9488] flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          <span>{isAr ? '5. التوجيه الصوتي والاهتزاز' : '5. Audio & Haptic Feedback'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              {isAr ? 'نمط التنبيه الصوتي' : 'Audio Mode'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateSettings({ audioMode: 'speech' })}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold ${
                  settings.audioMode === 'speech'
                    ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {isAr ? 'نطق صوتي (TTS)' : 'Voice (TTS)'}
              </button>
              <button
                onClick={() => onUpdateSettings({ audioMode: 'synth' })}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold ${
                  settings.audioMode === 'synth'
                    ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {isAr ? 'نغمات استريو (Synth)' : 'Stereo Tones'}
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-1 font-semibold">
              <span>{isAr ? 'الفاصل الزمني بين التنبيهات' : 'Announcement Cooldown'}</span>
              <span className="font-mono text-[#0D9488] font-bold">{settings.guidanceCooldown / 1000}s</span>
            </div>
            <input
              type="range"
              min="1000"
              max="4000"
              step="200"
              value={settings.guidanceCooldown}
              onChange={(e) => onUpdateSettings({ guidanceCooldown: Number(e.target.value) })}
              className="w-full accent-[#0D9488]"
            />
          </div>

          {settings.audioMode === 'speech' && (
            <>
              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-semibold">
                  <span>{isAr ? 'سرعة النطق' : 'Speech Rate'}</span>
                  <span className="font-mono text-[#0D9488] font-bold">{settings.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(e) => onUpdateSettings({ speechRate: Number(e.target.value) })}
                  className="w-full accent-[#0D9488]"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-semibold">
                  <span>{isAr ? 'طبقة الصوت (Pitch)' : 'Speech Pitch'}</span>
                  <span className="font-mono text-[#0D9488] font-bold">{settings.speechPitch}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={settings.speechPitch}
                  onChange={(e) => onUpdateSettings({ speechPitch: Number(e.target.value) })}
                  className="w-full accent-[#0D9488]"
                />
              </div>
            </>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 space-y-2">
          <span className="text-xs font-bold text-slate-800 block">
            {isAr ? 'اختبار التنبيهات الفورية:' : 'Quick Audio & Haptic Test:'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => audioFeedback.testAudio('locked', settings)}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold"
            >
              {isAr ? '✓ على المسار' : '✓ On Track'}
            </button>
            <button
              onClick={() => audioFeedback.testAudio('turn_left', settings)}
              className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold"
            >
              {isAr ? '← اتجه يسارًا' : '← Turn Left'}
            </button>
            <button
              onClick={() => audioFeedback.testAudio('turn_right', settings)}
              className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold"
            >
              {isAr ? 'اتجه يمينًا →' : 'Turn Right →'}
            </button>
            <button
              onClick={() => audioFeedback.testAudio('lost', settings)}
              className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold"
            >
              {isAr ? '✕ فقدت الخط' : '✕ Line Lost'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
