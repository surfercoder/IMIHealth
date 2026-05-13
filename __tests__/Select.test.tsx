import { fireEvent, render } from "@testing-library/react-native";
import { Select } from "@/src/components/ui";

jest.mock("react-native-svg", () => {
  const React = require("react");
  const make = () => (props: object) => React.createElement("svg", props);
  return {
    __esModule: true,
    default: make(),
    Svg: make(),
    Path: make(),
    Circle: make(),
    Rect: make(),
  };
});

const options = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry" },
];

describe("Select", () => {
  it("renders the placeholder when no value", () => {
    const { getByText } = render(
      <Select
        value={null}
        options={options}
        onChange={() => {}}
        placeholder="Pick"
        searchPlaceholder="search"
        emptyLabel="none"
      />,
    );
    expect(getByText("Pick")).toBeTruthy();
  });

  it("renders the selected label", () => {
    const { getByText } = render(
      <Select
        value="b"
        options={options}
        onChange={() => {}}
        placeholder="Pick"
      />,
    );
    expect(getByText("Banana")).toBeTruthy();
  });

  it("opens, searches, selects, and closes the modal", () => {
    const onChange = jest.fn();
    const { getByText, getByPlaceholderText, queryByText } = render(
      <Select
        value={null}
        options={options}
        onChange={onChange}
        placeholder="Pick"
        searchPlaceholder="search"
        emptyLabel="empty"
      />,
    );
    fireEvent.press(getByText("Pick"));
    fireEvent.changeText(getByPlaceholderText("search"), "ban");
    fireEvent.press(getByText("Banana"));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(queryByText("Apple")).toBeNull();
  });

  it("renders without search input when searchable=false", () => {
    const { getByText } = render(
      <Select
        value={null}
        options={options}
        onChange={() => {}}
        placeholder="Pick"
        searchable={false}
      />,
    );
    fireEvent.press(getByText("Pick"));
    expect(getByText("Apple")).toBeTruthy();
  });

  it("shows the empty state when the search yields no rows", () => {
    const { getByText, getByPlaceholderText } = render(
      <Select
        value={null}
        options={options}
        onChange={() => {}}
        placeholder="Pick"
        searchPlaceholder="search"
        emptyLabel="No matches"
      />,
    );
    fireEvent.press(getByText("Pick"));
    fireEvent.changeText(getByPlaceholderText("search"), "zzz");
    expect(getByText("No matches")).toBeTruthy();
  });

  it("renders the invalid border state", () => {
    render(
      <Select value={null} options={options} onChange={() => {}} invalid />,
    );
  });
});
