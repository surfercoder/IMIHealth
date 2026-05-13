import { api } from "@/src/lib/api/client";

interface SendResponse {
  success: boolean;
  error?: string;
  messageId?: string;
  imageSent?: boolean;
  sentCount?: number;
  totalItems?: number;
}

export interface CertOptions {
  daysOff: number | null;
  diagnosis: string | null;
  observations: string | null;
}

interface SendInformeParams {
  to: string;
  informeId: string;
  patientName: string;
  locale: string;
}

interface SendCertificadoParams extends SendInformeParams {
  certOptions: CertOptions;
}

interface SendPedidosParams extends SendInformeParams {
  pedidoItems: string[];
}

interface SendPedidosPatientParams {
  to: string;
  patientId: string;
  patientName: string;
  locale: string;
  pedidoItems: string[];
  diagnostico: string | null;
}

/**
 * Sends the patient inform via WhatsApp. Server generates PDF + PNG and uses
 * the doctor's template. Matches the web payload shape (see
 * imihealth-web/src/app/api/send-whatsapp/route.ts).
 */
export async function sendInformeWhatsApp(params: SendInformeParams): Promise<SendResponse> {
  return api.post<SendResponse>("/api/send-whatsapp", {
    to: params.to,
    type: "informe",
    informeId: params.informeId,
    patientName: params.patientName,
    locale: params.locale,
  });
}

export async function sendCertificadoWhatsApp(
  params: SendCertificadoParams,
): Promise<SendResponse> {
  return api.post<SendResponse>("/api/send-whatsapp", {
    to: params.to,
    type: "certificado",
    informeId: params.informeId,
    patientName: params.patientName,
    locale: params.locale,
    certOptions: params.certOptions,
  });
}

export async function sendPedidosWhatsApp(params: SendPedidosParams): Promise<SendResponse> {
  return api.post<SendResponse>("/api/send-whatsapp", {
    to: params.to,
    type: "pedidos",
    informeId: params.informeId,
    patientName: params.patientName,
    locale: params.locale,
    pedidoItems: params.pedidoItems,
  });
}

export async function sendPedidosPatientWhatsApp(
  params: SendPedidosPatientParams,
): Promise<SendResponse> {
  return api.post<SendResponse>("/api/send-whatsapp", {
    to: params.to,
    type: "pedidos-patient",
    patientId: params.patientId,
    patientName: params.patientName,
    locale: params.locale,
    pedidoItems: params.pedidoItems,
    diagnostico: params.diagnostico,
  });
}
