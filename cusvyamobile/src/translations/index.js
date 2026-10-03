import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en-EN.json';
import fr from './fr-FR.json';
export const defaultNS = 'cusvyamobile';
export const resources = {
    'en-EN': en,
    'fr-FR': fr,
};
void i18n.use(initReactI18next).init({
    defaultNS,
    fallbackLng: 'fr-FR',
    lng: 'fr-FR',
    resources,
});
// add capitalization formatter
i18n.services.formatter?.add('capitalize', (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase());
export { default } from 'i18next';
