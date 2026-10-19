import { LinePosition, LinePoint, SettingsModel, DetectionState } from '../types';

export class LineDetector {
  private lastKnownDeviation = 0;
  private consecutiveLostFrames = 0;
  private consecutiveLockedFrames = 0;
  private smoothedDeviation = 0;
  private currentState: DetectionState = 'idle';

  public reset() {
    this.lastKnownDeviation = 0;
    this.consecutiveLostFrames = 0;
    this.consecutiveLockedFrames = 0;
    this.smoothedDeviation = 0;
    this.currentState = 'idle';
  }

  /**
   * Main detection loop: processes image data from canvas/video and calculates line position.
   */
  public detectLine(
    imageData: ImageData,
    settings: SettingsModel,
    debugCanvas?: HTMLCanvasElement | null
  ): { position: LinePosition; state: DetectionState } {
    const startTime = performance.now();
    const { width, height, data } = imageData;

    // 1. Calculate ROI (Region Of Interest)
    // ROI covers the bottom portion of the frame where the ground line is closest to user
    const roiHeight = Math.max(20, Math.floor(height * (settings.roiBottomPercent / 100)));
    const roiYStart = height - roiHeight;
    const roiYEnd = height;

    // 2. Preprocess image: convert to Grayscale & optionally enhance contrast
    const grayBuffer = new Uint8ClampedArray(width * height);
    this.preprocessGrayscale(data, grayBuffer, width, height, settings.contrastEnhancement);

    // 3. Apply Gaussian blur if requested
    const blurredBuffer = new Uint8ClampedArray(width * height);
    this.applyGaussianBlur(grayBuffer, blurredBuffer, width, height, settings.gaussianBlurSize, settings.blurSigma);

    // 4. Generate binary mask based on detection mode
    const mask = new Uint8Array(width * height);
    if (settings.detectionMode === 'canny_edges') {
      this.applyCannyEdges(blurredBuffer, mask, width, height, settings.cannyThreshold1, settings.cannyThreshold2, roiYStart);
    } else if (settings.detectionMode === 'color') {
      this.applyColorThreshold(data, mask, width, height, settings, roiYStart);
    } else if (settings.detectionMode === 'dark_line') {
      this.applyLuminanceThreshold(blurredBuffer, mask, width, height, settings.luminanceThreshold, true, settings.useAdaptiveThreshold, roiYStart);
    } else {
      // light_line
      this.applyLuminanceThreshold(blurredBuffer, mask, width, height, settings.luminanceThreshold, false, settings.useAdaptiveThreshold, roiYStart);
    }

    // 5. Scanlines analysis inside ROI
    const scanlines = Math.max(3, settings.scanLinesCount);
    const linePoints: LinePoint[] = [];
    const scanStep = Math.max(1, Math.floor(roiHeight / (scanlines + 1)));

    // Track width sum for average width calculation
    let totalWidth = 0;

    for (let s = 1; s <= scanlines; s++) {
      const y = roiYStart + s * scanStep;
      if (y >= roiYEnd) break;

      const segments = this.extractScanlineSegments(
        mask,
        y,
        width,
        settings.minLineWidth,
        settings.maxLineWidth
      );

      if (segments.length > 0) {
        // Choose best candidate segment
        // If we have previous points, pick segment closest to last known centroid
        const best = this.chooseBestSegment(segments, width, linePoints, this.lastKnownDeviation);
        if (best) {
          linePoints.push(best);
          totalWidth += best.width;
        }
      }
    }

    // 6. Analyze line continuity, deviation, and confidence
    const scanMatches = linePoints.length;
    const matchRatio = scanMatches / scanlines;
    const avgWidth = scanMatches > 0 ? totalWidth / scanMatches : 0;

    let rawDeviation = 0;
    let confidence = 0;
    let isStable = false;

    if (scanMatches >= 2) {
      // Weighted deviation giving higher weight to bottom rows (closer to user's feet)
      let weightedSum = 0;
      let weightTotal = 0;

      for (let i = 0; i < linePoints.length; i++) {
        const pt = linePoints[i];
        // Normalize x coordinate from -1.0 (left) to +1.0 (right)
        const normX = (pt.x - width / 2) / (width / 2);
        // Weight: higher for bottom-most rows
        const verticalWeight = (pt.y - roiYStart) / roiHeight + 0.5;
        weightedSum += normX * verticalWeight;
        weightTotal += verticalWeight;
      }

      rawDeviation = weightTotal > 0 ? weightedSum / weightTotal : 0;

      // Calculate confidence based on:
      // a. Scanline coverage ratio (40%)
      // b. Vertical continuity / straightness (40%)
      // c. Line width consistency (20%)
      const continuityScore = this.evaluateContinuity(linePoints, width);
      const widthScore = Math.min(1.0, avgWidth / Math.max(1, settings.minLineWidth * 2));

      confidence = matchRatio * 0.45 + continuityScore * 0.4 + widthScore * 0.15;
      confidence = Math.max(0, Math.min(1.0, confidence));

      // Stability test
      isStable = Math.abs(rawDeviation - this.lastKnownDeviation) < 0.25 && continuityScore > 0.6;
    }

    // 7. Temporal smoothing (Exponential Moving Average)
    const alpha = settings.sensitivity * 0.08; // 0.08 to 0.8
    if (scanMatches >= 2 && confidence >= settings.minConfidence) {
      this.consecutiveLostFrames = 0;
      this.smoothedDeviation = this.smoothedDeviation * (1 - alpha) + rawDeviation * alpha;
      this.lastKnownDeviation = this.smoothedDeviation;
    } else {
      this.consecutiveLostFrames++;
    }

    // 8. Determine State and Guidance Direction
    const state = this.updateLineState(confidence, this.smoothedDeviation, settings);
    this.currentState = state;

    let direction: 'left' | 'right' | 'center' | 'none' = 'none';
    if (state === 'locked') {
      direction = 'center';
    } else if (state === 'turn_left') {
      direction = 'left';
    } else if (state === 'turn_right') {
      direction = 'right';
    }

    const elapsed = performance.now() - startTime;

    const position: LinePosition = {
      deviation: Number(this.smoothedDeviation.toFixed(3)),
      confidence: Number(confidence.toFixed(2)),
      isStable,
      direction,
      scanMatches,
      totalScanLines: scanlines,
      linePoints,
      processingTimeMs: Math.round(elapsed),
      timestamp: Date.now(),
      avgWidth: Math.round(avgWidth),
    };

    // 9. Render Debug Overlay if requested
    if (debugCanvas && settings.showDebugView) {
      this.renderDebugCanvas(debugCanvas, mask, width, height, roiYStart, roiYEnd, linePoints, settings);
    }

    return { position, state };
  }

  /**
   * Evaluates how straight and continuous the points are
   */
  private evaluateContinuity(points: LinePoint[], width: number): number {
    if (points.length < 3) return 0.5;
    let maxJump = 0;
    for (let i = 1; i < points.length; i++) {
      const jump = Math.abs(points[i].x - points[i - 1].x);
      if (jump > maxJump) maxJump = jump;
    }
    // Normalized jump penalty relative to frame width
    const jumpRatio = maxJump / (width * 0.3);
    return Math.max(0, 1 - jumpRatio);
  }

  /**
   * Preprocess RGB to Grayscale with optional Contrast Enhancement
   */
  private preprocessGrayscale(
    src: Uint8ClampedArray,
    dst: Uint8ClampedArray,
    width: number,
    height: number,
    enhanceContrast: boolean
  ) {
    const len = width * height;
    let minLum = 255;
    let maxLum = 0;

    for (let i = 0; i < len; i++) {
      const idx = i << 2;
      // Standard Rec. 601 luma formula
      const gray = (src[idx] * 299 + src[idx + 1] * 587 + src[idx + 2] * 114 + 500) / 1000;
      const gInt = Math.floor(gray);
      dst[i] = gInt;
      if (enhanceContrast) {
        if (gInt < minLum) minLum = gInt;
        if (gInt > maxLum) maxLum = gInt;
      }
    }

    if (enhanceContrast && maxLum > minLum + 20) {
      const range = maxLum - minLum;
      for (let i = 0; i < len; i++) {
        dst[i] = Math.floor(((dst[i] - minLum) / range) * 255);
      }
    }
  }

  /**
   * Separable 1D Gaussian Blur
   */
  private applyGaussianBlur(
    src: Uint8ClampedArray,
    dst: Uint8ClampedArray,
    width: number,
    height: number,
    kernelSize: 3 | 5 | 7,
    sigma: number
  ) {
    // Generate 1D kernel
    const half = Math.floor(kernelSize / 2);
    const kernel = new Float32Array(kernelSize);
    let sum = 0;
    for (let i = -half; i <= half; i++) {
      const val = Math.exp(-(i * i) / (2 * sigma * sigma));
      kernel[i + half] = val;
      sum += val;
    }
    for (let i = 0; i < kernelSize; i++) {
      kernel[i] /= sum;
    }

    const temp = new Float32Array(width * height);

    // Horizontal pass
    for (let y = 0; y < height; y++) {
      const yOffset = y * width;
      for (let x = 0; x < width; x++) {
        let acc = 0;
        for (let k = -half; k <= half; k++) {
          const px = Math.min(width - 1, Math.max(0, x + k));
          acc += src[yOffset + px] * kernel[k + half];
        }
        temp[yOffset + x] = acc;
      }
    }

    // Vertical pass
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let acc = 0;
        for (let k = -half; k <= half; k++) {
          const py = Math.min(height - 1, Math.max(0, y + k));
          acc += temp[py * width + x] * kernel[k + half];
        }
        dst[y * width + x] = Math.round(acc);
      }
    }
  }

  /**
   * HSV Color Segmentation
   */
  private applyColorThreshold(
    rgba: Uint8ClampedArray,
    mask: Uint8Array,
    width: number,
    height: number,
    settings: SettingsModel,
    roiYStart: number
  ) {
    const targetH = settings.targetColor.h;
    const targetS = settings.targetColor.s;
    const targetV = settings.targetColor.v;

    const tolH = settings.colorToleranceHue;
    const tolS = settings.colorToleranceSat;
    const tolV = settings.colorToleranceVal;

    for (let y = roiYStart; y < height; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        const idx = (rowOffset + x) << 2;
        const r = rgba[idx];
        const g = rgba[idx + 1];
        const b = rgba[idx + 2];

        // Fast inline RGB to HSV
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let h = 0;
        if (delta !== 0) {
          if (max === r) {
            h = ((g - b) / delta) % 6;
          } else if (max === g) {
            h = (b - r) / delta + 2;
          } else {
            h = (r - g) / delta + 4;
          }
          h = Math.round(h * 60);
          if (h < 0) h += 360;
        }

        const s = max === 0 ? 0 : Math.round((delta / max) * 100);
        const v = Math.round((max / 255) * 100);

        // Circular hue difference
        let diffH = Math.abs(h - targetH);
        if (diffH > 180) diffH = 360 - diffH;

        const diffS = Math.abs(s - targetS);
        const diffV = Math.abs(v - targetV);

        if (diffH <= tolH && diffS <= tolS && diffV <= tolV) {
          mask[rowOffset + x] = 255;
        } else {
          mask[rowOffset + x] = 0;
        }
      }
    }
  }

  /**
   * Luminance Thresholding (Dark line or Light line) with optional Adaptive Threshold
   */
  private applyLuminanceThreshold(
    gray: Uint8ClampedArray,
    mask: Uint8Array,
    width: number,
    height: number,
    threshold: number,
    isDarkLine: boolean,
    useAdaptive: boolean,
    roiYStart: number
  ) {
    if (!useAdaptive) {
      for (let y = roiYStart; y < height; y++) {
        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
          const lum = gray[rowOffset + x];
          const match = isDarkLine ? lum <= threshold : lum >= threshold;
          mask[rowOffset + x] = match ? 255 : 0;
        }
      }
      return;
    }

    // Adaptive thresholding: local window average
    const windowRadius = 12;
    for (let y = roiYStart; y < height; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        for (let dx = -windowRadius; dx <= windowRadius; dx += 3) {
          const px = x + dx;
          if (px >= 0 && px < width) {
            sum += gray[rowOffset + px];
            count++;
          }
        }
        const localMean = sum / count;
        const lum = gray[rowOffset + x];
        const match = isDarkLine ? lum < localMean - 15 : lum > localMean + 15;
        mask[rowOffset + x] = match ? 255 : 0;
      }
    }
  }

  /**
   * Canny Edge Detection in ROI
   */
  private applyCannyEdges(
    src: Uint8ClampedArray,
    mask: Uint8Array,
    width: number,
    height: number,
    lowThresh: number,
    highThresh: number,
    roiYStart: number
  ) {
    const magnitude = new Float32Array(width * height);
    const orientation = new Uint8Array(width * height);

    // Sobel operator
    for (let y = roiYStart + 1; y < height - 1; y++) {
      const rowAbove = (y - 1) * width;
      const rowCurrent = y * width;
      const rowBelow = (y + 1) * width;

      for (let x = 1; x < width - 1; x++) {
        // Gx
        const gx =
          -src[rowAbove + x - 1] +
          src[rowAbove + x + 1] -
          2 * src[rowCurrent + x - 1] +
          2 * src[rowCurrent + x + 1] -
          src[rowBelow + x - 1] +
          src[rowBelow + x + 1];

        // Gy
        const gy =
          -src[rowAbove + x - 1] -
          2 * src[rowAbove + x] -
          src[rowAbove + x + 1] +
          src[rowBelow + x - 1] +
          2 * src[rowBelow + x] +
          src[rowBelow + x + 1];

        const mag = Math.hypot(gx, gy);
        magnitude[rowCurrent + x] = mag;

        // Angle quantization (0, 45, 90, 135 deg)
        let angle = (Math.atan2(gy, gx) * 180) / Math.PI;
        if (angle < 0) angle += 180;

        if ((angle >= 0 && angle < 22.5) || angle >= 157.5) {
          orientation[rowCurrent + x] = 0; // horizontal
        } else if (angle >= 22.5 && angle < 67.5) {
          orientation[rowCurrent + x] = 1; // 45 deg
        } else if (angle >= 67.5 && angle < 112.5) {
          orientation[rowCurrent + x] = 2; // vertical
        } else {
          orientation[rowCurrent + x] = 3; // 135 deg
        }
      }
    }

    // Non-maximum suppression and Hysteresis
    for (let y = roiYStart + 1; y < height - 1; y++) {
      const rowCurrent = y * width;
      for (let x = 1; x < width - 1; x++) {
        const mag = magnitude[rowCurrent + x];
        if (mag < lowThresh) {
          mask[rowCurrent + x] = 0;
          continue;
        }

        const dir = orientation[rowCurrent + x];
        let q = 0;
        let r = 0;

        if (dir === 0) {
          q = magnitude[rowCurrent + x + 1];
          r = magnitude[rowCurrent + x - 1];
        } else if (dir === 1) {
          q = magnitude[(y + 1) * width + x - 1];
          r = magnitude[(y - 1) * width + x + 1];
        } else if (dir === 2) {
          q = magnitude[(y + 1) * width + x];
          r = magnitude[(y - 1) * width + x];
        } else {
          q = magnitude[(y - 1) * width + x - 1];
          r = magnitude[(y + 1) * width + x + 1];
        }

        if (mag >= q && mag >= r) {
          mask[rowCurrent + x] = mag >= highThresh ? 255 : 128;
        } else {
          mask[rowCurrent + x] = 0;
        }
      }
    }
  }

  /**
   * Extract contiguous candidate line segments on a single scanline
   */
  private extractScanlineSegments(
    mask: Uint8Array,
    y: number,
    width: number,
    minWidth: number,
    maxWidth: number
  ): LinePoint[] {
    const segments: LinePoint[] = [];
    const rowOffset = y * width;
    let inSegment = false;
    let segStart = 0;

    for (let x = 0; x < width; x++) {
      const isPixel = mask[rowOffset + x] > 0;
      if (isPixel && !inSegment) {
        inSegment = true;
        segStart = x;
      } else if (!isPixel && inSegment) {
        inSegment = false;
        const segWidth = x - segStart;
        if (segWidth >= minWidth && segWidth <= maxWidth) {
          segments.push({
            x: Math.round(segStart + segWidth / 2),
            y,
            width: segWidth,
          });
        }
      }
    }

    if (inSegment) {
      const segWidth = width - segStart;
      if (segWidth >= minWidth && segWidth <= maxWidth) {
        segments.push({
          x: Math.round(segStart + segWidth / 2),
          y,
          width: segWidth,
        });
      }
    }

    return segments;
  }

  /**
   * Choose the most spatially consistent segment among candidates
   */
  private chooseBestSegment(
    candidates: LinePoint[],
    width: number,
    existingPoints: LinePoint[],
    lastKnownDeviation: number
  ): LinePoint | null {
    if (candidates.length === 1) return candidates[0];

    // Reference x target
    let targetX = width / 2 + (lastKnownDeviation * width) / 2;
    if (existingPoints.length > 0) {
      // Prioritize proximity to the adjacent scanline above
      targetX = existingPoints[existingPoints.length - 1].x;
    }

    let bestDist = Infinity;
    let bestSegment: LinePoint | null = null;

    for (const c of candidates) {
      const dist = Math.abs(c.x - targetX);
      if (dist < bestDist) {
        bestDist = dist;
        bestSegment = c;
      }
    }

    return bestSegment;
  }

  /**
   * State machine with hysteresis:
   * Translates line position into user navigation command:
   * If line is to the left (negative deviation), user must turn left to align.
   * If line is to the right (positive deviation), user must turn right to align.
   * Within deadZone: locked / on track.
   */
  private updateLineState(
    confidence: number,
    deviation: number,
    settings: SettingsModel
  ): DetectionState {
    // If lost for more than configured loss timeout frames
    if (this.consecutiveLostFrames >= settings.lossTimeoutFrames) {
      return 'lost';
    }

    // If confidence is lower than threshold
    if (confidence < settings.minConfidence) {
      return 'searching';
    }

    const deadZone = settings.deadZone;

    if (Math.abs(deviation) <= deadZone) {
      this.consecutiveLockedFrames++;
      return 'locked';
    } else if (deviation < -deadZone) {
      this.consecutiveLockedFrames = 0;
      return 'turn_left';
    } else {
      this.consecutiveLockedFrames = 0;
      return 'turn_right';
    }
  }

  /**
   * Draws a complete computer vision debug visualization
   */
  private renderDebugCanvas(
    canvas: HTMLCanvasElement,
    mask: Uint8Array,
    width: number,
    height: number,
    roiYStart: number,
    roiYEnd: number,
    points: LinePoint[],
    settings: SettingsModel
  ) {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render binary mask as RGBA
    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const val = mask[i];
      const idx = i << 2;
      imgData.data[idx] = val === 255 ? 38 : val === 128 ? 101 : 11;
      imgData.data[idx + 1] = val === 255 ? 217 : val === 128 ? 136 : 18;
      imgData.data[idx + 2] = val === 255 ? 196 : val === 128 ? 255 : 32;
      imgData.data[idx + 3] = 230;
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw ROI Box
    ctx.strokeStyle = '#6588FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(2, roiYStart, width - 4, roiYEnd - roiYStart - 2);

    // Draw Deadzone lines
    const halfDead = (settings.deadZone * width) / 2;
    ctx.strokeStyle = '#F59E0B';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(width / 2 - halfDead, roiYStart);
    ctx.lineTo(width / 2 - halfDead, roiYEnd);
    ctx.moveTo(width / 2 + halfDead, roiYStart);
    ctx.lineTo(width / 2 + halfDead, roiYEnd);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw scanline centroid points & fitted trajectory
    if (points.length > 0) {
      ctx.strokeStyle = '#26D9C4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      for (const pt of points) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#26D9C4';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pt.x - pt.width / 2, pt.y - 2, pt.width, 4);
      }
    }
  }
}
