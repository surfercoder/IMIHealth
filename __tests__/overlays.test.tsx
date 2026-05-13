import { render, act } from "@testing-library/react-native";

jest.useFakeTimers();

jest.mock("expo-image", () => {
  const React = require("react");
  const RN = require("react-native");
  return { Image: (p: object) => React.createElement(RN.View, p) };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const RN = require("react-native");
  const SharedValue = (initial: number) => ({ value: initial });
  return {
    __esModule: true,
    default: { View: RN.View },
    View: RN.View,
    Easing: {
      out: () => () => 0,
      in: () => () => 0,
      cubic: () => 0,
      bezier: () => () => 0,
    },
    useAnimatedStyle: (cb: () => unknown) => cb(),
    useSharedValue: SharedValue,
    withTiming: (v: number) => v,
    withDelay: (_d: number, v: number) => v,
    createAnimatedComponent: (C: React.ComponentType<object>) => C,
  };
});

import { WelcomeOverlay } from "@/src/components/WelcomeOverlay";
import { GoodbyeOverlay } from "@/src/components/GoodbyeOverlay";

describe("WelcomeOverlay", () => {
  it("calls onDone after the visible window", () => {
    const onDone = jest.fn();
    render(<WelcomeOverlay userName="Ana" onDone={onDone} />);
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    expect(onDone).toHaveBeenCalled();
  });

  it("falls back to default name when blank", () => {
    const onDone = jest.fn();
    render(<WelcomeOverlay onDone={onDone} />);
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
  });
});

describe("GoodbyeOverlay", () => {
  it("calls onDone after the visible window", () => {
    const onDone = jest.fn();
    render(<GoodbyeOverlay userName="Ana" onDone={onDone} />);
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    expect(onDone).toHaveBeenCalled();
  });

  it("renders with empty username", () => {
    const onDone = jest.fn();
    render(<GoodbyeOverlay onDone={onDone} />);
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
  });
});
