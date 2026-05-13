import { renderHook, act, waitFor } from "@testing-library/react-native";
import { type PropsWithChildren } from "react";

let mockSession: unknown = null;
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignOut = jest.fn();
const mockStartRefresh = jest.fn();
const mockStopRefresh = jest.fn();

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: (event: string, s: unknown) => void) =>
        mockOnAuthStateChange(cb),
      signOut: () => mockSignOut(),
      startAutoRefresh: () => mockStartRefresh(),
      stopAutoRefresh: () => mockStopRefresh(),
    },
  },
}));

const mockAddEventListener = jest.fn();
jest.mock("react-native", () => ({
  AppState: {
    addEventListener: (...a: unknown[]) => mockAddEventListener(...a),
  },
}));

import { AuthProvider, useAuth } from "@/src/providers/AuthProvider";

let authStateCb: ((event: string, s: unknown) => void) | null = null;
let appStateCb: ((next: string) => void) | null = null;
let appStateRemove: jest.Mock;
let authSubUnsub: jest.Mock;

beforeEach(() => {
  mockSession = null;
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
  mockSignOut.mockReset();
  mockStartRefresh.mockReset();
  mockStopRefresh.mockReset();
  mockAddEventListener.mockReset();

  authSubUnsub = jest.fn();
  mockOnAuthStateChange.mockImplementation((cb) => {
    authStateCb = cb;
    return { data: { subscription: { unsubscribe: authSubUnsub } } };
  });

  appStateRemove = jest.fn();
  mockAddEventListener.mockImplementation((_event, cb) => {
    appStateCb = cb;
    return { remove: appStateRemove };
  });
});

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider", () => {
  it("initialises with no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initialized).toBe(true));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("hydrates with a session from getSession", async () => {
    mockSession = { user: { id: "u" } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.id).toBe("u"));
  });

  it("updates on auth state change", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => authStateCb?.("SIGNED_IN", { user: { id: "z" } }));
    expect(result.current.user?.id).toBe("z");
  });

  it("ignores getSession after unmount", async () => {
    let resolveSession!: (value: unknown) => void;
    mockGetSession.mockReturnValue(new Promise((r) => (resolveSession = r)));
    const { result, unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();
    await act(async () => {
      resolveSession({ data: { session: { user: { id: "late" } } } });
    });
    expect(result.current.user).toBeNull();
    expect(authSubUnsub).toHaveBeenCalled();
    expect(appStateRemove).toHaveBeenCalled();
  });

  it("starts/stops supabase auto refresh on AppState change", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mockGetSession).toHaveBeenCalled());
    act(() => appStateCb?.("active"));
    expect(mockStartRefresh).toHaveBeenCalled();
    act(() => appStateCb?.("background"));
    expect(mockStopRefresh).toHaveBeenCalled();
  });

  it("signOut calls supabase.auth.signOut", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignOut.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initialized).toBe(true));
    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSignOut).toHaveBeenCalled();
  });
});
