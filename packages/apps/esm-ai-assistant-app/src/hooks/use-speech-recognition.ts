// =============================================================================
//  @egen-civitas/esm-ai-assistant-app — useSpeechRecognition
//
//  Utilise l'API Web Speech native du navigateur (SpeechRecognition /
//  webkitSpeechRecognition) — aucune dépendance tierce, aucun appel réseau
//  supplémentaire côté EGEN. Support variable selon navigateur (Chrome/Edge
//  oui, Firefox/Safari partiel ou absent) : le hook expose `supported` pour
//  que l'UI masque le bouton micro si indisponible, plutôt que d'afficher un
//  bouton qui ne fonctionnerait pas.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  interimTranscript: string;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition(
  locale: string,
  onFinalTranscript: (text: string) => void,
): UseSpeechRecognitionResult {
  const Ctor = useRef(getSpeechRecognitionCtor());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!Ctor.current || listening) return;

    const recognition = new Ctor.current();
    recognition.lang = locale || 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        onFinalTranscript(final.trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [locale, listening, onFinalTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported: Ctor.current !== null, listening, interimTranscript, start, stop };
}
