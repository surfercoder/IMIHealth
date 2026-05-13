import { api } from "@/src/lib/api/client";

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  return api.post<SendEmailResponse>("/api/send-email", params);
}
