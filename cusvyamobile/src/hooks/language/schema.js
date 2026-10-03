import * as z from 'zod';
export const languageSchema = z.enum([
    "en-EN" /* SupportedLanguages.EN_EN */,
    "fr-FR" /* SupportedLanguages.FR_FR */,
]);
