import { useEffect, useReducer, useRef } from "react";
import { Alert } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export type RecorderPhase =
  | "idle"
  | "requesting"
  | "permissionDenied"
  | "recording"
  | "paused"
  | "stopped";

interface RecorderState {
  phase: RecorderPhase;
  durationMs: number;
}

type RecorderAction =
  | { type: "setPhase"; phase: RecorderPhase }
  | { type: "tick"; durationMs: number }
  | { type: "startRecording" }
  | { type: "finishRecording"; durationMs: number }
  | { type: "reset" };

function reducer(state: RecorderState, action: RecorderAction): RecorderState {
  switch (action.type) {
    case "setPhase":
      return { ...state, phase: action.phase };
    case "tick":
      return { ...state, durationMs: action.durationMs };
    case "startRecording":
      return { phase: "recording", durationMs: 0 };
    case "finishRecording":
      return { phase: "stopped", durationMs: action.durationMs };
    case "reset":
      return { phase: "idle", durationMs: 0 };
  }
}

const initialState: RecorderState = { phase: "idle", durationMs: 0 };

export function useRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [state, dispatch] = useReducer(reducer, initialState);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "setPhase", phase: "requesting" });

    AudioModule.requestRecordingPermissionsAsync().then((status) => {
      if (cancelled) return undefined;
      if (!status.granted) {
        dispatch({ type: "setPhase", phase: "permissionDenied" });
        Alert.alert(
          "Microphone permission required",
          "Enable microphone access in Settings to record consultations.",
        );
        return undefined;
      }
      return setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      }).then(() => {
        if (!cancelled) dispatch({ type: "setPhase", phase: "idle" });
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.phase !== "recording") return undefined;
    const tick = setInterval(() => {
      dispatch({ type: "tick", durationMs: Date.now() - startedAtRef.current! });
    }, 250);
    return () => clearInterval(tick);
  }, [state.phase]);

  async function start() {
    if (state.phase === "permissionDenied") return;
    await recorder.prepareToRecordAsync();
    recorder.record();
    startedAtRef.current = Date.now();
    dispatch({ type: "startRecording" });
  }

  async function stop(): Promise<{ uri: string | null; durationMs: number }> {
    if (!recorderState.isRecording && state.phase !== "paused") {
      return { uri: recorder.uri ?? null, durationMs: state.durationMs };
    }
    await recorder.stop();
    const final = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : state.durationMs;
    startedAtRef.current = null;
    dispatch({ type: "finishRecording", durationMs: final });
    return { uri: recorder.uri ?? null, durationMs: final };
  }

  function reset() {
    startedAtRef.current = null;
    dispatch({ type: "reset" });
  }

  return {
    phase: state.phase,
    durationMs: state.durationMs,
    isRecording: recorderState.isRecording,
    start,
    stop,
    reset,
  };
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}
