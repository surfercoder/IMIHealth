import { render, fireEvent } from "@testing-library/react-native";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Divider,
  EmptyState,
  FormField,
  Input,
  PasswordInput,
  Screen,
  Text,
} from "@/src/components/ui";

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    Image: (props: object) => React.createElement(RN.View, props),
  };
});

describe("Text", () => {
  it("renders default variant", () => {
    const { getByText } = render(<Text>hello</Text>);
    expect(getByText("hello")).toBeTruthy();
  });

  it("applies variants, center, color, weight", () => {
    render(
      <Text variant="display" center color="#ff0000" weight="bold">
        x
      </Text>,
    );
    render(<Text variant="subtitle">y</Text>);
    render(<Text variant="bodyMuted">z</Text>);
    render(<Text variant="small">a</Text>);
    render(<Text variant="label">b</Text>);
    render(<Text variant="caption">c</Text>);
  });
});

describe("Badge", () => {
  it("renders all tones", () => {
    for (const tone of ["neutral", "success", "warning", "destructive", "info", "primary"] as const) {
      const { getByText } = render(<Badge label={tone} tone={tone} />);
      expect(getByText(tone)).toBeTruthy();
    }
  });

  it("defaults to neutral tone when omitted", () => {
    const { getByText } = render(<Badge label="hi" />);
    expect(getByText("hi")).toBeTruthy();
  });
});

describe("Divider", () => {
  it("renders", () => {
    render(<Divider />);
    render(<Divider style={{ margin: 4 }} />);
  });
});

describe("Avatar", () => {
  it("renders initials when no uri", () => {
    const { getByText } = render(<Avatar initials="MG" />);
    expect(getByText("MG")).toBeTruthy();
  });

  it("renders image when uri provided", () => {
    render(<Avatar uri="https://example/avatar.png" />);
  });

  it("supports custom size and empty initials", () => {
    render(<Avatar size={64} />);
  });
});

describe("Card", () => {
  it("renders all subcomponents", () => {
    const { getByText } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>
          <Text>Content</Text>
        </CardContent>
      </Card>,
    );
    expect(getByText("Title")).toBeTruthy();
    expect(getByText("Desc")).toBeTruthy();
    expect(getByText("Content")).toBeTruthy();
  });
});

describe("Screen", () => {
  it("renders padded by default", () => {
    render(
      <Screen>
        <Text>x</Text>
      </Screen>,
    );
  });

  it("respects hasHeader edges and explicit edges", () => {
    render(<Screen hasHeader padded={false}><Text>x</Text></Screen>);
    render(<Screen edges={["bottom"]}><Text>y</Text></Screen>);
  });
});

describe("EmptyState", () => {
  it("renders title only", () => {
    const { getByText } = render(<EmptyState title="Empty" />);
    expect(getByText("Empty")).toBeTruthy();
  });

  it("renders description, image, action", () => {
    const { getByText } = render(
      <EmptyState
        title="T"
        description="D"
        image={1}
        action={<Text>act</Text>}
      />,
    );
    expect(getByText("D")).toBeTruthy();
    expect(getByText("act")).toBeTruthy();
  });
});

describe("FormField", () => {
  it("renders label, required marker, hint, error", () => {
    const { getByText, rerender } = render(
      <FormField label="Name" hint="hint info" required>
        <Text>child</Text>
      </FormField>,
    );
    expect(getByText("hint info")).toBeTruthy();
    expect(getByText("child")).toBeTruthy();
    rerender(
      <FormField label="Name" error="err msg">
        <Text>child</Text>
      </FormField>,
    );
    expect(getByText("err msg")).toBeTruthy();
  });

  it("renders without label", () => {
    render(<FormField><Text>x</Text></FormField>);
  });
});

describe("Input", () => {
  it("calls onFocus/onBlur and renders left icon + right adornment", () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByPlaceholderText } = render(
      <Input
        placeholder="hi"
        invalid
        leftIcon={<Text>L</Text>}
        rightAdornment={<Text>R</Text>}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const input = getByPlaceholderText("hi");
    fireEvent(input, "focus", { nativeEvent: {} });
    fireEvent(input, "blur", { nativeEvent: {} });
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });

  it("renders without optional adornments/handlers", () => {
    const { getByPlaceholderText } = render(<Input placeholder="x" />);
    const input = getByPlaceholderText("x");
    fireEvent(input, "focus", { nativeEvent: {} });
    fireEvent(input, "blur", { nativeEvent: {} });
  });
});

describe("PasswordInput", () => {
  it("toggles visibility when the right icon is pressed", () => {
    const { getByPlaceholderText, getByLabelText } = render(
      <PasswordInput placeholder="pw" />,
    );
    expect(getByPlaceholderText("pw")).toBeTruthy();
    const toggle = getByLabelText("Show password");
    fireEvent.press(toggle);
    expect(getByLabelText("Hide password")).toBeTruthy();
  });
});

describe("Button", () => {
  it("renders title and triggers onPress", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Go" onPress={onPress} />);
    fireEvent.press(getByText("Go"));
    expect(onPress).toHaveBeenCalled();
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="No" disabled onPress={onPress} />,
    );
    fireEvent.press(getByText("No"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders loading state", () => {
    render(<Button title="L" loading />);
  });

  it("renders variants and sizes and icons", () => {
    for (const variant of ["primary", "secondary", "outline", "ghost", "destructive"] as const) {
      render(<Button title={variant} variant={variant} />);
    }
    for (const size of ["sm", "md", "lg"] as const) {
      render(<Button title={size} size={size} />);
    }
    render(
      <Button
        title="x"
        leftIcon={<Text>L</Text>}
        rightIcon={<Text>R</Text>}
        fullWidth
      />,
    );
  });
});
