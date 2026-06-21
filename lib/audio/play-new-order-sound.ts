function playFallbackTone(label: string) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.36);
  } catch (error) {
    console.warn(`Failed to play fallback ${label} notification sound`, error);
  }
}

function playOrderSound(src: string, label: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.8;

    void audio.play().catch((error) => {
      console.warn(`Failed to play ${label} notification sound`, error);
      playFallbackTone(label);
    });
  } catch (error) {
    console.warn(`Failed to play ${label} notification sound`, error);
    playFallbackTone(label);
  }
}

export function playNewOrderSound() {
  playOrderSound("/sounds/new-order.mp3", "new order");
}
