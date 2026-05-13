import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/src/lib/supabase";

const AUDIO_BUCKET = "audio-recordings";

/**
 * Uploads a recorded audio file at `uri` to Supabase Storage under
 * `${doctorId}/${informeId}/recording.m4a`. Returns the storage path
 * that we'll pass to /api/process-informe.
 */
export async function uploadRecording(
  uri: string,
  doctorId: string,
  informeId: string,
): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error("Recording file not found");
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = decodeBase64(base64);

  const path = `${doctorId}/${informeId}/recording.m4a`;
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, bytes, {
      contentType: "audio/mp4",
      upsert: true,
    });
  if (error) {
    throw new Error(`Audio upload failed: ${error.message}`);
  }
  return path;
}

// React Native's atob/Buffer are inconsistent across platforms — implement
// base64 → Uint8Array directly so this works in both Hermes and JSC.
function decodeBase64(input: string): Uint8Array {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let bufferLength = Math.floor(input.length * 0.75);
  if (input[input.length - 1] === "=") bufferLength -= 1;
  if (input[input.length - 2] === "=") bufferLength -= 1;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < input.length; i += 4) {
    const e1 = lookup[input.charCodeAt(i)];
    const e2 = lookup[input.charCodeAt(i + 1)];
    const e3 = lookup[input.charCodeAt(i + 2)];
    const e4 = lookup[input.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < bufferLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < bufferLength) bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes;
}
