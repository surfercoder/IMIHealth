import { uploadRecording } from "@/src/lib/api/audio";

const mockGetInfoAsync = jest.fn();
const mockReadAsStringAsync = jest.fn();

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
  EncodingType: { Base64: "base64" },
}));

const mockUpload = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({ upload: (...args: unknown[]) => mockUpload(...args) }),
    },
  },
}));

beforeEach(() => {
  mockGetInfoAsync.mockReset();
  mockReadAsStringAsync.mockReset();
  mockUpload.mockReset();
});

describe("uploadRecording", () => {
  it("uploads the recording and returns the storage path", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockReadAsStringAsync.mockResolvedValue("AAAA");
    mockUpload.mockResolvedValue({ error: null });
    const path = await uploadRecording("file://x", "d", "i");
    expect(path).toBe("d/i/recording.m4a");
    expect(mockUpload).toHaveBeenCalledWith(
      "d/i/recording.m4a",
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "audio/mp4", upsert: true }),
    );
  });

  it("throws if file does not exist", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    await expect(uploadRecording("file://x", "d", "i")).rejects.toThrow(
      "Recording file not found",
    );
  });

  it("throws when supabase upload fails", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockReadAsStringAsync.mockResolvedValue("AAAA");
    mockUpload.mockResolvedValue({ error: { message: "oops" } });
    await expect(uploadRecording("file://x", "d", "i")).rejects.toThrow(
      "Audio upload failed: oops",
    );
  });

  it("decodes base64 padded with =", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    // "AAAA" => 3 bytes; "AAA=" => 2 bytes; "AA==" => 1 byte.
    mockReadAsStringAsync.mockResolvedValue("AAA=");
    mockUpload.mockResolvedValue({ error: null });
    await uploadRecording("file://x", "d", "i");
    const bytes = mockUpload.mock.calls[0][1] as Uint8Array;
    expect(bytes.length).toBe(2);
  });

  it("decodes base64 padded with ==", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockReadAsStringAsync.mockResolvedValue("AA==");
    mockUpload.mockResolvedValue({ error: null });
    await uploadRecording("file://x", "d", "i");
    const bytes = mockUpload.mock.calls[0][1] as Uint8Array;
    expect(bytes.length).toBe(1);
  });
});
