import { supabase } from "@/src/lib/supabase";
import type { Patient, PatientWithStats } from "@/src/types";

export interface PatientInput {
  name: string;
  dni?: string | null;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  obra_social?: string | null;
  nro_afiliado?: string | null;
  plan?: string | null;
}

function clean(input: PatientInput): Record<string, string | null> {
  const out: Record<string, string | null> = { name: input.name.trim() };
  for (const key of [
    "dni",
    "dob",
    "phone",
    "email",
    "obra_social",
    "nro_afiliado",
    "plan",
  ] as const) {
    const v = input[key];
    out[key] = v == null || (typeof v === "string" && v.trim() === "")
      ? null
      : (v as string).trim();
  }
  return out;
}

export async function createPatient(
  doctorId: string,
  input: PatientInput,
): Promise<Patient> {
  const { data, error } = await supabase
    .from("patients")
    .insert({ ...clean(input), doctor_id: doctorId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Patient;
}

export async function updatePatient(
  id: string,
  input: PatientInput,
): Promise<Patient> {
  const { data, error } = await supabase
    .from("patients")
    .update(clean(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Patient;
}

export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type PatientRowWithInformes = Omit<Patient, "doctor_id" | "updated_at"> & {
  informes?: { created_at: string; status: string }[] | null;
};

export async function listPatientsWithStats(
  doctorId: string,
): Promise<PatientWithStats[]> {
  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, name, dni, email, phone, dob, obra_social, nro_afiliado, plan, created_at, informes(created_at, status)",
    )
    .eq("doctor_id", doctorId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[patients.list]", error);
    return [];
  }

  return ((data ?? []) as PatientRowWithInformes[]).map((p) => {
    const informes = p.informes ?? [];
    const sorted = informes
      .slice()
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    return {
      id: p.id,
      name: p.name,
      dni: p.dni,
      email: p.email,
      phone: p.phone,
      dob: p.dob,
      obra_social: p.obra_social,
      nro_afiliado: p.nro_afiliado,
      plan: p.plan,
      created_at: p.created_at,
      informe_count: informes.length,
      last_informe_at: sorted[0]?.created_at ?? null,
      last_informe_status: sorted[0]?.status ?? null,
    };
  });
}

export async function getPatient(patientId: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .maybeSingle();
  if (error) {
    console.error("[patients.get]", error);
    return null;
  }
  return data as Patient | null;
}
