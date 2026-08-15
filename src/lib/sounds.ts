import { safeStorage, safeSessionStorage } from '../lib/storage';
/**
 * UI Sound Utility using Web Audio API
 * Generates clean, synthesized sounds for a professional feel without external assets.
 */

class SoundManager {
  private context: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext() {
    if (!this.context) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && typeof AudioContextClass === 'function') {
          this.context = new AudioContextClass();
        } else {
          console.warn("AudioContext not supported or not a constructor");
        }
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
    return this.context;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    safeStorage.setItem('s6_muted', JSON.stringify(muted));
  }

  getMuted() {
    if (typeof window !== 'undefined') {
      const saved = safeStorage.getItem('s6_muted');
      if (saved !== null) return JSON.parse(saved);
    }
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    if (this.getMuted()) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }

  // Light click for navigation
  playClick() {
    if (this.getMuted()) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // Soft pop for revealing content
  playPop() {
    this.playTone(400, 'sine', 0.15, 0.08);
  }

  // Energetic sweep for starting challenge
  playStart() {
    if (this.getMuted()) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.4);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  // Success chime - Sci-fi rising
  playSuccess() {
    if (this.getMuted()) return;
    const now = this.getContext().currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => {
        if (this.getMuted()) return;
        this.playTone(freq, 'sine', 0.2, 0.06);
      }, i * 60);
    });
  }

  // Error thud - Deep bass alert
  playError() {
    if (this.getMuted()) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  // Reminder chime - Soft, repeating alert
  // Notification chime - Clean, modern ping
  playNotification() {
    if (this.getMuted()) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

export const sounds = new SoundManager();
