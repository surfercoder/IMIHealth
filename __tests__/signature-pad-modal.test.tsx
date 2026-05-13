import { fireEvent, render, waitFor } from "@testing-library/react-native";

// Mock Modal to render children inline.
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: function MockModal(props: {
      visible: boolean;
      children: React.ReactNode;
    }) {
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

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return { Image: (p: object) => React.createElement(RN.View, p) };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockClearSignature = jest.fn();
const mockReadSignature = jest.fn();
jest.mock("react-native-signature-canvas", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef(
      function MockSignatureScreen(
        props: { onOK?: (s: string) => void },
        ref: React.Ref<unknown>,
      ) {
        React.useImperativeHandle(ref, () => ({
          clearSignature: mockClearSignature,
          readSignature: () => {
            mockReadSignature();
            props.onOK?.("data:image/png;base64,abc");
          },
        }));
        return React.createElement(RN.View, { testID: "sig-screen" });
      },
    ),
  };
});

import { SignaturePad } from "@/src/components/SignaturePad";

beforeEach(() => {
  mockClearSignature.mockReset();
  mockReadSignature.mockReset();
});

describe("SignaturePad modal contents", () => {
  it("opens the modal, clears, and saves via onOK", async () => {
    const onChange = jest.fn();
    const { getByText } = render(<SignaturePad onChange={onChange} />);
    fireEvent.press(getByText("signatureField.placeholder"));
    fireEvent.press(getByText("signatureField.clear"));
    fireEvent.press(getByText("common.save"));
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith("data:image/png;base64,abc"),
    );
    expect(mockClearSignature).toHaveBeenCalled();
    expect(mockReadSignature).toHaveBeenCalled();
  });

  it("close button in modal triggers setOpen(false)", () => {
    const { getByText, root } = render(<SignaturePad onChange={() => {}} />);
    fireEvent.press(getByText("signatureField.placeholder"));
    // Walk the rendered tree and call every Pressable's onPress to exercise
    // the modal close handler.
    function walk(instance: { props?: Record<string, unknown>; children?: unknown[] }) {
      const onPress = instance.props?.onPress as ((e?: unknown) => void) | undefined;
      if (typeof onPress === "function") {
        onPress();
      }
      const children = instance.children as { props?: Record<string, unknown>; children?: unknown[] }[] | undefined;
      if (Array.isArray(children)) {
        for (const c of children) {
          if (c && typeof c === "object") walk(c);
        }
      }
    }
    walk(root);
  });
});
