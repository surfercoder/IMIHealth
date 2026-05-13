import { useCallback, useEffect, useReducer } from "react";
import { useAuth } from "@/src/providers/AuthProvider";
import { getDoctor } from "@/src/lib/api/doctors";
import type { Doctor } from "@/src/types";

type DoctorUpdater = Doctor | null | ((prev: Doctor | null) => Doctor | null);

interface DoctorState {
  doctor: Doctor | null;
  loading: boolean;
}

type DoctorAction =
  | { type: "loaded"; doctor: Doctor | null }
  | { type: "clear" }
  | { type: "set"; updater: (prev: Doctor | null) => Doctor | null };

function reducer(state: DoctorState, action: DoctorAction): DoctorState {
  switch (action.type) {
    case "loaded":
      return { doctor: action.doctor, loading: false };
    case "clear":
      return { doctor: null, loading: false };
    case "set":
      return { ...state, doctor: action.updater(state.doctor) };
  }
}

const initialState: DoctorState = { doctor: null, loading: true };

export function useDoctor() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let active = true;
    if (!user) {
      dispatch({ type: "clear" });
      return undefined;
    }
    getDoctor(user.id).then((d) => {
      if (active) dispatch({ type: "loaded", doctor: d });
    });
    return () => {
      active = false;
    };
  }, [user]);

  const setDoctor = useCallback((next: DoctorUpdater) => {
    const updater = typeof next === "function" ? next : () => next;
    dispatch({ type: "set", updater });
  }, []);

  return { doctor: state.doctor, loading: state.loading, setDoctor };
}
