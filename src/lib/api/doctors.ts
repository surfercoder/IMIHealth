import { supabase } from "@/src/lib/supabase";
import type { Doctor } from "@/src/types";

export async function getDoctor(userId: string): Promise<Doctor | null> {
  const { data, error } = await supabase
    .from("doctors")
    .select(
      "id, name, email, dni, matricula, phone, especialidad, tagline, firma_digital, avatar, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[doctors.getDoctor]", error);
    return null;
  }
  return data as Doctor | null;
}

export async function updateDoctor(
  userId: string,
  patch: Partial<Pick<Doctor, "name" | "matricula" | "phone" | "especialidad" | "tagline" | "avatar" | "dni" | "firma_digital">>,
): Promise<Doctor | null> {
  const { data, error } = await supabase
    .from("doctors")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();
  if (error) {
    console.error("[doctors.updateDoctor]", error);
    return null;
  }
  return data as Doctor;
}
