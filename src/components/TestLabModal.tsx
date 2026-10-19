import React, { useRef, useState, useEffect } from 'react';
import { SettingsModel, LinePosition, DetectionState } from '../types';
import { LineDetector } from '../services/line_detector';
import { audioFeedback } from '../services/audio_feedback';
import { StateIndicator } from './StateIndicator';
import { DeviationGauge } from './DeviationGauge';
import { ConfidenceMeter } from './ConfidenceMeter';
import {
  Upload,
  Play,
  RotateCw,
  FlaskConical,
  CheckCircle2,
  FileCheck,
  Smartphone,
} from 'lucide-react';

interface TestLabModalProps {
  settings: SettingsModel;
  language: 'ar' | 'en';
}

type SyntheticScene =
  | 'centered'
  | 'deviated_left'
  | 'deviated_right'
  | 'lost'
  | 'multiple_lines'
  | 'low_contrast'
  | 'glare_reflection';

export const TestLabModal: React.FC<TestLabModalProps> = ({ settings, language }) => {
  const isAr = language === 'ar';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<LineDetector>(new LineDetector());

  const [activeScene, setActiveScene] = useState<SyntheticScene>('centered');
  const [detectionState, setDetectionState] = useState<DetectionState>('idle');
  const [linePosition, setLinePosition] = useState<LinePosition>({
    deviation: 0,
    confidence: 0,
    isStable: false,
    direction: 'none',
    scanMatches: 0,
    totalScanLines: settings.scanLinesCount,
    linePoints: [],
    processingTimeMs: 0,
    timestamp: Date.now(),
    avgWidth: 0,
  });

  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  // Render synthetic test scene or uploaded image onto canvas and analyze
  const runTestAnalysis = (sceneType?: SyntheticScene, customImg?: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 480;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (customImg) {
      // Draw user's uploaded image scaled to 480x360
      ctx.drawImage(customImg, 0, 0, width, height);
    } else {
      const scene = sceneType || activeScene;
      renderSyntheticScene(ctx, width, height, scene);
    }

    // Process image through the exact same line detector
    const imgData = ctx.getImageData(0, 0, width, height);
    const result = detectorRef.current.detectLine(
      imgData,
      settings,
      debugCanvasRef.current
    );

    setLinePosition(result.position);
    setDetectionState(result.state);

    // Trigger audio feedback for testing
    audioFeedback.handleDetectionState(result.state, settings);
  };

  // Render synthetic ground scenes
  const renderSyntheticScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: SyntheticScene
  ) => {
    // 1. Draw floor surface background
    if (scene === 'low_contrast') {
      ctx.fillStyle = '#223048';
      ctx.fillRect(0, 0, width, height);
    } else if (scene === 'glare_reflection') {
      ctx.fillStyle = '#101B2B';
      ctx.fillRect(0, 0, width, height);
      // Bright floor reflection patch
      const grad = ctx.createRadialGradient(width / 2, height * 0.7, 20, width / 2, height * 0.7, 160);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#111928';
      ctx.fillRect(0, 0, width, height);
      // Floor tile seams
      ctx.strokeStyle = '#1E2B3E';
      ctx.lineWidth = 1;
      for (let y = 40; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 2. Draw ground line according to scene type
    const lineHex =
      settings.detectionMode === 'color'
        ? `rgb(${settings.targetColor.r}, ${settings.targetColor.g}, ${settings.targetColor.b})`
        : settings.detectionMode === 'dark_line'
        ? '#1A1A1A'
        : '#E5E7EB';

    ctx.strokeStyle = lineHex;
    ctx.lineWidth = scene === 'low_contrast' ? 14 : 20;
    ctx.lineCap = 'round';

    if (scene === 'centered') {
      // Line directly in center corridor
      ctx.beginPath();
      ctx.moveTo(width / 2, height * 0.35);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
    } else if (scene === 'deviated_left') {
      // Line located on left side of camera frame (user needs to steer left)
      ctx.beginPath();
      ctx.moveTo(width * 0.28, height * 0.35);
      ctx.lineTo(width * 0.22, height);
      ctx.stroke();
    } else if (scene === 'deviated_right') {
      // Line located on right side of camera frame (user needs to steer right)
      ctx.beginPath();
      ctx.moveTo(width * 0.72, height * 0.35);
      ctx.lineTo(width * 0.78, height);
      ctx.stroke();
    } else if (scene === 'multiple_lines') {
      // Two parallel lines: one strong on left, one on right
      ctx.beginPath();
      ctx.moveTo(width * 0.3, height * 0.35);
      ctx.lineTo(width * 0.28, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width * 0.7, height * 0.35);
      ctx.lineTo(width * 0.72, height);
      ctx.stroke();
    } else if (scene === 'low_contrast') {
      // Subtle line faint against background
      ctx.strokeStyle = 'rgba(38, 217, 196, 0.35)';
      ctx.beginPath();
      ctx.moveTo(width / 2 - 20, height * 0.4);
      ctx.lineTo(width / 2 + 10, height);
      ctx.stroke();
    } else if (scene === 'glare_reflection') {
      // Centered line passing through lighting glare
      ctx.beginPath();
      ctx.moveTo(width / 2, height * 0.35);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
    }
    // 'lost' draws no line at all
  };

  // Run on mount or scene change
  useEffect(() => {
    if (!uploadedImageSrc) {
      runTestAnalysis(activeScene);
    }
  }, [activeScene, settings, uploadedImageSrc]);

  // Handle local user file upload (zero server transmission)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setUploadedImageSrc(src);
      const img = new Image();
      img.onload = () => {
        runTestAnalysis(undefined, img);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 md:pb-8 text-slate-200">
      {/* Title */}
      <div className="border-b border-[#1E2E48] pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F4F7FC] flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#26D9C4]" />
            <span>{isAr ? 'مختبر الاختبار والمحاكاة' : 'Interactive Test & Simulation Lab'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr
              ? 'اختبار خوارزمية كشف الخط على مشاهد اصطناعية واستيراد صور محلية دون خادم'
              : 'Benchmark line detector algorithm using synthetic scenes and local media'}
          </p>
        </div>
      </div>

      {/* Synthetic Scene Selector Tabs */}
      <div className="bg-[#131E30] border border-[#1E2E48] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            {isAr ? 'اختر مشهد اختبار اصطناعي (موسوم للاختبار):' : 'Select Synthetic Test Scene:'}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
            {isAr ? 'بيئة محاكاة اصطناعية' : 'Synthetic Benchmark'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { id: 'centered' as SyntheticScene, labelAr: 'خط بالمنتصف', labelEn: 'Line Centered' },
            { id: 'deviated_left' as SyntheticScene, labelAr: 'خط على اليسار', labelEn: 'Line on Left' },
            { id: 'deviated_right' as SyntheticScene, labelAr: 'خط على اليمين', labelEn: 'Line on Right' },
            { id: 'lost' as SyntheticScene, labelAr: 'غياب الخط (فقدان)', labelEn: 'Line Lost' },
            { id: 'multiple_lines' as SyntheticScene, labelAr: 'تعدد الخطوط', labelEn: 'Multiple Lines' },
            { id: 'low_contrast' as SyntheticScene, labelAr: 'تباين ضعيف', labelEn: 'Low Contrast' },
            { id: 'glare_reflection' as SyntheticScene, labelAr: 'انعكاس إضاءة', labelEn: 'Glare & Reflection' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setUploadedImageSrc(null);
                setActiveScene(sc.id);
              }}
              className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-colors min-h-[44px] ${
                !uploadedImageSrc && activeScene === sc.id
                  ? 'bg-[#26D9C4] text-[#0B1220] border-[#26D9C4]'
                  : 'bg-[#0B1220] border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {isAr ? sc.labelAr : sc.labelEn}
            </button>
          ))}
        </div>

        {/* Local File Upload */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer border border-slate-700 font-medium">
            <Upload className="w-4 h-4 text-[#26D9C4]" />
            <span>{isAr ? 'استيراد صورة من جهازك' : 'Import Test Image'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <span className="text-[11px] text-slate-400">
            {isAr
              ? '🔒 تتم معالجة الملف في متصفحك مباشرة دون رفعه لأي خادم'
              : '🔒 100% processed client-side in browser'}
          </span>
        </div>
      </div>

      {/* Visual Canvas Display & Live Analysis Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Synthetic Frame Canvas */}
        <div className="bg-[#131E30] border border-[#1E2E48] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>{isAr ? 'إطار المحاكاة المعروض' : 'Simulation Frame Canvas'}</span>
            <button
              onClick={() => runTestAnalysis()}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title={isAr ? 'إعادة التحليل' : 'Re-analyze'}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Binary & Scanline Debug Mask Canvas */}
        <div className="bg-[#131E30] border border-[#1E2E48] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>{isAr ? 'قناع الكشف وخطوط المسح (Debug Mask)' : 'Binary Mask & Scanlines'}</span>
            <span className="text-[11px] font-mono text-[#26D9C4]">{linePosition.processingTimeMs}ms</span>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
            <canvas ref={debugCanvasRef} className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Detection Results on Synthetic Scene */}
      <StateIndicator
        state={detectionState}
        language={language}
        deviation={linePosition.deviation}
      />

      <DeviationGauge
        deviation={linePosition.deviation}
        deadZone={settings.deadZone}
        state={detectionState}
        language={language}
      />

      <ConfidenceMeter
        position={linePosition}
        minConfidence={settings.minConfidence}
        language={language}
      />

      {/* Real Android Chrome Field Test Checklist */}
      <section className="bg-[#131E30] border border-[#1E2E48] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#F4F7FC] flex items-center gap-2">
          <FileCheck className="w-4.5 h-4.5 text-emerald-400" />
          <span>{isAr ? 'قائمة التحقق الميداني على متصفح Chrome بجهاز Android حقيقي' : 'Android Chrome Field Verification Checklist'}</span>
        </h3>
        <p className="text-xs text-slate-400">
          {isAr
            ? 'خطوات ينبغي للمشرف اختبارها في بيئة آمنة وخالية من العوائق قبل الاعتماد على التتبع:'
            : 'Checklist to verify on a real device under supervised conditions:'}
        </p>

        <ul className="text-xs text-slate-300 space-y-2">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#26D9C4] shrink-0 mt-0.5" />
            <span>
              <strong>{isAr ? 'صلاحيات الكاميرا عبر HTTPS:' : 'Camera permissions:'}</strong>{' '}
              {isAr ? 'ظهور رسالة طلب إذن الكاميرا عند النقر والموافقة عليها بنجاح.' : 'Verify permission dialog works.'}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#26D9C4] shrink-0 mt-0.5" />
            <span>
              <strong>{isAr ? 'استجابة التوجيه الصوتي والاهتزاز:' : 'Speech and Haptics:'}</strong>{' '}
              {isAr ? 'التأكد من سماع «اتجه يسارًا» عند الانحراف لليمين، و«على المسار» عند التوسط، مع اهتزاز ملموس.' : 'Verify TTS directions and vibration patterns.'}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#26D9C4] shrink-0 mt-0.5" />
            <span>
              <strong>{isAr ? 'استمرار عمل الشاشة (Wake Lock):' : 'Screen Wake Lock:'}</strong>{' '}
              {isAr ? 'عدم انطفاء شاشة الهاتف أثناء جلسة التتبع المستمرة دون لمس الشاشة.' : 'Display stays on while actively walking.'}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#26D9C4] shrink-0 mt-0.5" />
            <span>
              <strong>{isAr ? 'التشغيل دون اتصال بعد التثبيت (PWA):' : 'Offline PWA Execution:'}</strong>{' '}
              {isAr ? 'تثبيت التطبيق على الشاشة الرئيسية وفصل الإنترنت بالكامل والتأكد من استمرار فتح التطبيق وتحليله للكاميرا.' : 'Test standalone launch with Airplane mode on.'}
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
};
