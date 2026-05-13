const mockIsDevice = { current: true };
jest.mock("expo-device", () => ({
  get isDevice() {
    return mockIsDevice.current;
  },
}));

const mockSetHandler = jest.fn();
const mockSetChannel = jest.fn();
const mockGetPerm = jest.fn();
const mockRequestPerm = jest.fn();
const mockGetToken = jest.fn();
jest.mock("expo-notifications", () => ({
  setNotificationHandler: (...a: unknown[]) => mockSetHandler(...a),
  setNotificationChannelAsync: (...a: unknown[]) => mockSetChannel(...a),
  getPermissionsAsync: (...a: unknown[]) => mockGetPerm(...a),
  requestPermissionsAsync: (...a: unknown[]) => mockRequestPerm(...a),
  getExpoPushTokenAsync: (...a: unknown[]) => mockGetToken(...a),
  AndroidImportance: { DEFAULT: 3 },
}));

let mockOS = "ios";
jest.mock("react-native", () => ({
  Platform: {
    get OS() {
      return mockOS;
    },
  },
}));

const mockProjectId = { current: undefined as string | undefined };
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { eas: { projectId: mockProjectId.current } } };
    },
    get easConfig() {
      return undefined;
    },
  },
}));

const mockEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn((_table: string) => ({ update: mockUpdate }));
jest.mock("@/src/lib/supabase", () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

let registerPushToken: (id: string) => Promise<void>;

beforeAll(() => {
  // Require after mocks (and their `mock`-prefixed bindings) are initialised.
  ({ registerPushToken } = require("@/src/lib/notifications"));
});

beforeEach(() => {
  mockIsDevice.current = true;
  mockOS = "ios";
  mockProjectId.current = "proj-1";
  mockSetHandler.mockReset();
  mockSetChannel.mockReset().mockResolvedValue(undefined);
  mockGetPerm.mockReset();
  mockRequestPerm.mockReset();
  mockGetToken.mockReset();
  mockUpdate.mockClear();
  mockEq.mockReset();
  mockFrom.mockClear();
});

describe("registerPushToken", () => {
  it("does nothing on simulator", async () => {
    mockIsDevice.current = false;
    await registerPushToken("d");
    expect(mockGetPerm).not.toHaveBeenCalled();
  });

  it("creates Android channel on Android", async () => {
    mockOS = "android";
    mockGetPerm.mockResolvedValue({ status: "granted" });
    mockGetToken.mockResolvedValue({ data: "tok" });
    mockEq.mockResolvedValue({ data: null, error: null });
    await registerPushToken("d");
    expect(mockSetChannel).toHaveBeenCalledWith("default", expect.any(Object));
  });

  it("requests permission when not granted", async () => {
    mockGetPerm.mockResolvedValue({ status: "denied" });
    mockRequestPerm.mockResolvedValue({ status: "granted" });
    mockGetToken.mockResolvedValue({ data: "tok" });
    mockEq.mockResolvedValue({ data: null, error: null });
    await registerPushToken("d");
    expect(mockRequestPerm).toHaveBeenCalled();
  });

  it("bails out if permission still denied", async () => {
    mockGetPerm.mockResolvedValue({ status: "denied" });
    mockRequestPerm.mockResolvedValue({ status: "denied" });
    await registerPushToken("d");
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it("warns and bails if no projectId", async () => {
    mockProjectId.current = undefined;
    mockGetPerm.mockResolvedValue({ status: "granted" });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    await registerPushToken("d");
    expect(warn).toHaveBeenCalled();
    expect(mockGetToken).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("skips db write when token is empty", async () => {
    mockGetPerm.mockResolvedValue({ status: "granted" });
    mockGetToken.mockResolvedValue({ data: "" });
    await registerPushToken("d");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("writes the push token to doctors table", async () => {
    mockGetPerm.mockResolvedValue({ status: "granted" });
    mockGetToken.mockResolvedValue({ data: "tok" });
    mockEq.mockResolvedValue({ data: null, error: null });
    await registerPushToken("d");
    expect(mockUpdate).toHaveBeenCalledWith({ push_token: "tok" });
    expect(mockEq).toHaveBeenCalledWith("id", "d");
  });
});
