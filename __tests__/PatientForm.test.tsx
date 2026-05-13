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
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: "es" },
  }),
}));

import { PatientForm } from "@/src/components/PatientForm";

describe("PatientForm", () => {
  it("submits cleaned values", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = render(
      <PatientForm onSubmit={onSubmit} onCancel={() => {}} submitLabel="Save" />,
    );
    fireEvent.changeText(
      getByPlaceholderText("nuevoInformeDialog.fullNamePlaceholder"),
      "Ana Lopez",
    );
    fireEvent.press(getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].name).toBe("Ana Lopez");
  });

  it("triggers cancel handler", () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <PatientForm onSubmit={() => {}} onCancel={onCancel} />,
    );
    fireEvent.press(getByText("common.cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders without cancel when not provided", () => {
    render(<PatientForm onSubmit={() => {}} />);
  });

  it("renders initial values", () => {
    const { getByDisplayValue } = render(
      <PatientForm
        onSubmit={() => {}}
        initial={{
          name: "Pre",
          dni: "12345678",
          dob: "1990-01-01",
          phone: "+1",
          email: "x@y.z",
          obra_social: "OSDE",
          nro_afiliado: "A",
          plan: "P",
        }}
      />,
    );
    expect(getByDisplayValue("Pre")).toBeTruthy();
    expect(getByDisplayValue("12345678")).toBeTruthy();
    expect(getByDisplayValue("1990-01-01")).toBeTruthy();
  });
});
