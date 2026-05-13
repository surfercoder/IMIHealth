import { useEffect, useReducer } from "react";
import { getPatient } from "@/src/lib/api/patients";
import { listInformesByPatient } from "@/src/lib/api/informes";
import type { Informe, Patient } from "@/src/types";

interface PatientDetailState {
  patient: Patient | null;
  informes: Informe[];
  loading: boolean;
}

type PatientDetailAction =
  | { type: "start" }
  | { type: "loaded"; patient: Patient | null; informes: Informe[] };

function reducer(state: PatientDetailState, action: PatientDetailAction): PatientDetailState {
  switch (action.type) {
    case "start":
      return { ...state, loading: true };
    case "loaded":
      return { patient: action.patient, informes: action.informes, loading: false };
  }
}

const initialState: PatientDetailState = { patient: null, informes: [], loading: true };

export function usePatientDetail(patientId: string | undefined) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let active = true;
    if (!patientId) return undefined;
    dispatch({ type: "start" });
    Promise.all([getPatient(patientId), listInformesByPatient(patientId)]).then(
      ([p, list]) => {
        if (!active) return;
        dispatch({ type: "loaded", patient: p, informes: list });
      },
    );
    return () => {
      active = false;
    };
  }, [patientId]);

  return state;
}
