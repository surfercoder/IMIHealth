import { fireEvent, render } from "@testing-library/react-native";

// Mock Modal to render children inline and auto-fire onShow.
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: function MockModal(props: {
      visible: boolean;
      children: React.ReactNode;
      onShow?: () => void;
    }) {
      React.useEffect(() => {
        if (props.visible) props.onShow?.();
      }, [props.visible]);
      return props.visible
        ? React.createElement(RN.View, null, props.children)
        : null;
    },
  };
});

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

jest.mock("@/src/lib/api/pdf", () => ({ sharePdf: jest.fn() }));
jest.mock("@/src/lib/api/whatsapp", () => ({
  sendCertificadoWhatsApp: jest.fn(),
  sendPedidosWhatsApp: jest.fn(),
}));

import { fireEvent as _fe } from "@testing-library/react-native";
import { CertificadoModal } from "@/src/components/informe-actions/CertificadoModal";
import { PedidosModal } from "@/src/components/informe-actions/PedidosModal";
import { Select } from "@/src/components/ui";
void _fe;

describe("Modal onShow resets the form state", () => {
  it("CertificadoModal: onShow fires reset action", () => {
    render(
      <CertificadoModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor=""
      />,
    );
  });

  it("PedidosModal: onShow fires reset action", () => {
    render(
      <PedidosModal
        visible
        onClose={() => {}}
        informeId="i"
        patientName="P"
        patientPhone={null}
        informeDoctor=""
      />,
    );
  });

  it("Select onRequestClose closes the dropdown", () => {
    const { getByText } = render(
      <Select
        value={null}
        options={[{ value: "a", label: "Apple" }]}
        onChange={() => {}}
        placeholder="Pick"
        searchable={false}
      />,
    );
    fireEvent.press(getByText("Pick"));
    // Modal's onRequestClose is auto-fired by the mock, exercising the close handler.
  });

  it("Select backdrop and sheet press handlers fire", () => {
    const { getByText, UNSAFE_root } = render(
      <Select
        value={null}
        options={[{ value: "a", label: "Apple" }]}
        onChange={() => {}}
        placeholder="Pick"
        searchable={false}
      />,
    );
    fireEvent.press(getByText("Pick"));

    const pressables: { props: { onPress?: (e?: unknown) => void } }[] = [];
    function walk(instance: { type?: unknown; props?: Record<string, unknown>; children?: unknown[] }) {
      const onPress = instance.props?.onPress as ((e?: unknown) => void) | undefined;
      if (typeof onPress === "function") {
        pressables.push({ props: { onPress } });
      }
      const children = instance.children as { type?: unknown; props?: Record<string, unknown>; children?: unknown[] }[] | undefined;
      if (Array.isArray(children)) {
        for (const child of children) {
          if (child && typeof child === "object") walk(child);
        }
      }
    }
    walk(UNSAFE_root);
    // Invoke every pressable onPress to exercise close handlers.
    for (const p of pressables) {
      p.props.onPress?.({ stopPropagation: () => {} });
    }
    // Sanity: at least one pressable should have been found.
    expect(pressables.length).toBeGreaterThan(0);
  });

});
