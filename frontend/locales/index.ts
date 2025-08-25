import { te } from './te';
import { en } from './en';
import { hi } from './hi';
import { kn } from './kn';

export const dictionaries = {
  te,
  en,
  hi,
  kn,
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = typeof te;
