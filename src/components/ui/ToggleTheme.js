import React, { useEffect, useState } from 'react';
import Button from './Button';

const STORAGE_KEY = 'app-theme';

export function ToggleTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <Button variant="outline" size="sm" onClick={toggle} aria-label="Toggle dark mode">
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </Button>
  );
}

export default ToggleTheme;
