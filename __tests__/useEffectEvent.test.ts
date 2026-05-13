import { renderHook, act } from "@testing-library/react-native";
import { useEffectEvent } from "@/src/hooks/useEffectEvent";

describe("useEffectEvent", () => {
  it("returns a stable callable that invokes the latest handler", () => {
    const seen: string[] = [];
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) =>
        useEffectEvent(() => {
          seen.push(value);
          return value;
        }),
      { initialProps: { value: "first" } },
    );
    const initial = result.current;
    act(() => {
      initial();
    });
    rerender({ value: "second" });
    act(() => {
      initial();
    });
    expect(initial).toBe(result.current);
    expect(seen).toEqual(["first", "second"]);
  });
});
