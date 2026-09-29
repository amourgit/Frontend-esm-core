/**
 * Low-Latency Streaming Audio Player & Strict FIFO Sentence Queue
 * - File d'attente FIFO stricte : chaque phrase est lue entièrement jusqu'au bout.
 * - Débit naturel et articulé (rate = 0.96) sans précipitation ni coupures.
 * - Gestion du streaming : enchaîne fluidement les phrases sans interruption.
 * - Protection anti-freeze du SpeechSynthesis du navigateur.
 */

export interface AudioPlaybackEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
  onVolumeChange?: (volumePercent: number) => void;
}

export class AudioPlayerService {
  private isCurrentlyPlaying: boolean = false;
  private queue: string[] = [];
  private isStreamingOpen: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private events: AudioPlaybackEvents;
  private volumeTimer: number | null = null;
  private keepAliveTimer: number | null = null;
  private safetyTimeoutId: number | null = null;

  constructor(events: AudioPlaybackEvents = {}) {
    this.events = events;
  }

  public setEvents(events: AudioPlaybackEvents) {
    this.events = { ...this.events, ...events };
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  /**
   * Ouvre une nouvelle session de streaming de phrases pour une réponse
   */
  public startStreamingSession() {
    this.stop();
    this.queue = [];
    this.isStreamingOpen = true;
  }

  /**
   * Enfile une phrase complète générée par Gemini dans la file FIFO
   */
  public enqueueSentence(rawText: string) {
    const clean = this.cleanForSpeech(rawText);
    if (!clean) return;

    // Découpe en phrases bien formées si plusieurs phrases sont arrivées ensemble
    const sentences = this.splitIntoGrammaticalSentences(clean);
    for (const s of sentences) {
      if (s.trim().length > 0) {
        this.queue.push(s.trim());
      }
    }

    // Démarre la lecture si le moteur est au repos
    if (!this.isCurrentlyPlaying) {
      this.playNextInQueue();
    }
  }

  /**
   * Signale que Gemini a achevé toute la génération du texte
   */
  public finishStreamingSession() {
    this.isStreamingOpen = false;
    if (!this.isCurrentlyPlaying && this.queue.length === 0) {
      this.handleAllFinished();
    }
  }

  /**
   * Joue immédiatement un texte complet (mode direct non-streamé)
   */
  public speakTextFallback(text: string, onEndCallback?: () => void): void {
    this.stop();
    this.enqueueSentence(text);
    this.finishStreamingSession();
    if (onEndCallback) {
      const origOnEnd = this.events.onEnd;
      this.events.onEnd = () => {
        if (origOnEnd) origOnEnd();
        onEndCallback();
      };
    }
  }

  /**
   * Dépile et joue la prochaine phrase de la file FIFO de manière verrouillée
   */
  private playNextInQueue() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.handleAllFinished();
      return;
    }

    if (this.queue.length === 0) {
      if (!this.isStreamingOpen) {
        this.handleAllFinished();
      }
      return;
    }

    const textToSpeak = this.queue.shift();
    if (!textToSpeak || textToSpeak.trim().length === 0) {
      this.playNextInQueue();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'fr-FR';
    // Rythme calme, posé, très clair et compréhensible
    utterance.rate = 0.96;
    utterance.pitch = 1.0;

    // Sélection d'une voix française naturelle de qualité
    const voices = window.speechSynthesis.getVoices();
    const frVoice =
      voices.find(
        (v) =>
          (v.lang.startsWith('fr') || v.lang.includes('FR')) &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Premium') ||
            v.name.includes('Audrey') ||
            v.name.includes('Thomas') ||
            v.name.includes('Henri'))
      ) || voices.find((v) => v.lang.startsWith('fr'));

    if (frVoice) {
      utterance.voice = frVoice;
    }

    this.isCurrentlyPlaying = true;
    if (this.events.onStart) this.events.onStart();
    this.startSimulatedVolume();
    this.startKeepAlive();

    // Définition d'un safety timeout proportionnel à la longueur du texte
    const expectedDurationMs = Math.max(3000, (textToSpeak.length / 12) * 1000 + 2000);
    this.clearSafetyTimeout();
    this.safetyTimeoutId = window.setTimeout(() => {
      if (this.currentUtterance === utterance) {
        console.warn('[AudioPlayer] Fin de phrase par délai de sécurité');
        this.onSentenceEnded();
      }
    }, expectedDurationMs);

    utterance.onstart = () => {
      this.isCurrentlyPlaying = true;
    };

    utterance.onend = () => {
      this.clearSafetyTimeout();
      this.onSentenceEnded();
    };

    utterance.onerror = (e) => {
      console.warn('[AudioPlayer] Erreur synthèse:', e);
      this.clearSafetyTimeout();
      this.onSentenceEnded();
    };

    this.currentUtterance = utterance;

    // Déblocage si la synthèse vocale du navigateur était en pause
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[AudioPlayer] Erreur déclenchement speak:', err);
      this.onSentenceEnded();
    }
  }

  private onSentenceEnded() {
    this.currentUtterance = null;
    this.clearSafetyTimeout();

    if (this.queue.length > 0) {
      // Petite pause naturelle de 100ms entre les phrases
      setTimeout(() => {
        this.playNextInQueue();
      }, 100);
    } else {
      if (!this.isStreamingOpen) {
        this.handleAllFinished();
      } else {
        // En attente des phrases suivantes en streaming
        this.isCurrentlyPlaying = false;
        this.stopSimulatedVolume();
      }
    }
  }

  private handleAllFinished() {
    this.isCurrentlyPlaying = false;
    this.stopSimulatedVolume();
    this.stopKeepAlive();
    this.clearSafetyTimeout();
    if (this.events.onEnd) {
      this.events.onEnd();
    }
  }

  /**
   * Arrête immédiatement toute synthèse en cours et vide la file
   */
  public stop(): void {
    this.queue = [];
    this.isStreamingOpen = false;
    this.isCurrentlyPlaying = false;
    this.currentUtterance = null;
    this.stopSimulatedVolume();
    this.stopKeepAlive();
    this.clearSafetyTimeout();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  private splitIntoGrammaticalSentences(text: string): string[] {
    // Découpage propre par ponctuation forte
    const matches = text.match(/[^.!?:\n]+[.!?:\n]+/g);
    if (!matches || matches.length === 0) {
      return [text.trim()];
    }
    const result: string[] = [];
    let remainder = text;
    for (const m of matches) {
      result.push(m.trim());
      remainder = remainder.replace(m, '');
    }
    if (remainder.trim().length > 0) {
      result.push(remainder.trim());
    }
    return result.filter((s) => s.length > 0);
  }

  private cleanForSpeech(text: string): string {
    return text
      .replace(/[*#_`~[\]()<>]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private startSimulatedVolume() {
    this.stopSimulatedVolume();
    this.volumeTimer = window.setInterval(() => {
      if (this.events.onVolumeChange) {
        const vol = Math.floor(35 + Math.random() * 50);
        this.events.onVolumeChange(vol);
      }
    }, 100);
  }

  private stopSimulatedVolume() {
    if (this.volumeTimer) {
      clearInterval(this.volumeTimer);
      this.volumeTimer = null;
    }
    if (this.events.onVolumeChange) {
      this.events.onVolumeChange(0);
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveTimer = window.setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 5000);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private clearSafetyTimeout() {
    if (this.safetyTimeoutId) {
      clearTimeout(this.safetyTimeoutId);
      this.safetyTimeoutId = null;
    }
  }
}
