import { api } from "@/src/lib/api/client";

interface TranscribeResponse {
  transcript: string;
}

export async function transcribeAudio(
  audioPath: string,
  language: string,
): Promise<string> {
  const res = await api.post<TranscribeResponse>("/api/transcribe", {
    audioPath,
    language,
  });
  return res.transcript ?? "";
}
