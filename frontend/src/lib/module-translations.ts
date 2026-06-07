import type { IModuleMenu } from '@/types';

type TranslationParams = Record<string, string | number | null | undefined>;
type Translate = (key: string, params?: TranslationParams, fallback?: string) => string;

export function moduleTranslationKey(code?: string | null) {
  return String(code ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function translatedModuleName(module: Pick<IModuleMenu, 'code' | 'name'>, t: Translate) {
  const key = moduleTranslationKey(module.code);
  return key ? t(`menus.${key}`, {}, module.name) : module.name;
}
