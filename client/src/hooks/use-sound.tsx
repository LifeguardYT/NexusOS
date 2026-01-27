import { useCallback, useRef } from "react";
import { useOS } from "@/lib/os-context";

type SoundType = "click" | "notify" | "error" | "success" | "windowOpen" | "windowClose" | "startup" | "shutdown";

const soundUrls: Record<SoundType, string> = {
  click: "data:audio/wav;base64,UklGRl9vT19teleVkaVIgZcm...",
  notify: "",
  error: "",
  success: "",
  windowOpen: "",
  windowClose: "",
  startup: "",
  shutdown: "",
};

const audioContext = typeof window !== "undefined" ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function createBeep(frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.1): void {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.value = volume;
  
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration);
}

export function useSound() {
  const { soundEnabled, settings } = useOS();
  const lastPlayed = useRef<Record<string, number>>({});
  
  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled || settings.volume === 0) return;
    
    const now = Date.now();
    if (lastPlayed.current[type] && now - lastPlayed.current[type] < 50) return;
    lastPlayed.current[type] = now;
    
    const volume = (settings.volume / 100) * 0.2;
    
    switch (type) {
      case "click":
        createBeep(800, 0.05, "sine", volume);
        break;
      case "notify":
        createBeep(880, 0.1, "sine", volume);
        setTimeout(() => createBeep(1100, 0.1, "sine", volume), 100);
        break;
      case "error":
        createBeep(200, 0.15, "square", volume * 0.5);
        setTimeout(() => createBeep(150, 0.15, "square", volume * 0.5), 150);
        break;
      case "success":
        createBeep(523, 0.08, "sine", volume);
        setTimeout(() => createBeep(659, 0.08, "sine", volume), 80);
        setTimeout(() => createBeep(784, 0.12, "sine", volume), 160);
        break;
      case "windowOpen":
        createBeep(400, 0.05, "sine", volume * 0.7);
        setTimeout(() => createBeep(600, 0.08, "sine", volume * 0.7), 50);
        break;
      case "windowClose":
        createBeep(500, 0.05, "sine", volume * 0.5);
        setTimeout(() => createBeep(350, 0.08, "sine", volume * 0.5), 50);
        break;
      case "startup":
        createBeep(330, 0.15, "sine", volume);
        setTimeout(() => createBeep(440, 0.15, "sine", volume), 150);
        setTimeout(() => createBeep(550, 0.15, "sine", volume), 300);
        setTimeout(() => createBeep(660, 0.25, "sine", volume), 450);
        break;
      case "shutdown":
        createBeep(660, 0.15, "sine", volume);
        setTimeout(() => createBeep(550, 0.15, "sine", volume), 150);
        setTimeout(() => createBeep(440, 0.15, "sine", volume), 300);
        setTimeout(() => createBeep(330, 0.3, "sine", volume * 0.5), 450);
        break;
    }
  }, [soundEnabled, settings.volume]);
  
  return { playSound, soundEnabled };
}
