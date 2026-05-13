import { useCallback, useInsertionEffect, useRef } from "react";

/**
 * Polyfill for React's `useEffectEvent` — captures the latest props/state in a
 * callback that can be invoked from inside effects without re-subscribing.
 */
export function useEffectEvent<TArgs extends unknown[], TReturn>(
  handler: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  const ref = useRef(handler);
  useInsertionEffect(() => {
    ref.current = handler;
  }, [handler]);
  return useCallback((...args: TArgs) => ref.current(...args), []);
}
