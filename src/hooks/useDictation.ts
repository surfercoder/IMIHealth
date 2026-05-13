import { useCallback, useEffect, useReducer, useRef } from "react";
import { Platform } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

const KEEP_AWAKE_TAG = "imi-dictation";

export type DictationPhase = "idle" | "recording" | "paused";

interface State {
  phase: DictationPhase;
  durationMs: number;
  liveTranscript: string;
  error: string | null;
}

type Action =
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset" }
  | { type: "tick"; durationMs: number }
  | { type: "setTranscript"; transcript: string }
  | { type: "setError"; error: string | null };

const initialState: State = {
  phase: "idle",
  durationMs: 0,
  liveTranscript: "",
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { phase: "recording", durationMs: 0, liveTranscript: "", error: null };
    case "pause":
      return { ...state, phase: "paused" };
    case "resume":
      return { ...state, phase: "recording" };
    case "tick":
      return { ...state, durationMs: action.durationMs };
    case "setTranscript":
      return { ...state, liveTranscript: action.transcript };
    case "setError":
      return { ...state, error: action.error };
    case "reset":
      return initialState;
  }
}

interface StartOptions {
  language: string;
}

export interface UseDictationResult {
  phase: DictationPhase;
  durationMs: number;
  liveTranscript: string;
  error: string | null;
  start: (opts: StartOptions) => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  stop: () => string;
  reset: () => void;
}

export function useDictation(): UseDictationResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const elapsedBeforePauseRef = useRef<number>(0);
  const segmentStartRef = useRef<number | null>(null);
  const langRef = useRef<string>("es-AR");
  const listenersRef = useRef<Array<{ remove: () => void }>>([]);
  const shouldKeepRecognizingRef = useRef<boolean>(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearListeners = useCallback(() => {
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
  }, []);

  const attachListeners = useCallback(() => {
    clearListeners();
    const onStart = ExpoSpeechRecognitionModule.addListener("start", () => {
      console.log("[dictation] start");
    });
    const onAudioStart = ExpoSpeechRecognitionModule.addListener(
      "audiostart",
      () => {
        console.log("[dictation] audiostart");
      },
    );
    const onSpeechStart = ExpoSpeechRecognitionModule.addListener(
      "speechstart",
      () => {
        console.log("[dictation] speechstart");
      },
    );
    const onEnd = ExpoSpeechRecognitionModule.addListener("end", () => {
      console.log("[dictation] end");
      if (shouldKeepRecognizingRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (shouldKeepRecognizingRef.current) {
            try {
              ExpoSpeechRecognitionModule.start({
                lang: langRef.current,
                interimResults: true,
                continuous: true,
                maxAlternatives: 1,
                ...(Platform.OS === "ios"
                  ? { iosTaskHint: "dictation" as const }
                  : {}),
              });
            } catch (e) {
              console.warn("[dictation] restart failed", e);
            }
          }
        }, 100);
      }
    });
    const onResult = ExpoSpeechRecognitionModule.addListener(
      "result",
      (event: ExpoSpeechRecognitionResultEvent) => {
        const piece = event.results[0]?.transcript ?? "";
        console.log("[dictation] result", { piece, isFinal: event.isFinal });
        if (event.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current}${piece} `;
          interimTranscriptRef.current = "";
        } else {
          interimTranscriptRef.current = piece;
        }
        dispatch({
          type: "setTranscript",
          transcript: (finalTranscriptRef.current + interimTranscriptRef.current).trim(),
        });
      },
    );
    const onError = ExpoSpeechRecognitionModule.addListener("error", (event) => {
      console.warn("[dictation] error:", event.error, event.message);
      // Transient errors that happen during continuous-mode session cycling.
      // SFSpeechRecognizer ends each utterance with "no-speech" / "speech-timeout"
      // and can briefly emit "busy" / "interrupted" / "Failed to initialize"
      // between auto-restarts. We only surface persistent failures.
      const transient =
        event.error === "no-speech" ||
        event.error === "aborted" ||
        event.error === "busy" ||
        event.error === "interrupted" ||
        event.error === "speech-timeout" ||
        /failed to initialize/i.test(event.message ?? "");
      // Unrecoverable errors — stop the auto-restart loop so we don't spam.
      const unrecoverable =
        event.error === "language-not-supported" ||
        event.error === "not-allowed" ||
        event.error === "service-not-allowed" ||
        event.error === "audio-capture";
      if (unrecoverable) {
        shouldKeepRecognizingRef.current = false;
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = null;
        }
      }
      if (!transient) {
        dispatch({
          type: "setError",
          error: event.message || event.error || "Speech recognition error",
        });
      }
    });
    listenersRef.current = [
      onStart,
      onAudioStart,
      onSpeechStart,
      onEnd,
      onResult,
      onError,
    ];
  }, [clearListeners]);

  const startRecognition = useCallback(() => {
    attachListeners();
    ExpoSpeechRecognitionModule.start({
      lang: langRef.current,
      interimResults: true,
      continuous: true,
      maxAlternatives: 1,
      ...(Platform.OS === "ios" ? { iosTaskHint: "dictation" as const } : {}),
    });
  }, [attachListeners]);

  const start = useCallback(
    async ({ language }: StartOptions) => {
      langRef.current = language;
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      elapsedBeforePauseRef.current = 0;

      const mic = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!mic.granted) {
        throw new Error("Microphone permission denied");
      }
      if (Platform.OS === "ios") {
        const speech =
          await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();
        if (!speech.granted) {
          throw new Error("Speech recognition permission denied");
        }
      }

      segmentStartRef.current = Date.now();
      shouldKeepRecognizingRef.current = true;
      dispatch({ type: "start" });
      startRecognition();
    },
    [startRecognition],
  );

  const pause = useCallback(() => {
    if (segmentStartRef.current != null) {
      elapsedBeforePauseRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    shouldKeepRecognizingRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    dispatch({ type: "pause" });
  }, []);

  const resume = useCallback(async () => {
    segmentStartRef.current = Date.now();
    shouldKeepRecognizingRef.current = true;
    dispatch({ type: "resume" });
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    shouldKeepRecognizingRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    clearListeners();
    segmentStartRef.current = null;
    const transcript = (finalTranscriptRef.current + interimTranscriptRef.current).trim();
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    return transcript;
  }, [clearListeners]);

  const reset = useCallback(() => {
    shouldKeepRecognizingRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    clearListeners();
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    elapsedBeforePauseRef.current = 0;
    segmentStartRef.current = null;
    dispatch({ type: "reset" });
  }, [clearListeners]);

  useEffect(() => {
    if (state.phase !== "recording") return undefined;
    const interval = setInterval(() => {
      const live =
        segmentStartRef.current != null ? Date.now() - segmentStartRef.current : 0;
      dispatch({
        type: "tick",
        durationMs: elapsedBeforePauseRef.current + live,
      });
    }, 250);
    return () => clearInterval(interval);
  }, [state.phase]);

  useEffect(() => {
    const shouldKeepAwake = state.phase === "recording" || state.phase === "paused";
    if (!shouldKeepAwake) return undefined;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [state.phase]);

  useEffect(() => {
    return () => {
      shouldKeepRecognizingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // ignore
      }
      clearListeners();
    };
  }, [clearListeners]);

  return {
    phase: state.phase,
    durationMs: state.durationMs,
    liveTranscript: state.liveTranscript,
    error: state.error,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
