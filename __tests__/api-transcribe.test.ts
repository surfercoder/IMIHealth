const mockPost = jest.fn();
jest.mock("@/src/lib/api/client", () => ({
  api: {
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

import { transcribeAudio } from "@/src/lib/api/transcribe";

beforeEach(() => {
  mockPost.mockReset();
});

describe("transcribeAudio", () => {
  it("posts to /api/transcribe with audio path and language", async () => {
    mockPost.mockResolvedValue({ transcript: "hola" });
    const result = await transcribeAudio("doctor/informe/recording.m4a", "es");
    expect(mockPost).toHaveBeenCalledWith("/api/transcribe", {
      audioPath: "doctor/informe/recording.m4a",
      language: "es",
    });
    expect(result).toBe("hola");
  });

  it("falls back to empty string when transcript is missing", async () => {
    mockPost.mockResolvedValue({});
    const result = await transcribeAudio("p", "en");
    expect(result).toBe("");
  });
});
