import { useEffect, useState } from "react";

type TransitionState = { welcome: boolean; goodbye: boolean };
type Listener = (state: TransitionState) => void;

let state: TransitionState = { welcome: false, goodbye: false };
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

export function triggerWelcome() {
  state = { ...state, welcome: true };
  emit();
}

export function triggerGoodbye() {
  state = { ...state, goodbye: true };
  emit();
}

export function clearWelcome() {
  if (!state.welcome) return;
  state = { ...state, welcome: false };
  emit();
}

export function clearGoodbye() {
  if (!state.goodbye) return;
  state = { ...state, goodbye: false };
  emit();
}

export function useAuthTransitions(): TransitionState {
  const [snapshot, setSnapshot] = useState<TransitionState>(state);
  useEffect(() => {
    listeners.add(setSnapshot);
    setSnapshot(state);
    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);
  return snapshot;
}
