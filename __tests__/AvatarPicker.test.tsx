import { fireEvent, render, waitFor } from "@testing-library/react-native";

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

const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  __esModule: true,
  default: { alert: (...a: unknown[]) => mockAlert(...a) },
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

import { AvatarPicker } from "@/src/components/AvatarPicker";

beforeEach(() => {
  mockRequestPermission.mockReset();
  mockLaunch.mockReset();
  mockManipulate.mockReset();
  mockAlert.mockReset();
});

describe("AvatarPicker", () => {
  it("handles denied permission", async () => {
    mockRequestPermission.mockResolvedValue({ status: "denied" });
    const onChange = jest.fn();
    const { getByText } = render(<AvatarPicker onChange={onChange} />);
    fireEvent.press(getByText("avatarUpload.upload"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancels picker without calling onChange", async () => {
    mockRequestPermission.mockResolvedValue({ status: "granted" });
    mockLaunch.mockResolvedValue({ canceled: true, assets: [] });
    const onChange = jest.fn();
    const { getByText } = render(<AvatarPicker onChange={onChange} />);
    fireEvent.press(getByText("avatarUpload.upload"));
    await waitFor(() => expect(mockLaunch).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("alerts when processing returns no base64", async () => {
    mockRequestPermission.mockResolvedValue({ status: "granted" });
    mockLaunch.mockResolvedValue({ canceled: false, assets: [{ uri: "x" }] });
    mockManipulate.mockResolvedValue({});
    const { getByText } = render(<AvatarPicker onChange={jest.fn()} />);
    fireEvent.press(getByText("avatarUpload.upload"));
    await waitFor(() =>
      expect(mockAlert).toHaveBeenCalledWith("avatarUpload.processingFailed"),
    );
  });

  it("alerts when file too large", async () => {
    mockRequestPermission.mockResolvedValue({ status: "granted" });
    mockLaunch.mockResolvedValue({ canceled: false, assets: [{ uri: "x" }] });
    // ~9 MB base64 string => > 5MB cutoff.
    const big = "A".repeat(9 * 1024 * 1024);
    mockManipulate.mockResolvedValue({ base64: big });
    const { getByText } = render(<AvatarPicker onChange={jest.fn()} />);
    fireEvent.press(getByText("avatarUpload.upload"));
    await waitFor(() =>
      expect(mockAlert).toHaveBeenCalledWith("avatarUpload.tooLarge"),
    );
  });

  it("successfully picks and emits data URL", async () => {
    mockRequestPermission.mockResolvedValue({ status: "granted" });
    mockLaunch.mockResolvedValue({ canceled: false, assets: [{ uri: "x" }] });
    mockManipulate.mockResolvedValue({ base64: "abcd" });
    const onChange = jest.fn();
    const { getByText } = render(<AvatarPicker onChange={onChange} />);
    fireEvent.press(getByText("avatarUpload.upload"));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0]).toMatch(/^data:image\/jpeg;base64,abcd$/);
  });

  it("alerts when manipulator throws", async () => {
    mockRequestPermission.mockResolvedValue({ status: "granted" });
    mockLaunch.mockResolvedValue({ canceled: false, assets: [{ uri: "x" }] });
    mockManipulate.mockRejectedValue(new Error("boom"));
    const { getByText } = render(<AvatarPicker onChange={jest.fn()} />);
    fireEvent.press(getByText("avatarUpload.upload"));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
  });

  it("shows remove button when value present and clears via onChange(null)", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <AvatarPicker value="data:..." onChange={onChange} />,
    );
    fireEvent.press(getByText("avatarUpload.remove"));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
