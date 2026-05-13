import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getApiBaseUrl } from "@/src/lib/api/client";
import { supabase } from "@/src/lib/supabase";

interface CertificadoPdfOptions {
  daysOff?: number | null;
  diagnosis?: string | null;
  observations?: string | null;
}

type PdfKind =
  | { kind: "doctor"; informeId: string }
  | { kind: "patient"; informeId: string }
  | { kind: "certificado"; informeId: string; options?: CertificadoPdfOptions }
  | { kind: "pedido"; informeId: string; item?: string }
  | { kind: "pedidos"; informeId: string; items?: string[] }
  | { kind: "pedidos-patient"; patientId: string };

function buildUrl(target: PdfKind): { url: string; filename: string } {
  const base = getApiBaseUrl();
  switch (target.kind) {
    case "doctor":
      // Web doesn't expose a separate doctor PDF route — only `informe` (patient)
      // and certificado/pedido. Reuse `informe` here; callers wanting the
      // doctor markdown should fall back to clipboard / share text.
      return {
        url: `${base}/api/pdf/informe?id=${encodeURIComponent(target.informeId)}`,
        filename: `informe-${target.informeId}.pdf`,
      };
    case "patient":
      return {
        url: `${base}/api/pdf/informe?id=${encodeURIComponent(target.informeId)}`,
        filename: `informe-paciente-${target.informeId}.pdf`,
      };
    case "certificado": {
      const params = new URLSearchParams({ id: target.informeId });
      const opts = target.options ?? {};
      if (opts.daysOff != null) params.set("daysOff", String(opts.daysOff));
      if (opts.diagnosis) params.set("diagnosis", opts.diagnosis);
      if (opts.observations) params.set("observations", opts.observations);
      return {
        url: `${base}/api/pdf/certificado?${params.toString()}`,
        filename: `certificado-${target.informeId}.pdf`,
      };
    }
    case "pedido": {
      const params = new URLSearchParams({ id: target.informeId });
      if (target.item) params.set("item", target.item);
      return {
        url: `${base}/api/pdf/pedido?${params.toString()}`,
        filename: `pedido-${target.informeId}.pdf`,
      };
    }
    case "pedidos": {
      const params = new URLSearchParams({ id: target.informeId });
      for (const item of target.items ?? []) params.append("item", item);
      return {
        url: `${base}/api/pdf/pedidos?${params.toString()}`,
        filename: `pedidos-${target.informeId}.pdf`,
      };
    }
    case "pedidos-patient":
      return {
        url: `${base}/api/pdf/pedidos-patient?patientId=${encodeURIComponent(target.patientId)}`,
        filename: `pedidos-paciente-${target.patientId}.pdf`,
      };
  }
}

async function downloadPdf(target: PdfKind): Promise<string> {
  const { url, filename } = buildUrl(target);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "";
  const stamp = Date.now().toString(36);
  const dest = `${cacheDir}${stamp}-${filename}`;

  const dl = await FileSystem.downloadAsync(url, dest, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (dl.status < 200 || dl.status >= 300) {
    throw new Error(`PDF download failed (${dl.status})`);
  }
  return dl.uri;
}

export async function sharePdf(target: PdfKind): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return;
  const uri = await downloadPdf(target);
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Share PDF",
  });
}
