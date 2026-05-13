import { renderHook, act } from "@testing-library/react-native";
import {
  clearGoodbye,
  clearWelcome,
  triggerGoodbye,
  triggerWelcome,
  useAuthTransitions,
} from "@/src/lib/authTransitions";

afterEach(() => {
  clearWelcome();
  clearGoodbye();
});

describe("authTransitions", () => {
  it("starts cleared", () => {
    const { result } = renderHook(() => useAuthTransitions());
    expect(result.current).toEqual({ welcome: false, goodbye: false });
  });

  it("triggerWelcome flips welcome flag", () => {
    const { result } = renderHook(() => useAuthTransitions());
    act(() => triggerWelcome());
    expect(result.current.welcome).toBe(true);
  });

  it("triggerGoodbye flips goodbye flag", () => {
    const { result } = renderHook(() => useAuthTransitions());
    act(() => triggerGoodbye());
    expect(result.current.goodbye).toBe(true);
  });

  it("clearWelcome is a no-op when already cleared", () => {
    const { result } = renderHook(() => useAuthTransitions());
    clearWelcome();
    expect(result.current.welcome).toBe(false);
  });

  it("clearGoodbye is a no-op when already cleared", () => {
    const { result } = renderHook(() => useAuthTransitions());
    clearGoodbye();
    expect(result.current.goodbye).toBe(false);
  });

  it("clears flags after triggering", () => {
    const { result } = renderHook(() => useAuthTransitions());
    act(() => triggerWelcome());
    act(() => clearWelcome());
    expect(result.current.welcome).toBe(false);
    act(() => triggerGoodbye());
    act(() => clearGoodbye());
    expect(result.current.goodbye).toBe(false);
  });

  it("unmounting removes listener (no error on subsequent triggers)", () => {
    const { unmount } = renderHook(() => useAuthTransitions());
    unmount();
    expect(() => {
      triggerWelcome();
      clearWelcome();
    }).not.toThrow();
  });
});
