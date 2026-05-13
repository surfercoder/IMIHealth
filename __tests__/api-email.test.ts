import { sendEmail } from "@/src/lib/api/email";

jest.mock("@/src/lib/api/client", () => ({
  api: { post: jest.fn() },
}));

import { api } from "@/src/lib/api/client";
const post = api.post as jest.Mock;

describe("sendEmail", () => {
  it("posts to /api/send-email with the params", async () => {
    post.mockResolvedValue({ success: true });
    const res = await sendEmail({
      to: "x@y.z",
      subject: "S",
      text: "T",
    });
    expect(post).toHaveBeenCalledWith("/api/send-email", {
      to: "x@y.z",
      subject: "S",
      text: "T",
    });
    expect(res.success).toBe(true);
  });
});
