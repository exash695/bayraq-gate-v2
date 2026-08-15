import { sounds } from "./sounds";

class TTSService {
  private audioContext: AudioContext | null = null;

  private initAudio() {
    if (!this.audioContext) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && typeof AudioContextClass === 'function') {
          this.audioContext = new AudioContextClass();
        } else {
          console.warn("AudioContext not supported or not a constructor");
        }
      } catch (e) {
        console.error("Failed to create AudioContext in TTS:", e);
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  async speak(text: string) {
    if (sounds.getMuted()) return;
    
    try {
      this.fallbackSpeak(text);
    } catch (error) {
      console.error("TTS Error:", error);
    }
  }

  private fallbackSpeak(text: string) {
    if (sounds.getMuted()) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Fallback TTS Error:", e);
    }
  }
}

export const tts = new TTSService();
