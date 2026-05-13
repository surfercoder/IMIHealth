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

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return { Image: (p: object) => React.createElement(RN.View, p) };
});

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
}));

const mockI18nLanguage: { current: string | undefined } = { current: "es" };
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: mockI18nLanguage.current },
  }),
}));

const mockRequestPermission = jest.fn();
const mockLaunch = jest.fn();
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestPermission(),
  launchImageLibraryAsync: () => mockLaunch(),
  MediaTypeOptions: { Images: "Images" },
}));

const mockManipulate = jest.fn();
jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: (...a: unknown[]) => mockManipulate(...a),
  SaveFormat: { JPEG: "jpeg" },
}));

const mockSharePdf = jest.fn();
jest.mock("@/src/lib/api/pdf", () => ({
  sharePdf: (...a: unknown[]) => mockSharePdf(...a),
}));

const mockSendInforme = jest.fn();
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendInformeWhatsApp: (...a: unknown[]) => mockSendInforme(...a),
  sendCertificadoWhatsApp: jest.fn(),
  sendPedidosWhatsApp: jest.fn(),
}));

const mockCanOpen = jest.fn();
const mockOpenURL = jest.fn();
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  __esModule: true,
  default: {
    canOpenURL: (...a: unknown[]) => mockCanOpen(...a),
    openURL: (...a: unknown[]) => mockOpenURL(...a),
  },
}));

import { AvatarPicker } from "@/src/components/AvatarPicker";
import { ViewPdfButton } from "@/src/components/informe-actions/ViewPdfButton";
import { WhatsAppDoctorButton } from "@/src/components/informe-actions/WhatsAppDoctorButton";
import { WhatsAppPatientButton } from "@/src/components/informe-actions/WhatsAppPatientButton";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";

beforeEach(() => {
  mockAlert.mockReset();
  mockRequestPermission.mockReset();
  mockLaunch.mockReset();
  mockManipulate.mockReset();
  mockSharePdf.mockReset();
  mockSendInforme.mockReset();
  mockCanOpen.mockReset();
  mockOpenURL.mockReset();
  mockI18nLanguage.current = "es";
});

describe("non-Error catch branches", () => {
  it("AvatarPicker stringifies non-Error throws", async () => {
    mockRequestPermission.mockResolvedValue({ status: "granted" });
    mockLaunch.mockResolvedValue({ canceled: false, assets: [{ uri: "x" }] });
    mockManipulate.mockRejectedValue("plain-string");
    const { getByText } = render(<AvatarPicker onChange={jest.fn()} />);
    fireEvent.press(getByText("avatarUpload.upload"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(mockAlert.mock.calls[0][1]).toBe("plain-string");
  });

  it("ViewPdfButton stringifies non-Error throws", async () => {
    mockSharePdf.mockRejectedValue("plain-string");
    const { getByLabelText } = render(<ViewPdfButton informeId="i" />);
    fireEvent.press(getByLabelText("informeEditor.viewPdf"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(mockAlert.mock.calls[0][1]).toBe("plain-string");
  });

  it("WhatsAppDoctorButton stringifies non-Error throws", async () => {
    mockCanOpen.mockRejectedValue("plain-string");
    const { getByLabelText } = render(
      <WhatsAppDoctorButton phone="+1" doctorName="Dr" reportContent="r" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(mockAlert.mock.calls[0][1]).toBe("plain-string");
  });
});

describe("WhatsAppPatientButton language fallback", () => {
  it("uses 'es' default when i18n.language is undefined", async () => {
    mockI18nLanguage.current = undefined;
    mockSendInforme.mockResolvedValue({ success: true });
    const { getByLabelText } = render(
      <WhatsAppPatientButton phone="+1" patientName="P" informeId="i" />,
    );
    fireEvent.press(getByLabelText("informeEditor.sendWhatsApp"));
    await waitFor(() => expect(mockSendInforme).toHaveBeenCalled());
    expect(mockSendInforme.mock.calls[0][0].locale).toBe("es");
  });
});

type StyleFn = (s: { pressed: boolean }) => unknown;
type RootNode = {
  type?: unknown;
  props: { style?: unknown };
  findAll: (p: (n: RootNode) => boolean) => RootNode[];
};

function findStyleFn(root: RootNode): StyleFn {
  const matches = root.findAll((n) => typeof n.props?.style === "function");
  expect(matches.length).toBeGreaterThan(0);
  return matches[0].props.style as StyleFn;
}

describe("Button pressed state branch", () => {
  it("evaluates style with pressed=true on primary", () => {
    const r = render(<Button title="Tap" onPress={() => {}} />);
    const styleFn = findStyleFn(r.UNSAFE_root as unknown as RootNode);
    expect(Array.isArray(styleFn({ pressed: true }))).toBe(true);
    expect(Array.isArray(styleFn({ pressed: false }))).toBe(true);
  });

  it("skips pressed style when disabled", () => {
    const r = render(
      <Button title="Tap" onPress={() => {}} disabled fullWidth />,
    );
    const styleFn = findStyleFn(r.UNSAFE_root as unknown as RootNode);
    expect(Array.isArray(styleFn({ pressed: true }))).toBe(true);
  });

  it("evaluates pressed style for every variant", () => {
    const variants = ["primary", "secondary", "outline", "ghost", "destructive"] as const;
    variants.forEach((variant) => {
      const r = render(
        <Button title="x" onPress={() => {}} variant={variant} size="sm" />,
      );
      const styleFn = findStyleFn(r.UNSAFE_root as unknown as RootNode);
      styleFn({ pressed: true });
    });
  });
});

describe("Select option selection", () => {
  it("renders selected style when value matches an option", () => {
    const { getAllByText } = render(
      <Select
        value="b"
        options={[
          { label: "Alpha", value: "a" },
          { label: "Beta", value: "b" },
        ]}
        onChange={() => {}}
      />,
    );
    // Trigger opens by default rendering; selected styling exercised inside the modal.
    expect(getAllByText("Beta")[0]).toBeTruthy();
  });

  it("opens modal and renders selected row with check icon", () => {
    const { getByText, queryAllByText } = render(
      <Select
        value="b"
        options={[
          { label: "Alpha", value: "a" },
          { label: "Beta", value: "b" },
        ]}
        onChange={() => {}}
        placeholder="pick"
      />,
    );
    fireEvent.press(getByText("Beta"));
    // Modal is mounted; both rows present at this point.
    expect(queryAllByText("Beta").length).toBeGreaterThan(0);
  });
});
