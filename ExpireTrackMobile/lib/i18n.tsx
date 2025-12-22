import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { useSettingsStore } from '../store/settingsStore';
import { en } from './translations/en';
import { fr } from './translations/fr';

// Initialize i18n
const i18n = new I18n({
    en,
    fr,
});

// Set default locale based on system if not set, or default to en
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function useI18n() {
    const { language } = useSettingsStore();

    // Update locale whenever store changes
    i18n.locale = language;

    return {
        t: (key: string, options?: any) => i18n.t(key, options),
        locale: language,
    };
}
