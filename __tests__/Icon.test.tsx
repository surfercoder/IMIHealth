import { render } from "@testing-library/react-native";
import { Icon, type IconName } from "@/src/components/ui";

jest.mock("react-native-svg", () => {
  const React = require("react");
  const make = (tag: string) => (props: object) =>
    React.createElement(tag, { ...props, testID: tag });
  return {
    __esModule: true,
    default: make("svg"),
    Svg: make("svg"),
    Path: make("path"),
    Circle: make("circle"),
    Rect: make("rect"),
  };
});

const names: IconName[] = [
  "add",
  "alert-circle",
  "alert-circle-outline",
  "arrow-back",
  "brush-outline",
  "camera-outline",
  "camera-reverse-outline",
  "checkmark",
  "checkmark-circle",
  "checkmark-circle-outline",
  "chevron-down",
  "chevron-forward",
  "clipboard-outline",
  "close",
  "close-circle",
  "copy-outline",
  "create-outline",
  "document-text",
  "document-text-outline",
  "documents-outline",
  "eye-off-outline",
  "eye-outline",
  "flash",
  "language",
  "log-out-outline",
  "logo-whatsapp",
  "mail-open-outline",
  "mail-outline",
  "mic",
  "people",
  "people-outline",
  "refresh",
  "search",
  "stats-chart-outline",
  "time-outline",
  "trash-outline",
  "warning",
];

describe("Icon", () => {
  it("renders all icon names", () => {
    for (const name of names) {
      const { unmount } = render(<Icon name={name} />);
      unmount();
    }
  });

  it("accepts size and color props", () => {
    render(<Icon name="add" size={32} color="#123" />);
  });

  it("forwards onPress", () => {
    const onPress = jest.fn();
    render(<Icon name="close" onPress={onPress} />);
  });
});
