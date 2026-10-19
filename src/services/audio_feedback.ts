import { DetectionState, SettingsModel } from '../types';

export class AudioFeedbackService {
  private lastAnnounceTime = 0;
  private lastAnnouncedState: DetectionState | null = null;
  private audioCtx: AudioContext | null = null;
  private speechVoices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private hasVibrationSupport: boolean = false;

  constructor() {
    this.hasVibrationSupport = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  public isVibrationSupported(): boolean {
    return this.hasVibrationSupport;
  }

  public initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.speechVoices = window.speechSynthesis.getVoices();
  }

  /**
   * Initializes Web Audio Context on explicit user gesture
   */
  public initAudioContext(): boolean {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Main announcement dispatcher
   */
  public handleDetectionState(state: DetectionState, settings: SettingsModel) {
    if (!settings.audioFeedbackEnabled && !settings.vibrationEnabled) return;
    if (state === 'idle') return;

    const now = performance.now();
    const timeSinceLast = now - this.lastAnnounceTime;
    const isStateChange = state !== this.lastAnnouncedState;

    // High priority states break through cooldown earlier (lost, newly locked)
    const minCooldown = (state === 'lost' || (state === 'locked' && isStateChange))
      ? Math.min(1000, settings.guidanceCooldown * 0.6)
      : settings.guidanceCooldown;

    if (!isStateChange && timeSinceLast < minCooldown) {
      return;
    }

    this.lastAnnounceTime = now;
    this.lastAnnouncedState = state;

    // Trigger Voice or Audio Tone
    if (settings.audioFeedbackEnabled) {
      if (settings.audioMode === 'speech') {
        this.speakState(state, settings);
      } else {
        this.playSynthBeep(state, settings.speechVolume);
      }
    }

    // Trigger Haptic Vibration if enabled and supported
    if (settings.vibrationEnabled && this.hasVibrationSupport) {
      this.triggerHaptic(state);
    }
  }

  /**
   * Voice announcement using Web Speech API
   */
  private speakState(state: DetectionState, settings: SettingsModel) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.playSynthBeep(state, settings.speechVolume);
      return;
    }

    // Cancel prior speech immediately to avoid queued delays
    window.speechSynthesis.cancel();

    let text = '';
    const isAr = settings.language === 'ar';

    switch (state) {
      case 'locked':
        text = isAr ? 'أنت على المسار' : 'On track';
        break;
      case 'turn_left':
        text = isAr ? 'اتجه قليلًا يسارًا' : 'Turn left';
        break;
      case 'turn_right':
        text = isAr ? 'اتجه قليلًا يمينًا' : 'Turn right';
        break;
      case 'searching':
        text = isAr ? 'جاري البحث عن الخط' : 'Searching for line';
        break;
      case 'lost':
        text = isAr ? 'فقدت الخط' : 'Line lost';
        break;
      default:
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speechRate;
    utterance.pitch = settings.speechPitch;
    utterance.volume = settings.speechVolume;

    // Select language voice
    if (this.speechVoices.length === 0) {
      this.initVoices();
    }

    const targetLang = isAr ? 'ar' : 'en';
    const voice = this.speechVoices.find((v) => v.lang.startsWith(targetLang));
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = isAr ? 'ar-SA' : 'en-US';
    }

    utterance.onerror = () => {
      // Fallback to synth if speech engine fails
      this.playSynthBeep(state, settings.speechVolume);
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Directional Stereo Synth Beep using Web Audio API
   */
  public playSynthBeep(state: DetectionState, volume: number = 0.8) {
    if (!this.initAudioContext() || !this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1.0, volume * 0.4)), now);
    masterGain.connect(ctx.destination);

    // Stereo Panner
    let panNode: StereoPannerNode | null = null;
    try {
      if (typeof ctx.createStereoPanner === 'function') {
        panNode = ctx.createStereoPanner();
        panNode.connect(masterGain);
      }
    } catch {
      panNode = null;
    }

    const targetNode: AudioNode = panNode || masterGain;

    if (state === 'locked') {
      // Pleasant harmonic chime (520Hz -> 780Hz)
      if (panNode) panNode.pan.setValueAtTime(0, now);
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);

      noteGain.gain.setValueAtTime(0.3, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(noteGain);
      noteGain.connect(targetNode);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (state === 'turn_left') {
      // Left ear panned ascending tone
      if (panNode) panNode.pan.setValueAtTime(-0.85, now);
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.linearRampToValueAtTime(480, now + 0.18);

      noteGain.gain.setValueAtTime(0.35, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(noteGain);
      noteGain.connect(targetNode);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (state === 'turn_right') {
      // Right ear panned descending tone
      if (panNode) panNode.pan.setValueAtTime(0.85, now);
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.18);

      noteGain.gain.setValueAtTime(0.35, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(noteGain);
      noteGain.connect(targetNode);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (state === 'lost') {
      // Low dual warning pulse (220Hz)
      if (panNode) panNode.pan.setValueAtTime(0, now);
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);

      noteGain.gain.setValueAtTime(0.2, now);
      noteGain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      noteGain.gain.setValueAtTime(0.2, now + 0.16);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(noteGain);
      noteGain.connect(targetNode);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (state === 'searching') {
      // Gentle subtle ping
      if (panNode) panNode.pan.setValueAtTime(0, now);
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      noteGain.gain.setValueAtTime(0.15, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(noteGain);
      noteGain.connect(targetNode);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  /**
   * Device haptic vibration
   */
  public triggerHaptic(state: DetectionState) {
    if (!this.hasVibrationSupport || typeof navigator === 'undefined' || !navigator.vibrate) return;

    try {
      switch (state) {
        case 'locked':
          navigator.vibrate(60);
          break;
        case 'turn_left':
          navigator.vibrate([80, 40, 40]);
          break;
        case 'turn_right':
          navigator.vibrate([40, 40, 80]);
          break;
        case 'lost':
          navigator.vibrate([160, 100, 160]);
          break;
        case 'searching':
          navigator.vibrate(40);
          break;
        default:
          break;
      }
    } catch {
      // Gracefully handle browser permission restriction
    }
  }

  public testAudio(state: DetectionState, settings: SettingsModel) {
    this.initAudioContext();
    if (settings.audioMode === 'speech') {
      this.speakState(state, settings);
    } else {
      this.playSynthBeep(state, settings.speechVolume);
    }
  }

  public testVibration(state: DetectionState) {
    this.triggerHaptic(state);
  }

  public stopAll() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.hasVibrationSupport && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }
}

export const audioFeedback = new AudioFeedbackService();
