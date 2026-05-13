const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: (...a: unknown[]) => mockGetItem(...a),
    setItem: (...a: unknown[]) => mockSetItem(...a),
  },
}));

const mockGetLocales = jest.fn();
jest.mock("expo-localization", () => ({
  getLocales: (...a: unknown[]) => mockGetLocales(...a),
}));

interface MockI18n {
  use: () => MockI18n;
  init: (options: unknown) => Promise<void>;
  changeLanguage: (locale: string) => Promise<void>;
  language: string;
}
const mockInit = jest.fn();
const mockChangeLanguage = jest.fn();
const mockI18n: MockI18n = {
  use: () => mockI18n,
  init: (options: unknown) => mockInit(options),
  changeLanguage: (locale: string) => mockChangeLanguage(locale),
  language: "es",
};
jest.mock("i18next", () => ({
  __esModule: true,
  default: mockI18n,
}));
jest.mock("react-i18next", () => ({
  initReactI18next: { type: "react" },
}));

beforeEach(() => {
  jest.resetModules();
  mockGetItem.mockReset();
  mockSetItem.mockReset();
  mockGetLocales.mockReset();
  mockInit.mockReset().mockResolvedValue(undefined);
  mockChangeLanguage.mockReset().mockResolvedValue(undefined);
});

describe("i18n", () => {
  it("init uses stored locale when supported", async () => {
    mockGetItem.mockResolvedValue("en");
    const { initI18n } = require("@/src/i18n");
    await initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ lng: "en" }));
  });

  it("falls back to device locale when no stored value", async () => {
    mockGetItem.mockResolvedValue(null);
    mockGetLocales.mockReturnValue([{ languageCode: "EN" }]);
    const { initI18n } = require("@/src/i18n");
    await initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ lng: "en" }));
  });

  it("falls back to default when locales has no supported language", async () => {
    mockGetItem.mockResolvedValue(null);
    mockGetLocales.mockReturnValue([{ languageCode: "fr" }, { languageCode: undefined }]);
    const { initI18n } = require("@/src/i18n");
    await initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ lng: "es" }));
  });

  it("handles missing getLocales", async () => {
    mockGetItem.mockResolvedValue(null);
    mockGetLocales.mockReturnValue([]);
    const { initI18n } = require("@/src/i18n");
    await initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ lng: "es" }));
  });

  it("re-init returns the cached instance", async () => {
    mockGetItem.mockResolvedValue("es");
    const { initI18n } = require("@/src/i18n");
    await initI18n();
    await initI18n();
    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it("setAppLocale persists and changes language", async () => {
    mockGetItem.mockResolvedValue("es");
    const mod = require("@/src/i18n");
    await mod.setAppLocale("en");
    expect(mockSetItem).toHaveBeenCalledWith("imi.lang", "en");
    expect(mockChangeLanguage).toHaveBeenCalledWith("en");
  });
});
