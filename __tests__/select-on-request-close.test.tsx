import { fireEvent, render } from "@testing-library/react-native";

jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: function MockModal(props: {
      visible: boolean;
      children: React.ReactNode;
      onRequestClose?: () => void;
    }) {
      React.useEffect(() => {
        if (props.visible) props.onRequestClose?.();
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

import { Select } from "@/src/components/ui";

describe("Select onRequestClose handler", () => {
  it("fires when modal requests close", () => {
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
  });
});
