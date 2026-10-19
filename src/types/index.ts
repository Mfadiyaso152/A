export type DetectionState =
  | 'idle'
  | 'searching'
  | 'detected'
  | 'locked'
  | 'turn_left'
  | 'turn_right'
  | 'lost'
  | 'camera_error';

export interface LinePoint {
  x: number;
  y: number;
  width: number;
}

export interface LinePosition {
  deviation: number; // -1.0 (far left) to +1.0 (far right), 0 is dead center
  confidence: number; // 0.0 to 1.0
  isStable: boolean;
  direction: 'left' | 'right' | 'center' | 'none';
  scanMatches: number;
  totalScanLines: number;
  linePoints: LinePoint[];
  processingTimeMs: number;
  timestamp: number;
  avgWidth: number;
}

export type DetectionMode = 'color' | 'dark_line' | 'light_line' | 'canny_edges';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSVColor {
  h: number; // 0 to 360
  s: number; // 0 to 100
  v: number; // 0 to 100
}

export interface TargetColor extends RGBColor, HSVColor {}

export interface SettingsModel {
  language: 'ar' | 'en';
  theme: 'dark' | 'light' | 'system';
  selectedCameraId: string;
  detectionMode: DetectionMode;
  targetColor: TargetColor;
  colorToleranceHue: number; // degrees (e.g. 24)
  colorToleranceSat: number; // % (e.g. 30)
  colorToleranceVal: number; // % (e.g. 40)
  deadZone: number; // 0.05 to 0.35 (fraction of frame width)
  sensitivity: number; // 1 to 10
  minLineWidth: number; // in pixels
  maxLineWidth: number; // in pixels
  scanLinesCount: number; // 5 to 20
  roiBottomPercent: number; // 30 to 80%
  luminanceThreshold: number; // 0 to 255
  useAdaptiveThreshold: boolean;
  contrastEnhancement: boolean;
  gaussianBlurSize: 3 | 5 | 7;
  blurSigma: number;
  cannyThreshold1: number;
  cannyThreshold2: number;
  captureResolution: '320x240' | '480x360' | '640x480';
  targetFps: number;
  minConfidence: number; // 0.1 to 0.9
  lossTimeoutFrames: number; // 3 to 20 frames
  audioFeedbackEnabled: boolean;
  audioMode: 'speech' | 'synth';
  speechRate: number; // 0.8 to 1.5
  speechPitch: number; // 0.8 to 1.3
  speechVolume: number; // 0.0 to 1.0
  guidanceCooldown: number; // ms
  vibrationEnabled: boolean;
  showLineHighlight: boolean;
  showDebugView: boolean;
}

export const DEFAULT_SETTINGS: SettingsModel = {
  language: 'ar',
  theme: 'dark',
  selectedCameraId: '',
  detectionMode: 'color',
  targetColor: {
    r: 38,
    g: 217,
    b: 196,
    h: 173,
    s: 82,
    v: 85,
  },
  colorToleranceHue: 28,
  colorToleranceSat: 35,
  colorToleranceVal: 45,
  deadZone: 0.14,
  sensitivity: 6,
  minLineWidth: 8,
  maxLineWidth: 120,
  scanLinesCount: 12,
  roiBottomPercent: 55,
  luminanceThreshold: 110,
  useAdaptiveThreshold: false,
  contrastEnhancement: true,
  gaussianBlurSize: 5,
  blurSigma: 1.4,
  cannyThreshold1: 50,
  cannyThreshold2: 140,
  captureResolution: '480x360',
  targetFps: 20,
  minConfidence: 0.35,
  lossTimeoutFrames: 8,
  audioFeedbackEnabled: true,
  audioMode: 'speech',
  speechRate: 1.1,
  speechPitch: 1.0,
  speechVolume: 1.0,
  guidanceCooldown: 1800,
  vibrationEnabled: true,
  showLineHighlight: true,
  showDebugView: false,
};
