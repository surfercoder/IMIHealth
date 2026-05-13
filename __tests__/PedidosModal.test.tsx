import { fireEvent, render, waitFor } from "@testing-library/react-native";

jest.mock("react-native-svg", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (p: object) => React.createElement("svg", p),
    Svg: (p: object) => React.createElement("svg", p),
    Path: (p: object) => React.createElement("path", p),
    Circle: (p: object) => React.createElement("circle", p),
    Rect: (p: object) => React.createElement("rect", p),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

const mockSharePdf = jest.fn();
jest.mock("@/src/lib/api/pdf", () => ({
  sharePdf: (...a: unknown[]) => mockSharePdf(...a),
}));

const mockSendPedidos = jest.fn();
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendPedidosWhatsApp: (...a: unknown[]) => mockSendPedidos(...a),
}));

import { PedidosModal } from "@/src/components/informe-actions/PedidosModal";

const informeDoctor = "PLAN:\nEstudios:\n- Hemograma\n- Radiografía\n";

beforeEach(() => {
  mockAlert.mockReset();
  mockSharePdf.mockReset();
  mockSendPedidos.mockReset();
});

describe("PedidosModal", () => {
  it("disables generate when no items", () => {
    const { getByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor=""
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
  });

  it("generates and lists items, then shares merged + per-item", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    const { getByText, getAllByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor={informeDoctor}
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() => expect(getByText("Hemograma")).toBeTruthy());
    const viewButtons = getAllByText("pedidos.viewOnline");
    fireEvent.press(viewButtons[0]);
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "pedido", item: "Hemograma" }),
    ));
    fireEvent.press(getByText("informePage.viewPdf"));
    await waitFor(() => expect(mockSharePdf).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "pedidos" }),
    ));
  });

  it("alerts on share-item failure", async () => {
    mockSharePdf.mockRejectedValue(new Error("nope"));
    const { getByText, getAllByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={informeDoctor}
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() => expect(getByText("Hemograma")).toBeTruthy());
    fireEvent.press(getAllByText("pedidos.viewOnline")[0]);
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("alerts on share-merged failure", async () => {
    mockSharePdf.mockRejectedValue(new Error("merged"));
    const { getByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={informeDoctor}
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() => expect(getByText("informePage.viewPdf")).toBeTruthy());
    fireEvent.press(getByText("informePage.viewPdf"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("sends WhatsApp on success/failure/exception", async () => {
    mockSharePdf.mockResolvedValue(undefined);
    mockSendPedidos.mockResolvedValueOnce({ success: true });
    const { getByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone="+1"
        informeDoctor={informeDoctor}
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() => expect(getByText("whatsappPedidosButton.label")).toBeTruthy());
    fireEvent.press(getByText("whatsappPedidosButton.label"));
    await waitFor(() => expect(mockSendPedidos).toHaveBeenCalled());

    mockSendPedidos.mockResolvedValueOnce({ success: false, error: "x" });
    fireEvent.press(getByText("whatsappPedidosButton.label"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());

    mockSendPedidos.mockRejectedValueOnce(new Error("net"));
    fireEvent.press(getByText("whatsappPedidosButton.label"));
    await waitFor(() => expect(mockAlert.mock.calls.length).toBeGreaterThan(1));
  });

  it("generate-another resets to the form view", async () => {
    const { getByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor={informeDoctor}
      />,
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() => expect(getByText("pedidos.generateAnother")).toBeTruthy());
    fireEvent.press(getByText("pedidos.generateAnother"));
    await waitFor(() =>
      expect(getByText(/^pedidos\.generate/)).toBeTruthy(),
    );
  });

  it("cancel and close trigger onClose", () => {
    const onClose = jest.fn();
    const { getByText, getByLabelText } = render(
      <PedidosModal
        visible
        onClose={onClose}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor=""
      />,
    );
    fireEvent.press(getByText("pedidos.cancel"));
    fireEvent.press(getByLabelText("common.cancel"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("typing items text updates the generate count", async () => {
    const { getByPlaceholderText, getByText } = render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor=""
      />,
    );
    fireEvent.changeText(
      getByPlaceholderText("pedidos.itemsPlaceholder"),
      "- A\n- B",
    );
    fireEvent.press(getByText(/^pedidos\.generate/));
    await waitFor(() => expect(getByText("A")).toBeTruthy());
  });
});
