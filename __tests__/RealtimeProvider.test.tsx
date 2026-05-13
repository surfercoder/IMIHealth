import { render } from "@testing-library/react-native";

let mockUser: { id: string } | null = null;
jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));

interface MockChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
}
let mockChangeHandler: ((p: { new?: unknown; old?: unknown }) => void) | null = null;
const mockChannel: MockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};
mockChannel.on.mockImplementation((_event: string, _filter: unknown, cb: (p: unknown) => void) => {
  mockChangeHandler = cb as (p: { new?: unknown; old?: unknown }) => void;
  return mockChannel;
});
mockChannel.subscribe.mockImplementation(() => mockChannel);
const mockRemoveChannel = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    channel: () => mockChannel,
    removeChannel: (...a: unknown[]) => mockRemoveChannel(...a),
  },
}));

const mockSchedule = jest.fn();
jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: (...a: unknown[]) => mockSchedule(...a),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { RealtimeProvider } from "@/src/providers/RealtimeProvider";

beforeEach(() => {
  mockUser = null;
  mockChannel.on.mockClear();
  mockChannel.subscribe.mockClear();
  mockChannel.unsubscribe.mockClear();
  mockRemoveChannel.mockReset();
  mockSchedule.mockReset().mockResolvedValue(undefined);
  mockChangeHandler = null;
});

describe("RealtimeProvider", () => {
  it("does nothing when no user", () => {
    render(<RealtimeProvider />);
    expect(mockChannel.subscribe).not.toHaveBeenCalled();
  });

  it("subscribes to channel when user is present", () => {
    mockUser = { id: "u" };
    render(<RealtimeProvider />);
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it("ignores updates without newRow", () => {
    mockUser = { id: "u" };
    render(<RealtimeProvider />);
    mockChangeHandler?.({ new: null });
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("ignores updates that aren't a status transition", () => {
    mockUser = { id: "u" };
    render(<RealtimeProvider />);
    mockChangeHandler?.({
      new: { id: "i", status: "completed" },
      old: { status: "completed" },
    });
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("schedules a notification on completed transition", () => {
    mockUser = { id: "u" };
    render(<RealtimeProvider />);
    mockChangeHandler?.({
      new: { id: "i", status: "completed" },
      old: { status: "processing" },
    });
    expect(mockSchedule).toHaveBeenCalled();
  });

  it("schedules a notification on error transition", () => {
    mockUser = { id: "u" };
    render(<RealtimeProvider />);
    mockChangeHandler?.({
      new: { id: "i", status: "error" },
      old: { status: "processing" },
    });
    expect(mockSchedule).toHaveBeenCalled();
  });

  it("swallows notification errors", async () => {
    mockSchedule.mockReturnValue(Promise.reject(new Error("nope")));
    mockUser = { id: "u" };
    render(<RealtimeProvider />);
    await Promise.resolve();
    expect(() =>
      mockChangeHandler?.({
        new: { id: "i", status: "completed" },
        old: { status: "processing" },
      }),
    ).not.toThrow();
  });

  it("cleans up channel on unmount", () => {
    mockUser = { id: "u" };
    const { unmount } = render(<RealtimeProvider />);
    unmount();
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
