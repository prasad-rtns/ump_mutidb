'use client';
import { useEffect } from 'react';
import { usePublicSettings } from '@/hooks/use-public-settings';
import type { ISystemSetting } from '@/types';

const COLOR_SETTING_VARS: Record<string, string[]> = {
  'ui.theme.background': ['--background'],
  'ui.theme.foreground': ['--foreground'],
  'ui.theme.card': ['--card', '--popover'],
  'ui.theme.cardForeground': ['--card-foreground', '--popover-foreground'],
  'ui.theme.primary': ['--primary', '--ring'],
  'ui.theme.primaryForeground': ['--primary-foreground'],
  'ui.theme.border': ['--border', '--input'],
  'ui.theme.sidebar.background': ['--sidebar-background'],
  'ui.theme.sidebar.foreground': ['--sidebar-foreground'],
  'ui.theme.sidebar.active': ['--sidebar-primary', '--sidebar-ring'],
  'ui.theme.sidebar.activeForeground': ['--sidebar-primary-foreground'],
  'ui.theme.sidebar.accent': ['--sidebar-accent'],
  'ui.theme.sidebar.accentForeground': ['--sidebar-accent-foreground'],
  'ui.theme.footer.background': ['--footer-background'],
  'ui.theme.footer.foreground': ['--footer-foreground'],
};

function settingMap(settings?: ISystemSetting[]) {
  return new Map((settings ?? []).map((setting) => [setting.key, String(setting.value ?? '').trim()]));
}

function hexToHsl(hex: string) {
  const normalized = hex.trim();
  const match = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(normalized);
  if (!match) return null;

  const value = match[1].length === 3
    ? match[1].split('').map((char) => `${char}${char}`).join('')
    : match[1];

  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
    }
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function applyTheme(settings?: ISystemSetting[]) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const values = settingMap(settings);

  Object.entries(COLOR_SETTING_VARS).forEach(([key, cssVars]) => {
    const hsl = hexToHsl(values.get(key) ?? '');
    if (!hsl) return;
    cssVars.forEach((cssVar) => root.style.setProperty(cssVar, hsl));
  });
}

export function ThemeSettings() {
  const { data } = usePublicSettings();

  useEffect(() => {
    applyTheme(data);
  }, [data]);

  return null;
}
