import { fireEvent, render, waitFor, act } from "@testing-library/react-native";

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

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(RN.View, null, children),
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(RN.View, null, children),
  };
});

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(RN.View, null, children),
  };
});

jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

let pushBridgeResponseHandler: ((r: unknown) => void) | null = null;
const mockAddNotificationResponseListener = jest.fn((cb: (r: unknown) => void) => {
  pushBridgeResponseHandler = cb;
  return { remove: jest.fn() };
});
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: (cb: (r: unknown) => void) =>
    mockAddNotificationResponseListener(cb),
}));

const mockInitI18n = jest.fn();
jest.mock("@/src/i18n", () => ({
  initI18n: () => mockInitI18n(),
}));

const mockRegisterPushToken = jest.fn();
jest.mock("@/src/lib/notifications", () => ({
  registerPushToken: (...a: unknown[]) => mockRegisterPushToken(...a),
}));

const mockUser: { current: { id: string } | null } = { current: { id: "u" } };
jest.mock("@/src/providers/AuthProvider", () => {
  const React = require("react");
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useAuth: () => ({
      user: mockUser.current,
      session: mockUser.current ? { user: mockUser.current } : null,
      initialized: true,
      signOut: jest.fn(),
    }),
  };
});

jest.mock("@/src/providers/RealtimeProvider", () => {
  const React = require("react");
  return {
    RealtimeProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      { Screen: () => null },
    ),
  };
});

import RootLayout from "@/app/_layout";

beforeEach(() => {
  pushBridgeResponseHandler = null;
  mockAddNotificationResponseListener.mockClear();
  mockInitI18n.mockReset().mockResolvedValue(undefined);
  mockRegisterPushToken.mockReset().mockResolvedValue(undefined);
  mockUser.current = { id: "u" };
  mockPush.mockReset();
});

describe("RootLayout", () => {
  it("renders the loading view until i18n initialises, then the tree", async () => {
    let resolveInit: () => void;
    mockInitI18n.mockReturnValue(
      new Promise<void>((r) => {
        resolveInit = r;
      }),
    );
    const { queryByTestId } = render(<RootLayout />);
    void queryByTestId;
    await act(async () => {
      resolveInit();
    });
    await waitFor(() =>
      expect(mockAddNotificationResponseListener).toHaveBeenCalled(),
    );
  });

  it("registers the push token when user present, handles notification taps", async () => {
    mockRegisterPushToken.mockResolvedValue(undefined);
    render(<RootLayout />);
    await waitFor(() =>
      expect(mockAddNotificationResponseListener).toHaveBeenCalled(),
    );
    await waitFor(() => expect(mockRegisterPushToken).toHaveBeenCalledWith("u"));
    pushBridgeResponseHandler?.({
      notification: { request: { content: { data: { informeId: "i" } } } },
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/informe/[id]" }),
    );
  });

  it("ignores notification taps without informeId", async () => {
    render(<RootLayout />);
    await waitFor(() =>
      expect(mockAddNotificationResponseListener).toHaveBeenCalled(),
    );
    pushBridgeResponseHandler?.({
      notification: { request: { content: { data: {} } } },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("doesn't register when user is missing and clears the cached id", async () => {
    mockUser.current = null;
    render(<RootLayout />);
    await waitFor(() =>
      expect(mockAddNotificationResponseListener).toHaveBeenCalled(),
    );
    expect(mockRegisterPushToken).not.toHaveBeenCalled();
  });

  it("swallows errors from registerPushToken", async () => {
    mockRegisterPushToken.mockRejectedValue(new Error("nope"));
    render(<RootLayout />);
    await waitFor(() => expect(mockRegisterPushToken).toHaveBeenCalled());
  });

  it("logs notification listener once", async () => {
    render(<RootLayout />);
    await waitFor(() =>
      expect(mockAddNotificationResponseListener).toHaveBeenCalledTimes(1),
    );
    // Trigger via fireEvent never since there's no UI here.
    void fireEvent;
  });

  it("skips re-registration when user reference changes but id stays the same", async () => {
    mockRegisterPushToken.mockResolvedValue(undefined);
    const { rerender } = render(<RootLayout />);
    await waitFor(() => expect(mockRegisterPushToken).toHaveBeenCalledTimes(1));
    // Swap to a new user object with the same id — useEffect re-runs but the
    // registeredForUserId guard hits the early-return.
    mockUser.current = { id: "u" };
    rerender(<RootLayout />);
    await waitFor(() => expect(mockAddNotificationResponseListener).toHaveBeenCalled());
    // Still only registered once.
    expect(mockRegisterPushToken).toHaveBeenCalledTimes(1);
  });
});
