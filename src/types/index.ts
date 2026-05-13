export type InformeStatus = "recording" | "processing" | "completed" | "error";

export interface Doctor {
  id: string;
  name: string;
  email: string;
  dni: string | null;
  matricula: string;
  phone: string;
  especialidad: string;
  tagline: string | null;
  firma_digital: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  doctor_id: string;
  name: string;
  dni: string | null;
  dob: string | null;
  phone: string | null;
  email: string | null;
  obra_social: string | null;
  nro_afiliado: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientWithStats {
  id: string;
  name: string;
  dni: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  obra_social: string | null;
  nro_afiliado: string | null;
  plan: string | null;
  created_at: string;
  informe_count: number;
  last_informe_at: string | null;
  last_informe_status: string | null;
}

export interface Informe {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  status: InformeStatus;
  informe_doctor: string | null;
  informe_paciente: string | null;
  recording_duration: number | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  totalPatients: number;
  totalInformes: number;
  completedCount: number;
  processingCount: number;
  errorCount: number;
}

export interface ChartData {
  patientsOverTime: { date: string; total: number }[];
  consultationTime: {
    avg: number;
    min: number;
    max: number;
    data: { date: string; minutes: number }[];
  };
  patientsAccumulator: {
    current: { date: string; patients: number }[];
    average: number;
  };
  informTypes: { type: "classic" | "quick"; count: number }[];
}
