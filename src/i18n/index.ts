import i18nDefault, { type InitOptions, type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

const i18n: I18nInstance = i18nDefault;

const STORAGE_KEY = "imi.lang";
export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: AppLocale = "es";
const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

function detectDeviceLocale(): AppLocale {
  const locales = Localization.getLocales?.() ?? [];
  for (const l of locales) {
    const code = l.languageCode?.toLowerCase();
    if (code && SUPPORTED_LOCALE_SET.has(code)) {
      return code as AppLocale;
    }
  }
  return DEFAULT_LOCALE;
}

let initialized = false;

export async function initI18n() {
  if (initialized) return i18n;
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const lng =
    stored && SUPPORTED_LOCALE_SET.has(stored)
      ? (stored as AppLocale)
      : detectDeviceLocale();

  const options: InitOptions = {
    lng,
    fallbackLng: DEFAULT_LOCALE,
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
    returnNull: false,
    compatibilityJSON: "v4",
  };

  await i18n.use(initReactI18next).init(options);
  initialized = true;
  return i18n;
}

export async function setAppLocale(locale: AppLocale) {
  await AsyncStorage.setItem(STORAGE_KEY, locale);
  await i18n.changeLanguage(locale);
}
