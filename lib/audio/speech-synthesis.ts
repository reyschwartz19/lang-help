let synth: SpeechSynthesis | null = null;
let frVoice: SpeechSynthesisVoice | null = null;

const initVoice = () => {
  if (!synth) return;
  const voices = synth.getVoices();
  frVoice = voices.find(v => v.lang.startsWith('fr-FR') || v.lang.startsWith('fr')) || null;
};

export const playAudio = (text: string, rate: number = 1.0) => {
  if (typeof window === 'undefined') return;
  
  if (!synth) {
    synth = window.speechSynthesis;
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = initVoice;
    }
    initVoice();
  }

  synth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  if (frVoice) {
    utterance.voice = frVoice;
  }
  utterance.rate = rate; // 1.0 is normal, 0.7 for slowed down
  
  synth.speak(utterance);
};

export const stopAudio = () => {
  if (typeof window === 'undefined') return;
  if (synth) synth.cancel();
};
