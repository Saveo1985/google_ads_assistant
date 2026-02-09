import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import de from '../locales/de.json';
import en from '../locales/en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            de: { translation: de },
            en: { translation: en }
        },
        lng: 'de', // Fallback to German if detection fails or is disabled (though detector should take precedence if no stored language)
        fallbackLng: 'de',
        interpolation: {
            escapeValue: false // React handles escaping
        }
    });

export default i18n;
