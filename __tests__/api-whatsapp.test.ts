import {
  sendCertificadoWhatsApp,
  sendInformeWhatsApp,
  sendPedidosWhatsApp,
} from "@/src/lib/api/whatsapp";

jest.mock("@/src/lib/api/client", () => ({
  api: { post: jest.fn() },
}));

import { api } from "@/src/lib/api/client";
const post = api.post as jest.Mock;

beforeEach(() => post.mockReset().mockResolvedValue({ success: true }));

describe("whatsapp api", () => {
  it("sendInformeWhatsApp posts type=informe", async () => {
    await sendInformeWhatsApp({ to: "+1", informeId: "i", patientName: "p", locale: "es" });
    expect(post).toHaveBeenCalledWith(
      "/api/send-whatsapp",
      expect.objectContaining({ type: "informe", informeId: "i" }),
    );
  });

  it("sendCertificadoWhatsApp passes certOptions", async () => {
    await sendCertificadoWhatsApp({
      to: "+1",
      informeId: "i",
      patientName: "p",
      locale: "en",
      certOptions: { daysOff: 3, diagnosis: "x", observations: null },
    });
    expect(post).toHaveBeenCalledWith(
      "/api/send-whatsapp",
      expect.objectContaining({
        type: "certificado",
        certOptions: { daysOff: 3, diagnosis: "x", observations: null },
      }),
    );
  });

  it("sendPedidosWhatsApp posts pedidoItems", async () => {
    await sendPedidosWhatsApp({
      to: "+1",
      informeId: "i",
      patientName: "p",
      locale: "es",
      pedidoItems: ["a", "b"],
    });
    expect(post).toHaveBeenCalledWith(
      "/api/send-whatsapp",
      expect.objectContaining({ type: "pedidos", pedidoItems: ["a", "b"] }),
    );
  });
});
