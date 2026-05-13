import { supabase } from "@/src/lib/supabase";
import { api } from "@/src/lib/api/client";
import type { Informe } from "@/src/types";

export async function createInforme(
  doctorId: string,
  patientId: string | null,
): Promise<Informe> {
  const { data, error } = await supabase
    .from("informes")
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      status: "recording",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Informe;
}

interface ProcessParams {
  informeId: string;
  audioPath: string | null;
  browserTranscript?: string;
  language?: string;
  recordingDuration?: number | null;
}

export async function processInforme(
  params: ProcessParams,
): Promise<{ success?: boolean; transcriptionFailed?: boolean; insufficientContent?: boolean }> {
  return api.post("/api/process-informe", {
    informeId: params.informeId,
    audioPath: params.audioPath,
    browserTranscript: params.browserTranscript ?? "",
    language: params.language ?? "es",
    recordingDuration: params.recordingDuration ?? null,
  });
}

export async function deleteInforme(id: string): Promise<void> {
  const { error } = await supabase.from("informes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateInformeContent(
  id: string,
  patch: { informe_doctor?: string; informe_paciente?: string },
): Promise<void> {
  const { error } = await supabase.from("informes").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getInforme(id: string): Promise<Informe | null> {
  const { data, error } = await supabase
    .from("informes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[informes.get]", error);
    return null;
  }
  return data as Informe | null;
}

export async function listInformesByPatient(
  patientId: string,
): Promise<Informe[]> {
  const { data, error } = await supabase
    .from("informes")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[informes.byPatient]", error);
    return [];
  }
  return (data ?? []) as Informe[];
}
