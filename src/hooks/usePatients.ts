import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/providers/AuthProvider";
import { listPatientsWithStats } from "@/src/lib/api/patients";
import type { PatientWithStats } from "@/src/types";

export function usePatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!user) return;
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      const rows = await listPatientsWithStats(user.id);
      setPatients(rows);
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  const refresh = useCallback(() => load("refresh"), [load]);

  useEffect(() => {
    load("initial");
  }, [load]);

  return {
    patients,
    loading,
    refreshing,
    refresh,
  };
}
