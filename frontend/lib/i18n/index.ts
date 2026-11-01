import { ar, type Dictionary } from './ar';
import { en } from './en';

// Supported languages
export type Lang = 'ar' | 'en';
export type { Dictionary };

// Dictionary per language
export const dictionaries: Record<Lang, Dictionary> = { ar, en };

// Text direction per language
export const directions: Record<Lang, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};
