import { fireEvent, render } from "@testing-library/react-native";

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

jest.mock("@/src/components/AvatarPicker", () => ({
  AvatarPicker: () => null,
}));
jest.mock("@/src/components/SignaturePad", () => ({
  SignaturePad: () => null,
}));

import { PlanChip } from "@/src/components/signup/PlanChip";
import { SignupFields } from "@/src/components/signup/SignupFields";
import { useForm } from "react-hook-form";

describe("PlanChip", () => {
  it("renders inactive and triggers onPress", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PlanChip label="Free" active={false} onPress={onPress} />,
    );
    fireEvent.press(getByText("Free"));
    expect(onPress).toHaveBeenCalled();
  });

  it("renders active state", () => {
    render(<PlanChip label="Pro" active onPress={() => {}} />);
  });
});

function Wrapper() {
  const { control } = useForm({
    defaultValues: {
      name: "",
      email: "",
      dni: "",
      matricula: "",
      phone: "",
      especialidad: "",
      tagline: "",
      avatar: "",
      firmaDigital: "",
      password: "",
      confirmPassword: "",
    },
  });
  return <SignupFields control={control} nameValue="" />;
}

describe("SignupFields", () => {
  it("renders all controllers", () => {
    const { getByPlaceholderText } = render(<Wrapper />);
    expect(getByPlaceholderText("signupForm.fullNamePlaceholder")).toBeTruthy();
    expect(getByPlaceholderText("signupForm.emailPlaceholder")).toBeTruthy();
    expect(getByPlaceholderText("signupForm.taglinePlaceholder")).toBeTruthy();
  });
});
