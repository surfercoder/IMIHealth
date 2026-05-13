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

interface PostProcessor {
  type: string;
  name: string;
  process: (
    value: unknown,
    key: string,
    options: Record<string, unknown> | undefined,
  ) => unknown;
}
interface MockI18n {
  use: (mod: unknown) => MockI18n;
  init: (options: unknown) => Promise<void>;
  changeLanguage: (locale: string) => Promise<void>;
  language: string;
}
const mockInit = jest.fn();
const mockChangeLanguage = jest.fn();
const capturedProcessors: PostProcessor[] = [];
const mockI18n: MockI18n = {
  use: (mod) => {
    if (mod && (mod as { type?: string }).type === "postProcessor") {
      capturedProcessors.push(mod as PostProcessor);
    }
    return mockI18n;
  },
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
  capturedProcessors.length = 0;
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

describe("icu postProcessor", () => {
  beforeEach(async () => {
    mockGetItem.mockResolvedValue("es");
    const { initI18n } = require("@/src/i18n");
    await initI18n();
  });

  function getProcessor() {
    const p = capturedProcessors.find((m) => m.name === "icu");
    if (!p) throw new Error("ICU post-processor was not registered");
    return p;
  }

  it("returns non-string values unchanged", () => {
    const p = getProcessor();
    expect(p.process(42, "k", { lng: "es" })).toBe(42);
  });

  it("returns strings without `{` unchanged (fast-path)", () => {
    const p = getProcessor();
    expect(p.process("hello", "k", { lng: "es" })).toBe("hello");
  });

  it("formats simple {name} placeholder with options as values", () => {
    const p = getProcessor();
    expect(p.process("Hi {name}", "k", { lng: "es", name: "Ana" })).toBe(
      "Hi Ana",
    );
  });

  it("falls back to options.lngs[0] when lng is missing", () => {
    const p = getProcessor();
    expect(
      p.process("Hi {name}", "k", { lngs: ["en", "es"], name: "Ana" }),
    ).toBe("Hi Ana");
  });

  it("falls back to default `es` when neither lng nor lngs is provided", () => {
    const p = getProcessor();
    expect(p.process("Hi {name}", "k", { name: "Ana" })).toBe("Hi Ana");
  });

  it("falls back to default `es` when options is undefined", () => {
    const p = getProcessor();
    expect(p.process("Hi {name}", "k", undefined)).toBe("Hi {name}");
  });

  it("returns the original value and warns when formatting throws", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const p = getProcessor();
    // Patch our mocked IntlMessageFormat to throw once via require cache lookup.
    const messageFormat = require("intl-messageformat");
    const original = messageFormat.IntlMessageFormat;
    messageFormat.IntlMessageFormat = function () {
      throw new Error("boom");
    };
    try {
      expect(p.process("Hi {name}", "k", { lng: "es", name: "Ana" })).toBe(
        "Hi {name}",
      );
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      messageFormat.IntlMessageFormat = original;
      warnSpy.mockRestore();
    }
  });
});
