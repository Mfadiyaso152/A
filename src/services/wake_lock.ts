export class WakeLockManager {
  private sentinel: WakeLockSentinel | null = null;
  private isRequested = false;

  public async requestLock(): Promise<boolean> {
    this.isRequested = true;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      if (!this.sentinel) {
        this.sentinel = await navigator.wakeLock.request('screen');
        this.sentinel.addEventListener('release', () => {
          this.sentinel = null;
          // Re-acquire if still requested when returning to tab
          if (this.isRequested && document.visibilityState === 'visible') {
            this.requestLock();
          }
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  public releaseLock() {
    this.isRequested = false;
    if (this.sentinel) {
      try {
        this.sentinel.release();
      } catch {
        // ignore
      }
      this.sentinel = null;
    }
  }
}

export const wakeLockManager = new WakeLockManager();
