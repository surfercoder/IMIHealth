import { supabase } from "@/src/lib/supabase";
import type { ChartData, DashboardSummary } from "@/src/types";

export async function getDashboardSummary(
  doctorId: string,
): Promise<DashboardSummary> {
  const [patients, informes] = await Promise.all([
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", doctorId),
    supabase
      .from("informes")
      .select("id, status")
      .eq("doctor_id", doctorId),
  ]);

  const rows = (informes.data ?? []) as { status: string }[];

  return {
    totalPatients: patients.count ?? 0,
    totalInformes: rows.length,
    completedCount: rows.filter((r) => r.status === "completed").length,
    processingCount: rows.filter(
      (r) => r.status === "processing" || r.status === "recording",
    ).length,
    errorCount: rows.filter((r) => r.status === "error").length,
  };
}

export async function getDashboardChartData(
  doctorId: string,
): Promise<ChartData> {
  const [{ data: patients }, { data: informes }, { data: generationLog }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("id, created_at")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: true }),
      supabase
        .from("informes")
        .select("id, created_at, updated_at, status, recording_duration")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: true }),
      supabase
        .from("inform_generation_log")
        .select("inform_type")
        .eq("doctor_id", doctorId),
    ]);

  const allPatients = (patients ?? []) as { created_at: string }[];
  const allInformes = (informes ?? []) as {
    created_at: string;
    updated_at: string;
    status: string;
    recording_duration: number | null;
  }[];

  const patientsByDate = new Map<string, number>();
  let cumulative = 0;
  for (const p of allPatients) {
    const date = new Date(p.created_at).toISOString().split("T")[0];
    cumulative++;
    patientsByDate.set(date, cumulative);
  }
  const patientsOverTime = Array.from(patientsByDate.entries()).map(
    ([date, total]) => ({ date, total }),
  );

  const completedInformes = allInformes.filter((i) => i.status === "completed");
  const durations: { date: string; minutes: number }[] = [];
  for (const inf of completedInformes) {
    let mins: number;
    if (inf.recording_duration != null) {
      mins = inf.recording_duration / 60;
    } else {
      const created = new Date(inf.created_at).getTime();
      const updated = new Date(inf.updated_at).getTime();
      mins = (updated - created) / 60000;
    }
    if (mins > 0 && mins < 60) {
      durations.push({
        date: new Date(inf.created_at).toISOString().split("T")[0],
        minutes: Math.round(mins * 10) / 10,
      });
    }
  }

  const durationValues = durations.map((d) => d.minutes);
  const consultationTime = {
    avg:
      durationValues.length > 0
        ? Math.round(
            (durationValues.reduce((a, b) => a + b, 0) /
              durationValues.length) *
              10,
          ) / 10
        : 0,
    min: durationValues.length > 0 ? Math.min(...durationValues) : 0,
    max: durationValues.length > 0 ? Math.max(...durationValues) : 0,
    data: durations,
  };

  const dailyCounts = new Map<string, number>();
  for (const p of allPatients) {
    const date = new Date(p.created_at).toISOString().split("T")[0];
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
  }
  const dailyEntries = Array.from(dailyCounts.entries()).map(
    ([date, patients]) => ({ date, patients }),
  );
  const avgPerDay =
    dailyEntries.length > 0
      ? Math.round(
          (dailyEntries.reduce((a, b) => a + b.patients, 0) /
            dailyEntries.length) *
            10,
        ) / 10
      : 0;

  const allLog = (generationLog ?? []) as { inform_type: string }[];
  const classicCount = allLog.filter((l) => l.inform_type === "classic").length;
  const quickCount = allLog.filter((l) => l.inform_type === "quick").length;

  return {
    patientsOverTime,
    consultationTime,
    patientsAccumulator: { current: dailyEntries, average: avgPerDay },
    informTypes: [
      { type: "classic", count: classicCount },
      { type: "quick", count: quickCount },
    ],
  };
}
