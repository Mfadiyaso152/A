import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SettingsModel,
  LinePosition,
  DetectionState,
  DEFAULT_SETTINGS,
} from '../types';
import { LineDetector } from '../services/line_detector';
import { audioFeedback } from '../services/audio_feedback';
import { wakeLockManager } from '../services/wake_lock';
import { StateIndicator } from './StateIndicator';
import { DeviationGauge } from './DeviationGauge';
import { ConfidenceMeter } from './ConfidenceMeter';
import { createTargetColorFromRgb } from '../utils/color_helpers';
import {
  Play,
  Square,
  Pause,
  RefreshCw,
  Pipette,
  Eye,
  EyeOff,
  VideoOff,
  Crosshair,
} from 'lucide-react';

interface CameraTrackerProps {
  settings: SettingsModel;
  onUpdateSettings: (newSettings: Partial<SettingsModel>) => void;
  onOpenSettings: () => void;
  language: 'ar' | 'en';
}

export const CameraTracker: React.FC<CameraTrackerProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  language,
}) => {
  const isAr = language === 'ar';

  // Component refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<LineDetector>(new LineDetector());
  const animFrameRef = useRef<number | null>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  // Component states
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
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

  const [isPickingColor, setIsPickingColor] = useState<boolean>(false);
  const [colorSampleSuccess, setColorSampleSuccess] = useState<string | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera feed with selected camera or default back-camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCameraStream();

    const [resW, resH] = settings.captureResolution.split('x').map(Number);

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: resW || 480 },
      height: { ideal: resH || 360 },
    };

    if (settings.selectedCameraId) {
      videoConstraints.deviceId = { exact: settings.selectedCameraId };
    } else {
      videoConstraints.facingMode = { ideal: 'environment' };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unable to access camera';
      setCameraError(errorMsg);
      setDetectionState('camera_error');
    }
  }, [settings.captureResolution, settings.selectedCameraId, stopCameraStream]);

  // Handle visibility change (pause camera when tab is hidden to save power)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isTracking && !isPaused) {
          setIsPaused(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, isPaused]);

  // Main Detection Loop
  const runDetectionFrame = useCallback(() => {
    if (!isTracking || isPaused || isProcessingRef.current) {
      animFrameRef.current = requestAnimationFrame(runDetectionFrame);
      return;
    }

    const now = performance.now();
    const frameInterval = 1000 / settings.targetFps;
    if (now - lastProcessTimeRef.current < frameInterval) {
      animFrameRef.current = requestAnimationFrame(runDetectionFrame);
      return;
    }

    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      animFrameRef.current = requestAnimationFrame(runDetectionFrame);
      return;
    }

    isProcessingRef.current = true;
    lastProcessTimeRef.current = now;

    try {
      // 1. Prepare processing canvas matching configured resolution
      let procCanvas = processingCanvasRef.current;
      if (!procCanvas) {
        procCanvas = document.createElement('canvas');
        processingCanvasRef.current = procCanvas;
      }

      const [targetW, targetH] = settings.captureResolution.split('x').map(Number);
      if (procCanvas.width !== targetW || procCanvas.height !== targetH) {
        procCanvas.width = targetW;
        procCanvas.height = targetH;
      }

      const pCtx = procCanvas.getContext('2d', { willReadFrequently: true });
      if (pCtx) {
        pCtx.drawImage(video, 0, 0, targetW, targetH);
        const imgData = pCtx.getImageData(0, 0, targetW, targetH);

        // 2. Run real computer vision line detector
        const debugCanvas = settings.showDebugView ? debugCanvasRef.current : null;
        const result = detectorRef.current.detectLine(imgData, settings, debugCanvas);

        setLinePosition(result.position);
        setDetectionState(result.state);

        // 3. Audio & Haptic Feedback Dispatcher
        audioFeedback.handleDetectionState(result.state, settings);

        // 4. Render Live Video Overlay (ROI bounding box and detected line points)
        renderOverlay(result.position, result.state, targetW, targetH);
      }
    } catch {
      // Keep running smoothly on transient errors
    } finally {
      isProcessingRef.current = false;
      animFrameRef.current = requestAnimationFrame(runDetectionFrame);
    }
  }, [isTracking, isPaused, settings]);

  // Overlay renderer matching video aspect ratio and scale
  const renderOverlay = (
    pos: LinePosition,
    state: DetectionState,
    sourceW: number,
    sourceH: number
  ) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / sourceW;
    const scaleY = canvas.height / sourceH;

    // Draw ROI Box in the lower portion
    const roiHeight = Math.floor(canvas.height * (settings.roiBottomPercent / 100));
    const roiTop = canvas.height - roiHeight;

    ctx.save();
    // ROI boundary box
    ctx.strokeStyle = state === 'locked' ? '#22C55E' : state === 'lost' ? '#EF4444' : '#26D9C4';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(4, roiTop, canvas.width - 8, roiHeight - 4);

    // Deadzone guide corridor
    const deadW = settings.deadZone * canvas.width;
    const deadLeft = (canvas.width - deadW) / 2;
    ctx.fillStyle = state === 'locked' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(38, 217, 196, 0.05)';
    ctx.fillRect(deadLeft, roiTop, deadW, roiHeight);

    ctx.strokeStyle = state === 'locked' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(38, 217, 196, 0.25)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(deadLeft, roiTop);
    ctx.lineTo(deadLeft, canvas.height);
    ctx.moveTo(deadLeft + deadW, roiTop);
    ctx.lineTo(deadLeft + deadW, canvas.height);
    ctx.stroke();

    // Center Reference Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, roiTop);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw detected line trajectory and centroids if enabled
    if (settings.showLineHighlight && pos.linePoints.length > 0 && state !== 'lost') {
      // Connect points with smooth stroke
      ctx.strokeStyle = state === 'locked' ? '#22C55E' : '#26D9C4';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < pos.linePoints.length; i++) {
        const pt = pos.linePoints[i];
        const screenX = pt.x * scaleX;
        const screenY = pt.y * scaleY;
        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }
      ctx.stroke();

      // Draw point markers
      for (const pt of pos.linePoints) {
        const screenX = pt.x * scaleX;
        const screenY = pt.y * scaleY;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  // Start / Stop Tracking toggle
  const handleToggleTracking = async () => {
    if (!isTracking) {
      // Start
      audioFeedback.initAudioContext();
      detectorRef.current.reset();
      await startCamera();
      setIsTracking(true);
      setIsPaused(false);
      setDetectionState('searching');
      wakeLockManager.requestLock();
    } else {
      // Stop
      setIsTracking(false);
      setIsPaused(false);
      setDetectionState('idle');
      audioFeedback.stopAll();
      wakeLockManager.releaseLock();
      stopCameraStream();

      // Clear overlay
      if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
  };

  // Pause / Resume toggle
  const handleTogglePause = () => {
    if (!isTracking) return;
    if (isPaused) {
      setIsPaused(false);
      audioFeedback.initAudioContext();
    } else {
      setIsPaused(true);
      audioFeedback.stopAll();
    }
  };

  // Animation frame loop kickoff
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(runDetectionFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [runDetectionFrame]);

  // Clean unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      audioFeedback.stopAll();
      wakeLockManager.releaseLock();
    };
  }, [stopCameraStream]);

  // Sample color from camera frame when user touches video
  const handleSampleColorAtCoords = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isPickingColor) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const proc = processingCanvasRef.current;
    if (!proc) return;

    const pCtx = proc.getContext('2d');
    if (!pCtx) return;

    // Scale to processing dimensions
    const scaleX = proc.width / rect.width;
    const scaleY = proc.height / rect.height;
    const px = Math.floor(x * scaleX);
    const py = Math.floor(y * scaleY);

    if (px >= 0 && px < proc.width && py >= 0 && py < proc.height) {
      const pixel = pCtx.getImageData(px, py, 1, 1).data;
      const targetColor = createTargetColorFromRgb(pixel[0], pixel[1], pixel[2]);

      onUpdateSettings({
        targetColor,
        detectionMode: 'color',
      });

      setColorSampleSuccess(
        isAr
          ? `تمت معايرة اللون بنجاح: HSV(${targetColor.h}°, ${targetColor.s}%, ${targetColor.v}%)`
          : `Color calibrated: HSV(${targetColor.h}°, ${targetColor.s}%, ${targetColor.v}%)`
      );
      setIsPickingColor(false);

      setTimeout(() => setColorSampleSuccess(null), 3500);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3.5 pb-20 md:pb-6">
      {/* Video Viewport Container */}
      <div
        className={`relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#070C15] rounded-2xl overflow-hidden border ${
          detectionState === 'locked'
            ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/10'
            : detectionState === 'lost'
            ? 'border-rose-500/80'
            : 'border-[#1E2E48]'
        } transition-colors`}
        onClick={handleSampleColorAtCoords}
        onTouchStart={handleSampleColorAtCoords}
      >
        {/* Real Live HTML Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Live Drawing Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Debug Canvas (visible when showDebugView is true) */}
        {settings.showDebugView && (
          <div className="absolute top-3 end-3 z-20 w-32 sm:w-44 aspect-[4/3] bg-black/90 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
            <canvas ref={debugCanvasRef} className="w-full h-full object-contain" />
            <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-center text-slate-300 py-0.5 font-mono">
              DEBUG MASK
            </div>
          </div>
        )}

        {/* Color Sampling Mode Crosshair Banner */}
        {isPickingColor && (
          <div className="absolute inset-0 z-30 bg-black/40 flex flex-col items-center justify-center p-4 text-center cursor-crosshair">
            <Crosshair className="w-12 h-12 text-[#26D9C4] animate-pulse mb-2" />
            <div className="px-3 py-1.5 rounded-lg bg-[#0B1220]/90 border border-[#26D9C4] text-xs font-semibold text-[#F4F7FC]">
              {isAr ? 'المس الخط على الشاشة لمعايرة لونه' : 'Tap on the ground line to calibrate color'}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPickingColor(false);
              }}
              className="mt-3 px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        )}

        {/* Idle / Camera Off State Placeholder */}
        {!isTracking && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0B1220]/80 backdrop-blur-xs text-center z-20">
            <div className="w-16 h-16 rounded-2xl bg-[#131E30] border border-[#1E2E48] flex items-center justify-center mb-3 text-[#26D9C4] shadow-lg">
              <Crosshair className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#F4F7FC] mb-1">
              Marker_detection
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {isAr
                ? 'وجّه الكاميرا الخلفية نحو مسار الخط على الأرض واضغط على زر بدء التتبع أدناه.'
                : 'Aim the camera at the floor line and press Start Tracking below.'}
            </p>
            <button
              onClick={handleToggleTracking}
              className="px-6 py-3 rounded-xl bg-[#26D9C4] text-[#0B1220] font-bold text-sm shadow-md hover:bg-[#20b8a6] transition-transform active:scale-95 flex items-center gap-2 min-h-[48px]"
            >
              <Play className="w-4.5 h-4.5 fill-current" />
              <span>{isAr ? 'بدء التتبع الآن' : 'Start Tracking'}</span>
            </button>
          </div>
        )}

        {/* Camera Error Display */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-red-950/80 backdrop-blur-xs text-center z-20">
            <VideoOff className="w-12 h-12 text-rose-400 mb-2" />
            <h3 className="text-sm font-bold text-rose-200 mb-1">
              {isAr ? 'تعذر تشغيل الكاميرا' : 'Camera Inaccessible'}
            </h3>
            <p className="text-xs text-rose-300 max-w-xs mb-3 font-mono">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-white flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Paused state overlay */}
        {isTracking && isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs z-20">
            <div className="px-4 py-2 rounded-xl bg-[#131E30] border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-2">
              <Pause className="w-4 h-4" />
              <span>{isAr ? 'التتبع متوقف مؤقتًا' : 'Tracking Paused'}</span>
            </div>
          </div>
        )}

        {/* Color sample success toast */}
        {colorSampleSuccess && (
          <div className="absolute top-3 start-3 z-30 px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-medium shadow-lg">
            {colorSampleSuccess}
          </div>
        )}
      </div>

      {/* Real-time State & Status Banner */}
      <StateIndicator
        state={detectionState}
        language={language}
        deviation={linePosition.deviation}
      />

      {/* Live Deviation Gauge with Deadzone */}
      <DeviationGauge
        deviation={linePosition.deviation}
        deadZone={settings.deadZone}
        state={detectionState}
        language={language}
      />

      {/* Real Computer Vision Confidence Meter */}
      <ConfidenceMeter
        position={linePosition}
        minConfidence={settings.minConfidence}
        language={language}
      />

      {/* Primary Control Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Main Start / Stop Button */}
        <button
          onClick={handleToggleTracking}
          className={`col-span-2 sm:col-span-1 py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 min-h-[48px] transition-all active:scale-[0.98] ${
            isTracking
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
              : 'bg-[#26D9C4] hover:bg-[#20b8a6] text-[#0B1220] shadow-[#26D9C4]/20'
          }`}
          aria-label={isTracking ? 'Stop tracking' : 'Start tracking'}
        >
          {isTracking ? (
            <>
              <Square className="w-4.5 h-4.5 fill-current" />
              <span>{isAr ? 'إيقاف التتبع' : 'Stop Tracking'}</span>
            </>
          ) : (
            <>
              <Play className="w-4.5 h-4.5 fill-current" />
              <span>{isAr ? 'بدء التتبع' : 'Start Tracking'}</span>
            </>
          )}
        </button>

        {/* Pause / Resume Button */}
        <button
          onClick={handleTogglePause}
          disabled={!isTracking}
          className={`py-3 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 min-h-[48px] transition-colors ${
            !isTracking
              ? 'opacity-40 cursor-not-allowed bg-[#131E30]/50 border-slate-800 text-slate-500'
              : isPaused
              ? 'bg-[#131E30] border-[#26D9C4] text-[#26D9C4] hover:bg-[#1A2840]'
              : 'bg-[#131E30] border-slate-700 text-slate-200 hover:bg-[#1A2840]'
          }`}
        >
          <Pause className="w-4 h-4" />
          <span>
            {isPaused ? (isAr ? 'استئناف' : 'Resume') : (isAr ? 'إيقاف مؤقت' : 'Pause')}
          </span>
        </button>

        {/* Color Pipette Sampler */}
        <button
          onClick={() => setIsPickingColor(!isPickingColor)}
          disabled={!isTracking}
          className={`py-3 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 min-h-[48px] transition-colors ${
            !isTracking
              ? 'opacity-40 cursor-not-allowed bg-[#131E30]/50 border-slate-800 text-slate-500'
              : isPickingColor
              ? 'bg-[#26D9C4] text-[#0B1220] border-[#26D9C4]'
              : 'bg-[#131E30] border-slate-700 text-slate-200 hover:bg-[#1A2840]'
          }`}
          title={isAr ? 'معايرة لون الخط باللمس' : 'Sample line color by touch'}
        >
          <Pipette className="w-4 h-4" />
          <span>{isAr ? 'معايرة اللون' : 'Pick Color'}</span>
        </button>

        {/* Debug View Toggle */}
        <button
          onClick={() =>
            onUpdateSettings({ showDebugView: !settings.showDebugView })
          }
          className={`py-3 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 min-h-[48px] transition-colors ${
            settings.showDebugView
              ? 'bg-[#1A2840] border-[#6588FF] text-[#6588FF]'
              : 'bg-[#131E30] border-slate-700 text-slate-300 hover:bg-[#1A2840]'
          }`}
        >
          {settings.showDebugView ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>{isAr ? 'إخفاء التصحيح' : 'Hide Debug'}</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>{isAr ? 'عرض التصحيح' : 'Show Debug'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
