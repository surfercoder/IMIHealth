import { fireEvent, render } from "@testing-library/react-native";

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return { Image: (p: object) => React.createElement(RN.View, p) };
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
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockClear = jest.fn();
const mockRead = jest.fn();

jest.mock("react-native-signature-canvas", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef((_props: object, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        clearSignature: mockClear,
        readSignature: mockRead,
      }));
      return React.createElement(RN.View, { testID: "signature" });
    }),
  };
});

import { SignaturePad } from "@/src/components/SignaturePad";

beforeEach(() => {
  mockClear.mockReset();
  mockRead.mockReset();
});

describe("SignaturePad", () => {
  it("renders the placeholder when no value", () => {
    const { getByText } = render(<SignaturePad onChange={() => {}} />);
    expect(getByText("signatureField.placeholder")).toBeTruthy();
  });

  it("renders the preview when value is present and clears via delete", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SignaturePad value="data:image/png;base64,xxx" onChange={onChange} />,
    );
    fireEvent.press(getByText("common.delete"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("opens the modal from the placeholder and triggers clear/save handlers", () => {
    const { getByText } = render(<SignaturePad onChange={() => {}} />);
    fireEvent.press(getByText("signatureField.placeholder"));
    fireEvent.press(getByText("signatureField.clear"));
    fireEvent.press(getByText("common.save"));
    expect(mockClear).toHaveBeenCalled();
    expect(mockRead).toHaveBeenCalled();
  });

  it("change-signature opens the modal from preview view", () => {
    const { getByText } = render(
      <SignaturePad value="data:..." onChange={() => {}} />,
    );
    fireEvent.press(getByText("profilePage.changeSignature"));
  });
});
