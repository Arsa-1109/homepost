"use client";

import { useServerInsertedHTML } from "next/navigation";

const themeScript = `(function() {
  try {
    var stored = localStorage.getItem('theme') || 'system';
    var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  } catch (e) {}
})();`;

export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script
      key="theme-init-script"
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  ));

  return null;
}
