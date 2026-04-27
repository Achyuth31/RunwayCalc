/**
 * theme.js — Dark/Light Theme Toggle
 * ====================================
 * Persists user preference in localStorage.
 * Toggles [data-theme] on <html> and updates
 * the toggle button icon accordingly.
 */

(function initTheme() {
  'use strict';

  const STORAGE_KEY = 'runwaycalc-theme';
  const html = document.documentElement;

  /**
   * Applies the given theme and persists the choice.
   * @param {'light'|'dark'} theme
   */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Update every toggle button on the page (landing + app share this file)
    document.querySelectorAll('#themeToggle').forEach(function (button) {
      button.textContent = theme === 'dark' ? '☀️' : '🌙';
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  /**
   * Determines the initial theme from:
   * 1. localStorage (user explicitly chose)
   * 2. OS-level prefers-color-scheme
   * 3. Defaults to "light"
   */
  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Apply on load
  applyTheme(getInitialTheme());

  // Bind toggle buttons (deferred to ensure DOM is ready)
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#themeToggle').forEach(function (button) {
      button.addEventListener('click', function () {
        const current = html.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });
  });

  // Listen for OS-level changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (event) {
      // Only auto-switch if user hasn't explicitly set a preference
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }
})();
