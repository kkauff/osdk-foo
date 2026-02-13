import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import appI18n from '../components/app/App.i18n.yml?raw';
import yaml from 'js-yaml';

const i18nData = yaml.load(appI18n) as {
  messages: Record<string, string>;
  translations: Record<string, Record<string, string>>;
};

const resources: Record<string, { translation: Record<string, string> }> = {
  en: { translation: i18nData.messages },
};

Object.keys(i18nData.translations).forEach((lang) => {
  resources[lang] = { translation: i18nData.translations[lang] };
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
